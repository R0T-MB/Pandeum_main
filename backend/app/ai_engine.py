import json
import re
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted
import httpx
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from .config import settings
from .models import Provider, UserMemory
from .crud import get_provider_rating

genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

class AIEngine:
    @staticmethod
    async def _generate_with_openrouter(prompt: str) -> Optional[Dict[str, Any]]:
        """Fallback a OpenRouter si está configurado."""
        if not settings.OPENROUTER_API_KEY:
            return None
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": settings.OPENROUTER_MODEL,
                        "messages": [
                            {
                                "role": "system",
                                "content": "Eres Pandeum, un asistente experto en resolver problemas. Devuelve SOLO JSON válido sin texto adicional."
                            },
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ]
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    # Limpiar posibles marcadores de código
                    if content.startswith("```json"):
                        content = content[7:]
                    if content.startswith("```"):
                        content = content[3:]
                    if content.endswith("```"):
                        content = content[:-3]
                    content = content.strip()
                    
                    try:
                        return json.loads(content)
                    except json.JSONDecodeError:
                        return None
                return None
        except Exception:
            # Si OpenRouter falla, no romper el endpoint
            return None

    @staticmethod
    def _normalize_ai_response(ai_result: Dict[str, Any]) -> Dict[str, Any]:
        """Normaliza respuesta de IA para asegurar estructura completa."""
        return {
            "confidence_score": ai_result.get("confidence_score", 0.5),
            "diagnosis": ai_result.get("diagnosis", {"possible_causes": [], "questions": []}),
            "instant_solutions": ai_result.get("instant_solutions", []),
            "urgency": ai_result.get("urgency", "medium"),
            "has_providers": False,
            "providers": [],
            "composite_solution": ai_result.get("composite_solution"),
            "fallback": ai_result.get("fallback")
        }

    @staticmethod
    def _generate_natural_message(problem: str, has_providers: bool, is_health_related: bool) -> str:
        """Genera mensaje natural contextual basado en el problema."""
        problem_lower = problem.lower()
        
        # Temas de salud
        if is_health_related:
            return "Siento que estés pasando por eso. Te dejo una orientación general; si el dolor es fuerte, empeora o continúa, busca atención médica."
        
        # Compras/conseguir algo (antes de aprendizaje para evitar falsos positivos)
        if any(kw in problem_lower for kw in ['conseguir', 'comprar', 'donde', 'dónde', 'barata', 'barato', 'precio', 'oferta']):
            if has_providers:
                return "Claro, veamos opciones prácticas para conseguir lo que necesitas sin descuidar la calidad."
            return "Claro, veamos opciones prácticas para conseguir lo que necesitas sin descuidar la calidad."
        
        # Aprender/educación (requiere verbos de acción, no solo el instrumento)
        if any(kw in problem_lower for kw in ['aprender', 'tocar', 'estudiar', 'curso', 'clase', 'practicar']):
            return "¡Qué buena idea! Te dejo una ruta sencilla para empezar desde cero y avanzar sin confundirte."
        
        # Dinero/finanzas
        if any(kw in problem_lower for kw in ['dinero', 'ingreso', 'ganar', 'ganancia', 'sueldo', 'trabajo']):
            return "Entiendo. Te dejo ideas realistas para organizarte mejor y buscar ingresos adicionales de forma segura."
        
        # Problemas técnicos
        if any(kw in problem_lower for kw in ['internet', 'router', 'wifi', 'conectividad', 'red', 'no funciona', 'error', 'computadora', 'pc', 'laptop', 'celular', 'telefono', 'teléfono', 'bateria', 'batería', 'pantalla', 'carga', 'apagando', 'apaga']):
            return "Vamos por partes. Esto puede tener varias causas, así que te dejo pruebas rápidas para identificar el problema."
        
        # Caso general con proveedores
        if has_providers:
            return "Encontré una posible explicación y también especialistas disponibles que podrían ayudarte."
        
        # Caso general sin proveedores
        return "Te dejo una guía práctica para revisar el problema y decidir qué hacer después."

    @staticmethod
    def _detect_follow_up(problem: str) -> tuple[bool, Optional[int]]:
        """Detecta si el mensaje es un follow-up y extrae el número de opción si existe."""
        problem_lower = problem.lower()
        
        follow_up_keywords = [
            'me interesa la', 'la opcion', 'la opción', 'opcion', 'opción',
            'hablame mas', 'háblame más', 'dame mas detalle', 'explícame mejor',
            'lo anterior', 'nada funcionó', 'recomiéndame un profesional',
            'quiero la', 'más sobre', 'mas sobre', 'sobre eso', 'hablame más de eso', 'háblame más de eso'
        ]
        
        is_follow_up = any(kw in problem_lower for kw in follow_up_keywords)
        
        # Detectar "eso" como palabra completa para evitar falsos positivos
        if not is_follow_up:
            if re.search(r'\beso\b', problem_lower):
                is_follow_up = True
        
        # Extraer número de opción si existe - regex más segura
        option_number = None
        
        # Patrones específicos en orden de prioridad
        patterns = [
            r'(?:opcion|opción)\s*(\d+)',  # "opcion 2", "opción 3"
            r'la\s+(\d+)',  # "la 2", "la 3"
            r'quiero\s+la\s+(\d+)',  # "quiero la 1"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, problem_lower)
            if match and match.group(1):
                try:
                    option_number = int(match.group(1))
                    break
                except (ValueError, TypeError):
                    continue
        
        return is_follow_up, option_number
    @staticmethod
    async def solve_problem(
        problem: str,
        user_location: Optional[str],
        budget: Optional[int],
        db: Session,
        user_id: Optional[str] = None,
        memory_context: Optional[Dict] = None,
        conversation_context: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Llama a Gemini, parsea respuesta, enriquece con datos de BD,
        aplica ranking por urgencia y trust score.
        """
        # 1. Detectar si es follow-up y extraer número de opción
        is_follow_up, option_number = AIEngine._detect_follow_up(problem)
        
        # 2. Construir prompt con contexto de memoria si existe
        memory_text = ""
        if memory_context:
            devices = memory_context.get("known_devices", [])
            if devices:
                memory_text = f"Contexto: El usuario previamente mencionó tener {', '.join(devices)}. "
            pref_cat = memory_context.get("preferred_categories")
            if pref_cat:
                memory_text += f"Categorías preferidas: {', '.join(pref_cat)}. "
        
        # 3. Agregar contexto de conversación si es follow-up
        conversation_text = ""
        if is_follow_up and conversation_context:
            last_conv = conversation_context[0] if conversation_context else None
            if last_conv:
                last_problem = last_conv.get("problem_text", "")
                last_response = last_conv.get("ai_response", {})
                last_solutions = last_response.get("instant_solutions", [])
                
                conversation_text = f"""
CONTEXTO DE CONVERSACIÓN ANTERIOR:
Pregunta anterior: {last_problem}
Soluciones anteriores:
"""
                for idx, sol in enumerate(last_solutions, 1):
                    conversation_text += f"{idx}. {sol}\n"
                
                if option_number and 1 <= option_number <= len(last_solutions):
                    selected_solution = last_solutions[option_number - 1]
                    conversation_text += f"\nEl usuario está preguntando específicamente sobre la opción {option_number}: {selected_solution}\n"
                
                conversation_text += "\nResponde considerando este contexto. No trates la pregunta como si fuera aislada.\n"

        prompt = f"""
        Eres Pandeum, un asistente experto en resolver problemas de los usuarios. NO eres un motor de búsqueda de proveedores genérico.

        Problema del usuario: {problem}
        Ubicación: {user_location or "No especificada"}
        Presupuesto máximo sugerido: {budget if budget else "No especificado"}
        {memory_text}
        {conversation_text}

        Tu tarea es:
        1. Diagnosticar el problema (posibles causas).
        2. Ofrecer soluciones inmediatas que el usuario pueda hacer él mismo (pasos concretos, sin necesidad de contratar).
        3. Si aplica, recomendar proveedores (máximo 3) de las categorías permitidas (Technology, Education, Home Services) SOLO si la solución inmediata no es suficiente o el problema claramente requiere un profesional.
        4. Para cada proveedor recomendado, genera 3-4 razones específicas (ej: "especializado en laptops gaming", "a 2km de distancia", "4.9 estrellas").
        5. Calcula un confidence_score (0.0-1.0) según qué tan claro y resoluble sea el problema.
        6. Detecta urgencia (low/medium/high).
        7. Si el problema es de salud, legal o finanzas (palabras como dolor, pecho, demanda, abogado, inversión, etc.), responde con un mensaje de advertencia y no des recomendaciones de proveedores.
        8. Devuelve SOLO un JSON válido sin texto adicional.

        Formato JSON esperado:
        {{
            "confidence_score": 0.92,
            "diagnosis": {{
                "possible_causes": ["causa1", "causa2"],
                "questions": ["pregunta opcional para profundizar"]
            }},
            "instant_solutions": ["paso1", "paso2"],
            "urgency": "low|medium|high",
            "providers": [
                {{
                    "provider_name": "nombre del negocio (debe coincidir con base de datos si existe)",
                    "reason_bullets": ["razón1", "razón2", "razón3"]
                }}
            ],
            "composite_solution": null,
            "fallback": null,
            "restricted_category_warning": "solo si aplica"
        }}

        Si no hay proveedores posibles o el problema no encaja, devuelve "providers": [] y en fallback indica guías o lista de espera.
        Si el problema es compuesto (ej: montar tienda online), puedes generar composite_solution.
        """

        # 2. Llamar a Gemini con manejo de cuota
        try:
            response = model.generate_content(prompt)
            raw_text = response.text.strip()
            # Limpiar posibles marcadores de código
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
            raw_text = raw_text.strip()

            try:
                ai_result = json.loads(raw_text)
            except json.JSONDecodeError:
                # Fallback mínimo por JSON inválido
                ai_result = {
                    "confidence_score": 0.3,
                    "diagnosis": {"possible_causes": ["No se pudo analizar"], "questions": []},
                    "instant_solutions": ["Intenta reiniciar o buscar ayuda en línea"],
                    "urgency": "medium",
                    "has_providers": False,
                    "providers": [],
                    "composite_solution": None,
                    "fallback": {"type": "error", "message": "La IA no pudo procesar correctamente. Intenta de nuevo."}
                }
        except ResourceExhausted:
            # Intentar fallback con OpenRouter
            ai_result = await AIEngine._generate_with_openrouter(prompt)
            if ai_result:
                # Normalizar respuesta de OpenRouter si está incompleta
                ai_result = AIEngine._normalize_ai_response(ai_result)
            else:
                # Fallback local cuando Gemini excede cuota y OpenRouter no está disponible
                ai_result = {
                    "confidence_score": 0.45,
                    "diagnosis": {
                        "possible_causes": [
                            "El asistente de IA no está disponible temporalmente.",
                            "El problema requiere revisión con información adicional.",
                            "Puede ser necesario escalar a un proveedor especializado."
                        ],
                        "questions": [
                            "¿El problema sigue ocurriendo después de reiniciar el equipo?",
                            "¿Cuándo empezó el problema?",
                            "¿Has probado con otro dispositivo o conexión?"
                        ]
                    },
                    "instant_solutions": [
                        "**Revisar lo básico:** Verifica conexiones, energía y reinicio del equipo.",
                        "**Anotar el problema:** Guarda detalles como hora, frecuencia y mensajes de error.",
                        "**Solicitar ayuda profesional:** Si el problema continúa, contacta a un especialista."
                    ],
                    "urgency": "medium",
                    "has_providers": False,
                    "providers": [],
                    "composite_solution": None,
                    "fallback": {
                        "type": "quota_exceeded",
                        "message": "El asistente de IA alcanzó temporalmente su límite de uso. Te mostramos una respuesta básica mientras se restablece el servicio.",
                        "waitlist_enabled": False
                    }
                }
        except Exception:
            # Capturar errores temporales de Gemini sin tumbar el endpoint
            ai_result = await AIEngine._generate_with_openrouter(prompt)
            if ai_result:
                # Normalizar respuesta de OpenRouter si está incompleta
                ai_result = AIEngine._normalize_ai_response(ai_result)
            else:
                # Fallback local para errores generales de Gemini
                ai_result = {
                    "confidence_score": 0.4,
                    "diagnosis": {
                        "possible_causes": [
                            "El asistente de IA no está disponible temporalmente.",
                            "Error temporal en el procesamiento de la consulta."
                        ],
                        "questions": []
                    },
                    "instant_solutions": [
                        "Intenta nuevamente en unos momentos.",
                        "Verifica tu conexión a internet."
                    ],
                    "urgency": "medium",
                    "has_providers": False,
                    "providers": [],
                    "composite_solution": None,
                    "fallback": {
                        "type": "temporary_error",
                        "message": "Error temporal en el asistente de IA. Te mostramos una respuesta básica.",
                        "waitlist_enabled": False
                    }
                }

        # 3. Validar y completar instant_solutions si está vacío o inválido
        instant_solutions = ai_result.get("instant_solutions")
        
        # Detectar tipo de problema para generar soluciones apropiadas y mensajes naturales
        health_keywords = [
            'cuello', 'espalda', 'hombro', 'brazo', 'pierna', 'rodilla', 'muscular',
            'contractura', 'postura', 'tension', 'tensión', 'dolor', 'estomago', 'estómago',
            'cabeza', 'pecho', 'fiebre', 'mareo', 'nausea', 'náusea', 'vomito', 'vómito', 'diarrea'
        ]
        
        tech_keywords = [
            'internet', 'router', 'wifi', 'wi-fi', 'red', 'redes', 
            'conectividad', 'senal', 'señal', 'modem', 'módem',
            'laptop', 'computadora', 'pc', 'portátil',
            'celular', 'telefono', 'teléfono', 'bateria', 'batería', 'pantalla', 'carga', 'apagando', 'apaga'
        ]
        
        problem_lower = problem.lower()
        is_health_related = any(kw in problem_lower for kw in health_keywords)
        is_tech_related = any(kw in problem_lower for kw in tech_keywords)
        
        # Normalizar instant_solutions
        if isinstance(instant_solutions, str):
            # Si viene como string, convertir a lista
            instant_solutions = [instant_solutions]
        elif isinstance(instant_solutions, list):
            # Si viene como lista, limpiar elementos vacíos y conservar solo strings útiles
            instant_solutions = [
                s.strip() for s in instant_solutions
                if isinstance(s, str) and s.strip()
            ]
        else:
            # Si no es ni string ni lista, tratar como vacío
            instant_solutions = []
        
        # Si después de normalizar queda vacío, generar soluciones locales
        if not instant_solutions:
            
            if is_health_related:
                instant_solutions = [
                    "**Descansa y observa los síntomas:** Evita esfuerzos y presta atención a si el dolor aumenta, cambia o se mantiene.",
                    "**Evita movimientos que empeoren el dolor:** Mantén una postura cómoda y no fuerces la zona afectada.",
                    "**Busca atención médica si empeora:** Si el dolor es fuerte, continúa, empeora o aparece con fiebre, vómitos persistentes, sangre, dolor en el pecho, debilidad o dificultad para respirar, busca atención médica."
                ]
            elif is_tech_related:
                instant_solutions = [
                    "**Reinicia el equipo:** Apaga el router, espera 30 segundos y vuelve a encenderlo.",
                    "**Revisa cables y energía:** Verifica que el cable de corriente y de internet estén bien conectados.",
                    "**Prueba con otro dispositivo:** Confirma si el problema ocurre solo en un equipo o en toda la red."
                ]
            else:
                instant_solutions = [
                    "**Revisa lo básico:** Verifica energía, conexión, configuración o condiciones visibles del problema.",
                    "**Anota cuándo ocurre:** Registra hora, frecuencia y cualquier mensaje de error o señal extraña.",
                    "**Busca ayuda si continúa:** Si el problema no mejora, considera contactar a un especialista."
                ]
        
        ai_result["instant_solutions"] = instant_solutions

        # 4. Si hay restricted_category_warning, devolver eso y no buscar proveedores
        if ai_result.get("restricted_category_warning"):
            return {
                "confidence_score": ai_result.get("confidence_score", 0.5),
                "diagnosis": ai_result["diagnosis"],
                "instant_solutions": instant_solutions,
                "has_providers": False,
                "providers": [],
                "composite_solution": None,
                "fallback": {
                    "type": "restricted",
                    "message": ai_result["restricted_category_warning"]
                },
                "natural_message": AIEngine._generate_natural_message(problem, False, is_health_related)
            }

        # 4. Buscar proveedores en BD que coincidan por nombre o categoría
        recommended_providers = []
        providers_from_ai = ai_result.get("providers", [])
        if providers_from_ai:
            for p in providers_from_ai:
                provider_name = p.get("provider_name")
                if provider_name:
                    # Buscar coincidencia aproximada en BD (por nombre de negocio)
                    db_provider = db.query(Provider).filter(
                        Provider.business_name.ilike(f"%{provider_name}%")
                    ).first()
                    if db_provider:
                        # Calcular distancia ficticia (en MVP se puede integrar geolocalización real)
                        distance_km = None
                        rating = get_provider_rating(db, db_provider.id)
                        recommended_providers.append({
                            "provider_id": db_provider.id,
                            "business_name": db_provider.business_name,
                            "trust_score": db_provider.trust_score,
                            "rating": rating,
                            "distance_km": distance_km,
                            "reason_bullets": p.get("reason_bullets", []),
                            "estimated_cost": f"${db_provider.price_min}-${db_provider.price_max}" if db_provider.price_min else "Consultar",
                            "available_now": db_provider.available_now,
                            "response_time_hours": db_provider.response_time_hours
                        })
        # Si no se encontraron proveedores por nombre, intentar por categoría y subcategoría
        if not recommended_providers:
            # Usar diagnosis para inferir categoría? Por simplicidad, obtenemos algunos proveedores activos
            category_map = {
                "laptop": "Technology",
                "computadora": "Technology",
                "internet": "Technology",
                "router": "Technology",
                "wifi": "Technology",
                "wi-fi": "Technology",
                "red": "Technology",
                "redes": "Technology",
                "conectividad": "Technology",
                "senal": "Technology",
                "señal": "Technology",
                "modem": "Technology",
                "módem": "Technology",
                "tutor": "Education",
                "matemáticas": "Education",
                "plomería": "Home Services",
                "fuga": "Home Services"
            }
            detected_cat = None
            for keyword, cat in category_map.items():
                if keyword in problem.lower():
                    detected_cat = cat
                    break
            if detected_cat:
                db_providers = db.query(Provider).filter(
                    Provider.category == detected_cat,
                    Provider.verification_status == "verified"
                ).order_by(Provider.trust_score.desc()).limit(3).all()
                for p in db_providers:
                    rating = get_provider_rating(db, p.id)
                    recommended_providers.append({
                        "provider_id": p.id,
                        "business_name": p.business_name,
                        "trust_score": p.trust_score,
                        "rating": rating,
                        "distance_km": None,
                        "reason_bullets": [f"Especialista en {detected_cat}", f"Trust Score {p.trust_score}"],
                        "estimated_cost": f"${p.price_min}-${p.price_max}" if p.price_min else "Consultar",
                        "available_now": p.available_now,
                        "response_time_hours": p.response_time_hours
                    })

        has_providers = len(recommended_providers) > 0
        fallback = ai_result.get("fallback")
        if not has_providers and not fallback:
            fallback = {
                "type": "no_providers",
                "guides": ["Busca en YouTube tutoriales sobre el problema", "Revisa foros especializados"],
                "waitlist_enabled": True
            }

        # 5. Ordenar por urgencia
        urgency = ai_result.get("urgency", "medium")
        if urgency == "high":
            recommended_providers.sort(key=lambda x: (x.get("available_now", False), x.get("response_time_hours", 999)))
        else:
            recommended_providers.sort(key=lambda x: x.get("trust_score", 0), reverse=True)

        # 6. Generar mensaje natural contextual
        natural_message = AIEngine._generate_natural_message(problem, has_providers, is_health_related)

        return {
            "confidence_score": ai_result.get("confidence_score", 0.5),
            "diagnosis": ai_result["diagnosis"],
            "instant_solutions": ai_result.get("instant_solutions", []),
            "has_providers": has_providers,
            "providers": recommended_providers,
            "composite_solution": ai_result.get("composite_solution"),
            "fallback": fallback,
            "urgency": urgency,
            "natural_message": natural_message
        }

    @staticmethod
    async def explore_mode(problem: str, budget: Optional[int]) -> Dict:
        """Modo Exploración: ideas, regalos, experiencias."""
        prompt = f"""
        Eres Pandeum en modo Exploración. El usuario busca inspiración, ideas o regalos, no solución técnica.
        Consulta: {problem}
        Presupuesto: {budget if budget else "sin especificar"}

        Devuelve JSON con:
        {{
            "ideas": [
                {{
                    "title": "título atractivo",
                    "description": "explicación",
                    "estimated_cost": "$XX",
                    "type": "producto|experiencia|guía"
                }}
            ],
            "confidence_score": 0.9
        }}
        """
        response = model.generate_content(prompt)
        raw = response.text.strip()
        # Limpiar posibles marcadores de código
        if raw.startswith("```json"):
            raw = raw[7:]
        if raw.startswith("```"):
            raw = raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()
        try:
            return json.loads(raw)
        except:
            # Fallback cuando Gemini no devuelve JSON válido
            return {"ideas": [], "confidence_score": 0.3}