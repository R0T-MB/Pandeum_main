import json
import google.generativeai as genai
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from .config import settings
from .models import Provider, UserMemory
from .crud import get_provider_rating

genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

class AIEngine:
    @staticmethod
    async def solve_problem(
        problem: str,
        user_location: Optional[str],
        budget: Optional[int],
        db: Session,
        user_id: Optional[str] = None,
        memory_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Llama a Gemini, parsea respuesta, enriquece con datos de BD,
        aplica ranking por urgencia y trust score.
        """
        # 1. Construir prompt con contexto de memoria si existe
        memory_text = ""
        if memory_context:
            devices = memory_context.get("known_devices", [])
            if devices:
                memory_text = f"Contexto: El usuario previamente mencionó tener {', '.join(devices)}. "
            pref_cat = memory_context.get("preferred_categories")
            if pref_cat:
                memory_text += f"Categorías preferidas: {', '.join(pref_cat)}. "

        prompt = f"""
        Eres Pandeum, un asistente experto en resolver problemas de los usuarios. NO eres un motor de búsqueda de proveedores genérico.

        Problema del usuario: {problem}
        Ubicación: {user_location or "No especificada"}
        Presupuesto máximo sugerido: {budget if budget else "No especificado"}
        {memory_text}

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

        # 2. Llamar a Gemini
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
            # Fallback mínimo
            ai_result = {
                "confidence_score": 0.3,
                "diagnosis": {"possible_causes": ["No se pudo analizar"], "questions": []},
                "instant_solutions": ["Intenta reiniciar o buscar ayuda en línea"],
                "urgency": "medium",
                "providers": [],
                "composite_solution": None,
                "fallback": {"type": "error", "message": "La IA no pudo procesar correctamente. Intenta de nuevo."}
            }

        # 3. Si hay restricted_category_warning, devolver eso y no buscar proveedores
        if ai_result.get("restricted_category_warning"):
            return {
                "confidence_score": ai_result.get("confidence_score", 0.5),
                "diagnosis": ai_result["diagnosis"],
                "instant_solutions": [],
                "has_providers": False,
                "providers": [],
                "composite_solution": None,
                "fallback": {
                    "type": "restricted",
                    "message": ai_result["restricted_category_warning"]
                }
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

        return {
            "confidence_score": ai_result.get("confidence_score", 0.5),
            "diagnosis": ai_result["diagnosis"],
            "instant_solutions": ai_result.get("instant_solutions", []),
            "has_providers": has_providers,
            "providers": recommended_providers,
            "composite_solution": ai_result.get("composite_solution"),
            "fallback": fallback,
            "urgency": urgency
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
        # similar limpieza
        try:
            return json.loads(raw)
        except:
            return {"ideas": [], "confidence_score": 0.3}