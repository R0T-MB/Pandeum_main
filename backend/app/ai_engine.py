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
    def _is_confirmation(problem_lower: str) -> bool:
        """Detecta si el mensaje es una confirmación."""
        normalized = problem_lower.strip().lower().replace(".", "").replace(",", "").replace("!", "").replace("¡", "").replace("?", "").replace("¿", "")
        
        exact_confirmations = {
            'si', 'sí', 'ok', 'dale', 'eso', 'exacto', 'correcto', 'claro'
        }
        
        phrase_confirmations = [
            'me interesa', 'quiero esa', 'esa opción', 'esa opcion',
            'la primera', 'la segunda', 'la tercera', 'la 1', 'la 2', 'la 3'
        ]
        
        return normalized in exact_confirmations or any(phrase in normalized for phrase in phrase_confirmations)
    
    @staticmethod
    def _is_clothing_related(problem_lower: str) -> bool:
        """Detecta si el mensaje habla de ropa/prendas."""
        garment_keywords = [
            'suéter', 'sueter', 'camisa', 'blusa', 'pantalón', 'pantalon',
            'zapato', 'zapatos', 'vestido', 'chaqueta', 'chaleco', 'abrigo',
            'camiseta', 'polo', 'prenda', 'ropa', 'vestimenta', 'calzado',
            'talla'
        ]
        return any(kw in problem_lower for kw in garment_keywords)
    
    @staticmethod
    def _is_health_related(problem_lower: str) -> bool:
        """Detecta si el mensaje habla de salud."""
        health_keywords = [
            'dolor', 'duele', 'me duele', 'pecho', 'presión', 'presion',
            'cabeza', 'fiebre', 'mareo', 'náusea', 'nausea', 'vomito', 'vómito',
            'estómago', 'estomago', 'espalda', 'cuello', 'hombro', 'brazo',
            'pierna', 'rodilla', 'muscular', 'contractura', 'postura',
            'tension', 'tensión', 'calvo', 'calvicie', 'cabello', 'pelo',
            'caida', 'caída', 'alopecia', 'entradas', 'dermatólogo', 'dermatologo'
        ]
        # Solo es salud si NO es ropa
        return not AIEngine._is_clothing_related(problem_lower) and any(kw in problem_lower for kw in health_keywords)
    
    @staticmethod
    def _is_food_related(problem_lower: str) -> bool:
        """Detecta si el mensaje habla de comida."""
        food_keywords = [
            'hambre', 'comer', 'almorz', 'almuerzo', 'cenar', 'cena',
            'comida', 'snack', 'desayunar', 'desayuno', 'merendar', 'merienda',
            'sushi', 'pizza', 'arepa', 'arepas', 'encebollado', 'pollo', 'pescado',
            'queso', 'hamburguesa', 'tacos', 'pasta', 'arroz', 'ensalada', 'sopa'
        ]
        return any(kw in problem_lower for kw in food_keywords)
    
    @staticmethod
    def _is_tech_related(problem_lower: str) -> bool:
        """Detecta si el mensaje habla de tecnología."""
        tech_keywords = [
            'internet', 'router', 'wifi', 'wi-fi', 'red', 'redes',
            'conectividad', 'senal', 'señal', 'modem', 'módem',
            'laptop', 'computadora', 'pc', 'portátil', 'portatil',
            'celular', 'telefono', 'teléfono', 'bateria', 'batería',
            'pantalla', 'carga', 'apagando', 'apaga', 'audífono', 'audifono'
        ]
        return any(kw in problem_lower for kw in tech_keywords)
    
    @staticmethod
    def _is_product_related(problem_lower: str) -> bool:
        """Detecta si el mensaje habla de productos/compras."""
        purchase_intent_keywords = [
            'comprar', 'quiero comprar', 'conseguir', 'dónde consigo', 'donde consigo',
            'necesito una', 'necesito un', 'busco una', 'busco un',
            'quiero una', 'quiero un', 'me hace falta'
        ]
        
        product_item_keywords = [
            'guitarra', 'zapatos nuevos', 'batería', 'bateria', 'repuesto',
            'cargador', 'audífonos', 'audifonos', 'celular', 'ropa nueva',
            'pantalla', 'cable', 'adaptador'
        ]
        
        return any(i in problem_lower for i in purchase_intent_keywords) and any(p in problem_lower for p in product_item_keywords)
    
    @staticmethod
    def _is_service_related(problem_lower: str) -> bool:
        """Detecta si el mensaje habla de servicios/proveedores."""
        service_keywords = [
            'zapatero', 'costurera', 'sastre', 'técnico', 'tecnico',
            'reparar', 'arreglar', 'instalar', 'mantenimiento',
            'alguien que', 'quien arregla', 'quién arregla',
            'donde arreglo', 'dónde arreglo',
            'llevar a reparar', 'mandar a arreglar',
            'quiero un proveedor', 'necesito un proveedor', 'busco proveedor',
            'quiero un especialista', 'necesito un especialista', 'busco especialista'
        ]
        return any(kw in problem_lower for kw in service_keywords)
    
    @staticmethod
    def _is_continuation_phrase(problem_lower: str) -> bool:
        continuation_patterns = [
            r'\bllevarl[oae]s?\b',
            r'\bdónde lo llevo\b',
            r'\bdonde lo llevo\b',
            r'\bllevo a\b',
            r'\bmuéstrame\b',
            r'\bmuestrame\b',
            r'\bquiero ver (opciones|lugares|tiendas|más)\b',
            r'\bver (opciones|lugares|tiendas)\b',
            r'\bdónde (lo|la) (arreglo|compro|consigo)\b',
            r'\bdonde (lo|la) (arreglo|compro|consigo)\b',
            r'\b(arreglarl[oa]|repararl[oa]|comprarl[oa])\b',
            r'\blugares?\b',
            r'\b(para eso|para esto)\b',
            r'\b(recomendar|recomiendas|recomiéndame|recomiendame) un lugar\b',
            r'\bdónde (puedo ir|voy)\b',
            r'\bdonde (puedo ir|voy)\b',
            r'\ba dónde\b',
            r'\ba donde\b',
            r'\bpuedo ir\b',
            r'\bquiero ver opciones\b',
            r'\bmuéstrame opciones\b',
            r'\bmuestrame opciones\b',
        ]
        words = problem_lower.split()
        is_lugar_related = any(p in problem_lower for p in ['lugar', 'lugares', 'para eso', 'para esto'])
        if len(words) > 15 and not is_lugar_related:
            return False
        return any(re.search(p, problem_lower) for p in continuation_patterns)

    @staticmethod
    async def _resolve_intent_with_context(
        problem: str,
        conversation_context: Optional[List[Dict]]
    ) -> Dict[str, Any]:
        """
        Resuelve la intención del usuario usando contexto de conversación.
        Siempre intenta IA primero (incluso sin historial).
        """
        default = {
            "is_followup": False,
            "resolved_problem": problem,
            "response_mode": None,
            "need_type": None,
            "intent_category": None,
            "domain": None,
            "target_item": None,
            "provider_category": None,
            "recommendation_label": None,
            "needs_providers": False,
            "confidence": 1.0
        }

        ai_result = await AIEngine._resolve_intent_with_ai(problem, conversation_context or [])
        if ai_result and ai_result.get("confidence", 0) >= 0.4:
            return ai_result

        if conversation_context:
            return AIEngine._resolve_intent_locally(problem, conversation_context)
        return default

    @staticmethod
    async def _resolve_intent_with_ai(
        problem: str,
        conversation_context: List[Dict]
    ) -> Optional[Dict[str, Any]]:
        """Usa Gemini + OpenRouter fallback para resolver intención con contexto."""
        history_lines = []
        for i, conv in enumerate(conversation_context[:3] if conversation_context else []):
            msg = conv.get("problem_text", "")
            resp = conv.get("ai_response", {})
            mode = resp.get("response_mode", "unknown")
            history_lines.append(f"{i+1}. Usuario: \"{msg}\"")
            history_lines.append(f"   Asistente: respondió en modo \"{mode}\"")

        history_text = "\n".join(history_lines) if history_lines else "(Sin historial previo)"
        prompt = f"""
Eres Pandeum, un analizador de conversaciones.

### Historial (más reciente primero):
{history_text}

### Mensaje actual:
"{problem}"

### Instrucciones:
Determina si el mensaje actual es continuación del tema anterior o un tema nuevo.
Si es continuación, interpreta el significado completo usando el contexto.

Responde SOLO con JSON válido (sin markdown, sin texto adicional):
{{
  "is_followup": true/false,
  "resolved_problem": "texto completo interpretado con contexto, o mensaje original si no es follow-up",
  "response_mode": "suggestions|journey|direct|food|follow_up",
  "need_type": "buy_product|repair_service|hire_professional|find_place|compare_options|urgent_help|self_guidance|clarification|more_suggestions",
  "intent_category": "food|clothing|product|service|health|tech|general",
  "domain": "ámbito del problema en texto libre, ej: mascotas, instrumentos musicales, jardinería, decoración, celulares, muebles, tecnología, comida, ropa, salud",
  "target_item": "objeto o ser específico en texto libre, ej: perrito, guitarra, laptop, jardín, cuarto, celular",
  "provider_category": "categoría de proveedor en texto libre, o null si no aplica",
  "recommendation_label": "etiqueta amigable para UI en texto libre, o null si no aplica",
  "needs_providers": true/false,
  "confidence": 0.0-1.0
}}

### Reglas:
- is_followup=true: el mensaje usa pronombres (lo, la, eso, esto), frases cortas, o referencias implícitas al tema anterior.
- is_followup=false: el mensaje introduce un tema NUEVO y claro con términos específicos.
- resolved_problem: si es follow-up, reescribe el mensaje completo reemplazando ambigüedades con el contexto real.
- response_mode: "suggestions" para recomendaciones/opciones/proveedores, "journey" para diagnóstico, "direct" para respuestas simples, "food" para comida, "follow_up" para continuar explicación anterior.
- need_type: qué acción necesita. buy_product=comprar, repair_service=reparar, hire_professional=contratar, find_place=encontrar lugares, compare_options=comparar, urgent_help=ayuda urgente, self_guidance=orientación, clarification=aclaración, more_suggestions=más opciones.
- intent_category: SOLO estos valores permitidos: food, clothing, product, service, health, tech, general.
- domain: texto libre describiendo el ámbito. NO uses categorías fijas. Ej: mascotas, instrumentos musicales, jardinería, decoración, celulares.
- target_item: texto libre del objeto o ser específico. Ej: perrito, guitarra, jardín, cuarto.
- provider_category: texto libre describiendo qué proveedor se necesita. Ej: "veterinario", "técnico de instrumentos musicales", "jardinero", "tienda de decoración", "tienda de celulares". Pon null si no aplica.
- recommendation_label: frase amigable en texto libre para UI. Ej: "Veterinarios disponibles", "Técnicos de instrumentos disponibles", "Jardineros disponibles", "Tiendas de decoración disponibles". Pon null si no aplica.
- needs_providers: true si busca lugares, profesionales, servicios, tiendas o reparación.
- confidence: 0.0-1.0. Sé honesto si no estás seguro.

### Reglas MUY IMPORTANTES sobre "lugar":
- La palabra "lugar" NO significa restaurante por defecto.
- "lugar para eso", "lugar para esto", "dónde voy", "dónde lo llevo" deben interpretarse SIEMPRE según el contexto anterior.
- Usa el contexto del historial para determinar QUÉ tipo de lugar/proveedor/servicio corresponde:
  * Si el contexto anterior es salud/dolor/malestar → centro médico, fisioterapeuta, clínica.
  * Si el contexto anterior es comida → restaurante.
  * Si el contexto anterior es reparación de objetos → taller, técnico, servicio de reparación.
  * Si el contexto anterior es compra de producto → tienda.
  * Si el contexto anterior es mascotas → veterinario.
  * Si el contexto anterior es jardinería → jardinero, vivero.
  * Para CUALQUIER otra necesidad (decoración, educación, transporte, música, belleza, deportes, etc.), genera el tipo de proveedor que corresponda usando el contexto y el dominio detectado.
- domain y provider_category deben ser texto libre. NO uses categorías fijas/cerradas.
- recommendation_label debe ser una frase amigable derivada del provider_category (ej: de "veterinario" → "Veterinarios disponibles").
- No arrastres contexto si el usuario cambió claramente de tema.
- Si el contexto anterior no es comida, NUNCA respondas con restaurantes por defecto.
"""
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            result = json.loads(response_text)
            if isinstance(result, dict) and "is_followup" in result and "resolved_problem" in result:
                return AIEngine._validate_resolved_intent(result)
        except Exception:
            pass

        openrouter_text = await AIEngine._generate_with_openrouter(prompt)
        if openrouter_text:
            try:
                if openrouter_text.startswith('```json'):
                    openrouter_text = openrouter_text[7:]
                if openrouter_text.startswith('```'):
                    openrouter_text = openrouter_text[3:]
                if openrouter_text.endswith('```'):
                    openrouter_text = openrouter_text[:-3]
                openrouter_text = openrouter_text.strip()
                result = json.loads(openrouter_text)
                if isinstance(result, dict) and "is_followup" in result and "resolved_problem" in result:
                    return AIEngine._validate_resolved_intent(result)
            except Exception:
                pass
        return None

    @staticmethod
    def _validate_resolved_intent(result: Dict[str, Any]) -> Dict[str, Any]:
        """Valida y normaliza la salida de la IA."""
        allowed_response_modes = {"suggestions", "journey", "direct", "food", "follow_up"}
        allowed_need_types = {"buy_product", "repair_service", "hire_professional", "find_place", "compare_options", "urgent_help", "self_guidance", "clarification", "more_suggestions"}
        allowed_intent_categories = {"food", "clothing", "product", "service", "health", "tech", "general"}

        if result.get("response_mode") == "providers":
            result["response_mode"] = "suggestions"
        elif result.get("response_mode") not in allowed_response_modes:
            result["response_mode"] = None
        if result.get("need_type") and result["need_type"] not in allowed_need_types:
            result["need_type"] = None
        if result.get("intent_category") and result["intent_category"] not in allowed_intent_categories:
            result["intent_category"] = "general"

        conf = result.get("confidence")
        if not isinstance(conf, (int, float)):
            result["confidence"] = 0.5
        else:
            result["confidence"] = max(0.0, min(1.0, float(conf)))

        for key in ["provider_category", "recommendation_label", "domain", "target_item"]:
            val = result.get(key)
            if not isinstance(val, str) or not val.strip():
                result[key] = None

        return result

    @staticmethod
    def _resolve_intent_locally(
        problem: str,
        conversation_context: List[Dict]
    ) -> Dict[str, Any]:
        """Fallback local mínimo cuando la IA no está disponible."""
        problem_lower = problem.lower()
        words = problem_lower.split()
        last_response = conversation_context[0].get("ai_response", {}) if conversation_context else {}
        last_problem = conversation_context[0].get("problem_text", "") if conversation_context else ""
        last_intent = last_response.get("intent_category")
        last_mode = last_response.get("response_mode")

        is_continuation = AIEngine._is_continuation_phrase(problem_lower)
        is_short = len(words) <= 5
        has_pronouns = any(p in problem_lower for p in [' lo ', ' la ', ' eso', ' esto', 'llevarl', 'arreglarl', 'repararl', 'comprarl'])
        is_ambiguous = is_continuation or (is_short and has_pronouns)

        if is_ambiguous:
            # Build previous context text from last response
            prev_provider_category = last_response.get("provider_category")
            prev_recommendation_label = last_response.get("recommendation_label")
            prev_suggestions_label = last_response.get("suggestions_label")
            prev_intent_category = last_intent
            prev_domain = last_response.get("domain")

            # Determine if the user is asking for a place/provider/options
            asks_for_place = any(p in problem_lower for p in [
                'lugar', 'lugares', 'para eso', 'para esto',
                'dónde voy', 'donde voy', 'dónde puedo', 'donde puedo',
                'a dónde', 'a donde', 'puedo ir', 'recomiend',
                'muéstrame', 'muestrame', 'quiero ver', 'ver opciones'
            ]) or is_continuation

            if asks_for_place and last_problem:
                # Reuse existing provider_category/recommendation_label if available
                provider_category = prev_provider_category
                recommendation_label = prev_recommendation_label
                if not recommendation_label and prev_suggestions_label:
                    recommendation_label = prev_suggestions_label
                if not recommendation_label:
                    recommendation_label = "Opciones disponibles para esta necesidad"

                intent_category = prev_intent_category if prev_intent_category and prev_intent_category != "general" else None

                return {
                    "is_followup": True,
                    "resolved_problem": f"Necesito un lugar o proveedor relacionado con: {last_problem}",
                    "response_mode": "suggestions",
                    "need_type": "find_place",
                    "intent_category": intent_category,
                    "domain": prev_domain or prev_intent_category,
                    "target_item": None,
                    "provider_category": provider_category,
                    "recommendation_label": recommendation_label,
                    "needs_providers": True,
                    "confidence": 0.65
                }

            # Generic ambiguous continuation without explicit place request
            return {
                "is_followup": True,
                "resolved_problem": problem,
                "response_mode": last_mode if last_mode in ["suggestions", "food"] else None,
                "need_type": "more_suggestions" if last_mode == "suggestions" else "clarification",
                "intent_category": last_intent if last_intent and last_intent != "general" else None,
                "domain": last_response.get("domain"),
                "target_item": None,
                "provider_category": None,
                "recommendation_label": None,
                "needs_providers": False,
                "confidence": 0.4
            }

        return {
            "is_followup": False,
            "resolved_problem": problem,
            "response_mode": None,
            "need_type": None,
            "intent_category": None,
            "domain": None,
            "target_item": None,
            "provider_category": None,
            "recommendation_label": None,
            "needs_providers": False,
            "confidence": 1.0
        }

    @staticmethod
    def _detect_intent_category(problem: str, conversation_context: Optional[List[Dict]] = None) -> str:
        """Detecta la categoría de intención del usuario."""
        problem_lower = problem.lower()
        
        # 1. Service tiene intención explícita de buscar/comprar/arreglar
        if AIEngine._is_service_related(problem_lower):
            return "service"
        
        # 2. Product tiene intención explícita de compra
        if AIEngine._is_product_related(problem_lower):
            return "product"
        
        # 3. Clothing para problemas de prenda
        if AIEngine._is_clothing_related(problem_lower):
            return "clothing"
        
        # 4. Health (solo si no es ropa)
        if AIEngine._is_health_related(problem_lower):
            return "health"
        
        # 5. Food
        if AIEngine._is_food_related(problem_lower):
            return "food"
        
        # 6. Tech para problemas reales
        if AIEngine._is_tech_related(problem_lower):
            return "tech"
        
        # 7. Si es confirmación y hay contexto, usar categoría anterior
        if AIEngine._is_confirmation(problem_lower) and conversation_context:
            last_response = conversation_context[0].get("ai_response", {})
            if last_response.get("response_mode") == "food":
                return "food"
            if last_response.get("response_mode") == "suggestions":
                suggestions_label = last_response.get("suggestions_label", "").lower()
                if "comida" in suggestions_label or "sushi" in suggestions_label or "pizza" in suggestions_label:
                    return "food"
                if "ropa" in suggestions_label or "prenda" in suggestions_label:
                    return "clothing"
                return "general"
        
        # 8. General por defecto
        return "general"
    
    @staticmethod
    def _clean_markdown(text: str) -> str:
        """Limpia markdown básico de un texto."""
        text = text.replace("**", "").replace("__", "")
        text = text.strip()
        if text.startswith("- ") or text.startswith("* "):
            text = text[2:].strip()
        return text
    
    @staticmethod
    async def _generate_with_openrouter(prompt: str) -> Optional[str]:
        """Fallback a OpenRouter si está configurado. Retorna texto crudo."""
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
                        "model": settings.OPENROUTER_MODEL or "openai/gpt-3.5-turbo",
                        "messages": [
                            {
                                "role": "system",
                                "content": "Eres Pandeum, un asistente experto en resolver problemas."
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
                    return data["choices"][0]["message"]["content"]
                return None
        except Exception:
            # Si OpenRouter falla, no romper el endpoint
            return None

    @staticmethod
    async def _generate_with_fallback_ai(prompt: str) -> Optional[str]:
        """Genera respuesta con Gemini como principal y OpenRouter como fallback."""
        # Intentar Gemini primero
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception:
            # Si Gemini falla, intentar OpenRouter
            return await AIEngine._generate_with_openrouter(prompt)

    @staticmethod
    async def _generate_json_with_fallback_ai(prompt: str) -> Optional[Dict[str, Any]]:
        """Genera JSON con Gemini como principal y OpenRouter como fallback."""
        # Intentar Gemini primero
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Limpiar markdown si existe
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            # Parsear JSON
            ai_response = json.loads(response_text)
            
            if isinstance(ai_response, dict):
                return ai_response
            return None
        except Exception:
            # Si Gemini falla, intentar OpenRouter
            openrouter_text = await AIEngine._generate_with_openrouter(prompt)
            if not openrouter_text:
                return None
            
            # Limpiar markdown si existe
            if openrouter_text.startswith('```json'):
                openrouter_text = openrouter_text[7:]
            if openrouter_text.startswith('```'):
                openrouter_text = openrouter_text[3:]
            if openrouter_text.endswith('```'):
                openrouter_text = openrouter_text[:-3]
            openrouter_text = openrouter_text.strip()
            
            # Parsear JSON
            try:
                ai_response = json.loads(openrouter_text)
                if isinstance(ai_response, dict):
                    return ai_response
            except Exception:
                pass
            
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
        
        # Detectar si es tema de cabello/caída capilar específicamente
        hair_keywords = ['calvo', 'calvicie', 'cabello', 'pelo', 'caida', 'caída', 'alopecia', 'entradas', 'dermatólogo', 'dermatologo']
        is_hair_related = any(kw in problem_lower for kw in hair_keywords)
        
        # Temas de salud - cabello/caída capilar (mensaje específico sin mencionar dolor)
        if is_hair_related:
            return "Entiendo que eso pueda preocuparte. Te dejo una orientación general sobre posibles causas y pasos seguros para revisar la caída del cabello."
        
        # Temas de salud general
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
            'quiero la', 'más sobre', 'mas sobre', 'sobre eso', 'hablame más de eso', 'háblame más de eso',
            'lo de', 'me interesa', 'esa parte', 'esa opción', 'esa opcion',
            'quiero saber más', 'quiero saber mas', 'profundiza', 'háblame de', 'hablame de'
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
    def _detect_response_mode(problem: str, conversation_context: Optional[List[Dict]] = None) -> str:
        """Detecta el modo de respuesta según la intención del usuario."""
        problem_lower = problem.lower()
        
        # Modo follow_up: si el usuario se refiere a algo anterior (prioridad máxima si hay contexto)
        is_follow_up, _ = AIEngine._detect_follow_up(problem)
        if is_follow_up and conversation_context:
            return "follow_up"
        
        # Modo suggestions: frases ambiguas de lugar/opciones con contexto (NO asumir food)
        lugar_ambiguous_phrases = [
            'lugar', 'lugares', 'para eso', 'para esto',
            'recomendar un lugar', 'recomiendas un lugar',
            'recomiéndame un lugar', 'recomiendame un lugar',
            'dónde puedo ir', 'donde puedo ir',
            'a dónde voy', 'a donde voy',
            'dónde lo llevo', 'donde lo llevo',
            'dónde la llevo', 'donde la llevo',
            'dónde lo arreglo', 'donde lo arreglo',
            'dónde lo compro', 'donde lo compro',
            'muéstrame lugares', 'muestrame lugares',
            'quiero ver lugares', 'quiero ver opciones',
            'muéstrame opciones', 'muestrame opciones'
        ]
        if conversation_context and any(p in problem_lower for p in lugar_ambiguous_phrases):
            # Solo devolver suggestions si NO es claramente comida
            if not AIEngine._is_food_related(problem_lower):
                return "suggestions"

        # Detectar categoría de intención
        intent_category = AIEngine._detect_intent_category(problem, conversation_context)
        
        # Modo food: primera pregunta abierta (sin especificar)
        if problem_lower == 'tengo hambre' or problem_lower == 'quiero comer' or problem_lower == 'se me antoja algo':
            return "food"
        
        # Modo suggestions: ropa, comida específica, productos, servicios
        if intent_category in ["clothing", "food", "product", "service"]:
            return "suggestions"
        
        # Modo journey: solo para problemas reales de salud o tecnología
        if intent_category in ["health", "tech"]:
            return "journey"
        
        # Si la conversación anterior fue food o suggestions, tratar respuestas cortas como suggestions
        # PERO solo si el mensaje actual NO contiene una nueva categoría clara
        if conversation_context:
            last_response = conversation_context[0].get("ai_response", {})
            if last_response.get("response_mode") == "food" or last_response.get("response_mode") == "suggestions":
                # Si es respuesta corta (menos de 8 palabras) Y NO es una nueva categoría clara
                if len(problem_lower.split()) <= 7:
                    # Verificar que no sea una nueva categoría
                    if not AIEngine._is_clothing_related(problem_lower) and not AIEngine._is_health_related(problem_lower) and not AIEngine._is_tech_related(problem_lower):
                        return "suggestions"
        
        # Modo direct: preguntas simples, sociales, o que no requieren diagnóstico
        # Excluir "lo de" si no hay contexto, ya que podría ser follow-up sin contexto disponible
        direct_keywords = [
            'hola', 'gracias', 'buenos dias', 'buenas tardes', 'buenas noches',
            'qué clima', 'que clima', 'clima hoy', 'tiempo hoy',
            'quiero aprender', 'quiero dinero', 'quiero ganar',
            'explícame eso', 'explcame eso', 'hablame más de eso', 'hablame mas de eso',
            'háblame más de eso', 'háblame mas de eso', 'lo de la dieta me interesa',
            'eso me interesa', 'más sobre', 'mas sobre'
        ]
        
        # Solo detectar "lo de" como direct si NO hay contexto de conversación
        if 'lo de' in problem_lower and conversation_context:
            # Si hay contexto, "lo de" probablemente es follow-up, no direct
            pass
        elif any(kw in problem_lower for kw in direct_keywords):
            return "direct"
        
        # Modo food: hambre, comida, restaurantes
        food_keywords = [
            'tengo hambre', 'quiero comer', 'dónde como', 'donde como',
            'quiero almorzar', 'quiero cenar', 'se me antoja',
            'quiero pizza', 'quiero hamburguesa', 'comida cerca',
            'restaurantes cerca', 'lugar para comer', 'puesto de comida'
        ]
        
        if any(kw in problem_lower for kw in food_keywords):
            return "food"
        
        # Modo providers: búsqueda explícita de profesionales
        providers_keywords = [
            'recomiéndame un profesional', 'recomiendame un profesional',
            'necesito un técnico', 'busca alguien que', 'necesito cambiar',
            'necesito arreglar', 'necesito reparar', 'busco profesional',
            'busco técnico', 'busco especialista'
        ]
        
        if any(kw in problem_lower for kw in providers_keywords):
            return "providers"
        
        # Modo journey: problemas que necesitan diagnóstico (default)
        journey_keywords = [
            'se apaga', 'se cae', 'no carga', 'no funciona',
            'se dañó', 'se daño', 'fallando', 'falla',
            'me duele', 'duele', 'dolor', 'problema con',
            'no enciende', 'no prende', 'error', 'roto', 'averiada'
        ]
        
        if any(kw in problem_lower for kw in journey_keywords):
            return "journey"
        
        # Default: journey para problemas no clasificados
        return "journey"

    @staticmethod
    def _generate_direct_answer(problem: str, user_location: Optional[str]) -> str:
        """Genera respuesta directa para preguntas simples."""
        problem_lower = problem.lower()
        
        # Clima
        if 'clima' in problem_lower or 'tiempo' in problem_lower:
            if user_location:
                return f"Claro, ¿en qué ciudad quieres revisar el clima? Actualmente tengo tu ubicación como {user_location}."
            return "Claro, ¿en qué ciudad quieres revisar el clima?"
        
        # Aprender
        if 'aprender' in problem_lower:
            if 'guitarra' in problem_lower:
                return "¡Qué buena idea! Para aprender guitarra desde cero, te recomiendo empezar con acordes básicos (C, G, Am, F), practicar cambios lentos entre ellos, y usar un metrónomo para mantener el ritmo. ¿Quieres que te dé recursos específicos o una ruta de aprendizaje?"
            if 'piano' in problem_lower:
                return "¡Excelente elección! Para aprender piano, empieza con la postura correcta, ejercicios de dedos en escalas mayores, y canciones simples con una mano. ¿Prefieres música clásica o popular?"
            return "¡Qué buena idea! Te dejo una ruta sencilla para empezar desde cero y avanzar sin confundirte. ¿Sobre qué tema específico quieres aprender?"
        
        # Dinero
        if 'dinero' in problem_lower or 'ganar' in problem_lower:
            return "Entiendo. Te dejo ideas realistas para organizarte mejor y buscar ingresos adicionales de forma segura. ¿Te interesa algo online, presencial, o tienes alguna habilidad específica que quieras monetizar?"
        
        # Saludos
        if 'hola' in problem_lower or 'buenos' in problem_lower:
            return "¡Hola! ¿En qué puedo ayudarte hoy?"
        
        # Gracias
        if 'gracias' in problem_lower:
            return "¡De nada! Si necesitas algo más, aquí estoy."
        
        # Default
        return "Entiendo. ¿Podrías darme más detalles sobre lo que necesitas para ayudarte mejor?"

    @staticmethod
    async def _handle_food_mode(problem: str, user_location: Optional[str], db: Session) -> Dict[str, Any]:
        """Maneja preguntas de comida."""
        problem_lower = problem.lower().strip()
        
        # Si solo dice "tengo hambre" sin especificar
        if problem_lower == 'tengo hambre' or problem_lower == 'quiero comer':
            return {
                "response_mode": "food",
                "direct_answer": "¿Se te antoja algo rápido, económico, saludable o algo específico como pescado, sushi, pizza, hamburguesa o comida casera?",
                "confidence_score": 0.5,
                "diagnosis": {"possible_causes": [], "questions": []},
                "instant_solutions": [],
                "has_providers": False,
                "providers": [],
                "composite_solution": None,
                "fallback": None,
                "natural_message": None
            }
        
        # Si el usuario especificó algo, usar Gemini para generar sugerencias dinámicas
        ai_response = await AIEngine._generate_dynamic_suggestions_with_ai(problem)
        
        if ai_response:
            # Default recommendation_label y provider_category para food
            recommendation_label = "Restaurantes disponibles"
            provider_category = "restaurante"
            
            # Buscar proveedores si hay provider_category
            providers = []
            if provider_category:
                db_providers = db.query(Provider).filter(
                    Provider.category.ilike(f"%{provider_category}%")
                ).all()
                for db_provider in db_providers:
                    rating = get_provider_rating(db, db_provider.id)
                    providers.append({
                        "provider_id": db_provider.id,
                        "business_name": db_provider.business_name,
                        "trust_score": db_provider.trust_score,
                        "rating": rating,
                        "distance_km": None,
                        "reason_bullets": [],
                        "estimated_cost": f"${db_provider.price_min}-${db_provider.price_max}" if db_provider.price_min else "Consultar",
                        "available_now": db_provider.available_now,
                        "response_time_hours": db_provider.response_time_hours
                    })
                providers = sorted(providers, key=lambda p: (
                    not p.get("available_now", False),
                    -p.get("rating", 0),
                    -p.get("trust_score", 0)
                ))
            
            return {
                "response_mode": "suggestions",
                "direct_answer": ai_response["direct_answer"],
                "suggestions_label": ai_response["suggestions_label"],
                "suggestions": ai_response["suggestions"],
                "recommendation_label": recommendation_label,
                "intent_category": "food",
                "confidence_score": 0.7,
                "diagnosis": {"possible_causes": [], "questions": []},
                "instant_solutions": [],
                "has_providers": True,
                "providers": providers,
                "composite_solution": None,
                "fallback": None,
                "natural_message": None
            }
        
        # Fallback si Gemini falla: responder con mensaje de error sin tarjetas
        return {
            "response_mode": "direct",
            "direct_answer": "No pude generar sugerencias en este momento porque el servicio de IA no está disponible. Intenta nuevamente en unos segundos.",
            "confidence_score": 0.3,
            "diagnosis": {"possible_causes": [], "questions": []},
            "instant_solutions": [],
            "has_providers": False,
            "providers": [],
            "composite_solution": None,
            "fallback": None,
            "natural_message": None
        }

    @staticmethod
    async def _handle_suggestions_mode(problem: str, conversation_context: Optional[List[Dict]], user_location: Optional[str], db: Session, resolved_intent: Optional[Dict] = None) -> Dict[str, Any]:
        """Maneja sugerencias genéricas (ropa, comida, productos, servicios)."""
        if resolved_intent and resolved_intent.get("intent_category") and resolved_intent["intent_category"] not in [None, "general"]:
            intent_category = resolved_intent["intent_category"]
        else:
            intent_category = AIEngine._detect_intent_category(problem, conversation_context)
        
        domain = resolved_intent.get("domain") if resolved_intent else None
        target_item = resolved_intent.get("target_item") if resolved_intent else None
        resolved_problem = resolved_intent.get("resolved_problem") if resolved_intent else None
        domain_context = f"\nDominio detectado: \"{domain}\"\nObjeto específico: \"{target_item}\"\n" if domain else ""
        resolved_context = f"\nNecesidad resuelta: \"{resolved_problem}\"\n" if resolved_problem and resolved_problem != problem else ""
        needs_note = "\n- El usuario necesita un proveedor o lugar. DEBES generar recommendation_label y provider_category obligatoriamente." if (resolved_intent and resolved_intent.get("needs_providers")) else ""

        prompt = f"""
El usuario necesita sugerencias. Responde SOLO con un JSON válido (sin markdown, sin texto adicional).

Solicitud del usuario: "{problem}"

Categoría general: "{intent_category}"{domain_context}{resolved_context}
Contexto de conversación anterior: {conversation_context[0] if conversation_context else "Ninguno"}

El JSON debe tener esta estructura exacta:
{{
  "response_mode": "suggestions",
  "direct_answer": "Respuesta natural en español, entendiendo la necesidad actual del usuario.",
  "suggestions_label": "Etiqueta descriptiva para las sugerencias (ej: 'Opciones para una prenda ajustada', 'Opciones rápidas para almorzar').",
  "suggestions": ["Opción 1", "Opción 2", ..., "Opción 12"],
  "recommendation_label": "Etiqueta para proveedores si aplica (ej: 'Costureras o sastres disponibles', 'Restaurantes disponibles').",
  "provider_category": "Categoría de proveedor si aplica (ej: 'costurera', 'restaurante', 'zapatero')."
}}

Reglas:
- Analiza primero la necesidad actual del usuario.
- Usa el contexto solo si el mensaje actual es ambiguo.
- Las sugerencias deben ser relevantes al dominio y objeto específico del usuario.
- No convertir productos o servicios en diagnóstico técnico o de salud.
- No inventar proveedores ni nombres de negocios reales.
- Para comida, dar opciones para buscar o preparar.
- Devuelve 6 a 12 sugerencias útiles.
- Responder en español natural.
- recommendation_label y provider_category deben ser coherentes con el dominio.{needs_note}
- El JSON debe ser válido y parseable.
"""
        
        ai_response = await AIEngine._generate_json_with_fallback_ai(prompt)
        
        if not ai_response:
            # Si ambas IAs fallan, devolver respuesta directa sin tarjetas
            return {
                "response_mode": "direct",
                "direct_answer": "No pude generar sugerencias en este momento porque el servicio de IA no está disponible. Intenta nuevamente en unos segundos.",
                "confidence_score": 0.3,
                "diagnosis": {"possible_causes": [], "questions": []},
                "instant_solutions": [],
                "has_providers": False,
                "providers": [],
                "composite_solution": None,
                "fallback": None,
                "natural_message": None
            }
        
        # Validar estructura
        if 'direct_answer' not in ai_response or 'suggestions_label' not in ai_response or 'suggestions' not in ai_response:
            return {
                "response_mode": "direct",
                "direct_answer": "No pude generar sugerencias en este momento porque el servicio de IA no está disponible. Intenta nuevamente en unos segundos.",
                "confidence_score": 0.3,
                "diagnosis": {"possible_causes": [], "questions": []},
                "instant_solutions": [],
                "has_providers": False,
                "providers": [],
                "composite_solution": None,
                "fallback": None,
                "natural_message": None
            }
        
        if not isinstance(ai_response['suggestions'], list):
            return {
                "response_mode": "direct",
                "direct_answer": "No pude generar sugerencias en este momento porque el servicio de IA no está disponible. Intenta nuevamente en unos segundos.",
                "confidence_score": 0.3,
                "diagnosis": {"possible_causes": [], "questions": []},
                "instant_solutions": [],
                "has_providers": False,
                "providers": [],
                "composite_solution": None,
                "fallback": None,
                "natural_message": None
            }
        
        if not isinstance(ai_response['direct_answer'], str) or not ai_response['direct_answer'].strip():
            return {
                "response_mode": "direct",
                "direct_answer": "No pude generar sugerencias en este momento porque el servicio de IA no está disponible. Intenta nuevamente en unos segundos.",
                "confidence_score": 0.3,
                "diagnosis": {"possible_causes": [], "questions": []},
                "instant_solutions": [],
                "has_providers": False,
                "providers": [],
                "composite_solution": None,
                "fallback": None,
                "natural_message": None
            }
        
        if not isinstance(ai_response['suggestions_label'], str) or not ai_response['suggestions_label'].strip():
            return {
                "response_mode": "direct",
                "direct_answer": "No pude generar sugerencias en este momento porque el servicio de IA no está disponible. Intenta nuevamente en unos segundos.",
                "confidence_score": 0.3,
                "diagnosis": {"possible_causes": [], "questions": []},
                "instant_solutions": [],
                "has_providers": False,
                "providers": [],
                "composite_solution": None,
                "fallback": None,
                "natural_message": None
            }
        
        # Normalizar suggestions: limpiar markdown y filtrar vacíos
        suggestions = ai_response['suggestions']
        suggestions = [AIEngine._clean_markdown(s) for s in suggestions if isinstance(s, str) and s.strip()]
        suggestions = [s for s in suggestions if s]
        suggestions = suggestions[:12]
        
        if len(suggestions) < 6:
            return {
                "response_mode": "direct",
                "direct_answer": "No pude generar sugerencias en este momento porque el servicio de IA no está disponible. Intenta nuevamente en unos segundos.",
                "confidence_score": 0.3,
                "diagnosis": {"possible_causes": [], "questions": []},
                "instant_solutions": [],
                "has_providers": False,
                "providers": [],
                "composite_solution": None,
                "fallback": None,
                "natural_message": None
            }
        
        ai_response['suggestions'] = suggestions
        
        has_dynamic_intent = bool(
            resolved_intent and (
                resolved_intent.get("needs_providers")
                or resolved_intent.get("provider_category")
                or resolved_intent.get("recommendation_label")
                or resolved_intent.get("domain")
                or resolved_intent.get("target_item")
                or resolved_intent.get("need_type")
            )
        )

        # recommendation_label fijo por categoría (solo sin intención dinámica)
        if not has_dynamic_intent:
            fixed_labels = {
                "food": "Restaurantes disponibles",
                "clothing": "Costureras o sastres disponibles",
                "service": "Proveedores disponibles",
                "product": "Tiendas o proveedores disponibles",
            }
            if intent_category in fixed_labels:
                ai_response["recommendation_label"] = fixed_labels[intent_category]

            if not ai_response.get("provider_category"):
                default_categories = {
                    "food": "restaurante",
                    "clothing": "costurera",
                    "service": "servicio",
                    "product": "tienda",
                }
                ai_response["provider_category"] = default_categories.get(intent_category)

        # Override con resolved_intent si tiene información dinámica útil
        if has_dynamic_intent:
            if resolved_intent.get("recommendation_label"):
                ai_response["recommendation_label"] = resolved_intent["recommendation_label"]
            if resolved_intent.get("provider_category"):
                ai_response["provider_category"] = resolved_intent["provider_category"]

        # Garantizar provider_category/recommendation_label cuando needs_providers=true
        needs_providers = resolved_intent.get("needs_providers") if has_dynamic_intent else False
        if needs_providers:
            if not ai_response.get("provider_category"):
                domain = (resolved_intent.get("domain") or "").lower() if has_dynamic_intent else ""
                target_item = (resolved_intent.get("target_item") or "").lower() if has_dynamic_intent else ""
                need_type = (resolved_intent.get("need_type") or "").lower() if has_dynamic_intent else ""
                dc = {
                    "buy_product": "tienda de",
                    "repair_service": "técnico de",
                    "hire_professional": "profesional de",
                    "find_place": "proveedor de",
                    "urgent_help": "servicio urgente de",
                    "more_suggestions": "proveedor de",
                    "clarification": "proveedor de",
                    "compare_options": "proveedor de",
                    "self_guidance": "proveedor de",
                }
                prefix = dc.get(need_type, "proveedor de")
                if target_item:
                    ai_response["provider_category"] = f"{prefix} {target_item}"
                elif domain and domain not in ("general", "none", ""):
                    ai_response["provider_category"] = f"{prefix} {domain}"
                    # Para "find_place" con domain, usar el domain directamente como categoría
                    if need_type == "find_place" and domain:
                        ai_response["provider_category"] = domain
                else:
                    ai_response["provider_category"] = "servicio"
            if not ai_response.get("recommendation_label"):
                pc = ai_response.get("provider_category", "servicio")
                ai_response["recommendation_label"] = f"{pc.capitalize()} disponibles"

        # Buscar proveedores si hay provider_category
        provider_category = ai_response.get('provider_category')
        providers = []

        # Determinar si se solicitó búsqueda de proveedores
        provider_search_requested = bool(provider_category or ai_response.get("recommendation_label"))
        # Si necesita proveedores, forzar búsqueda incluso si category/label están vacíos
        if needs_providers:
            provider_search_requested = True
        
        if provider_category:
            # Buscar proveedores por categoría
            db_providers = db.query(Provider).filter(
                Provider.category.ilike(f"%{provider_category}%")
            ).all()
            
            # Convertir a formato de diccionario y ordenar
            for db_provider in db_providers:
                rating = get_provider_rating(db, db_provider.id)
                providers.append({
                    "provider_id": db_provider.id,
                    "business_name": db_provider.business_name,
                    "trust_score": db_provider.trust_score,
                    "rating": rating,
                    "distance_km": None,
                    "reason_bullets": [],
                    "estimated_cost": f"${db_provider.price_min}-${db_provider.price_max}" if db_provider.price_min else "Consultar",
                    "available_now": db_provider.available_now,
                    "response_time_hours": db_provider.response_time_hours
                })
            
            # Ordenar por available_now, rating, trust_score
            providers = sorted(providers, key=lambda p: (
                not p.get("available_now", False),
                -p.get("rating", 0),
                -p.get("trust_score", 0)
            ))
        
        return {
            "response_mode": "suggestions",
            "direct_answer": ai_response["direct_answer"],
            "suggestions_label": ai_response["suggestions_label"],
            "suggestions": ai_response["suggestions"],
            "recommendation_label": ai_response.get("recommendation_label"),
            "intent_category": intent_category,
            "confidence_score": 0.7,
            "diagnosis": {"possible_causes": [], "questions": []},
            "instant_solutions": [],
            "has_providers": provider_search_requested,
            "providers": providers,
            "composite_solution": None,
            "fallback": None,
            "natural_message": None
        }

    @staticmethod
    def _detect_food_type(problem: str) -> Optional[str]:
        """Detecta el tipo de comida mencionado en el problema."""
        food_types = {
            'pescado': 'pescado',
            'ceviche': 'pescado',
            'mariscos': 'pescado',
            'camarones': 'pescado',
            'camaron': 'camarones',
            'camarón': 'camarones',
            'pizza': 'pizza',
            'hamburguesa': 'hamburguesa',
            'burger': 'hamburguesa',
            'pollo': 'pollo',
            'carne': 'carne',
            'asado': 'carne',
            'pasta': 'pasta',
            'spaghetti': 'pasta',
            'lasagna': 'pasta',
            'lasaña': 'pasta',
            'arroz': 'arroz',
            'ensalada': 'ensalada',
            'sopa': 'sopa',
            'tacos': 'tacos',
            'burritos': 'tacos',
            'sandwich': 'sandwich',
            'sándwich': 'sandwich',
            'pan': 'pan',
            'postre': 'postre',
            'dulce': 'postre',
            'helado': 'postre',
            'fruta': 'fruta',
            'verduras': 'verduras',
            'vegetales': 'verduras',
            'queso': 'queso',
            'pincho': 'pinchos',
            'pinchos': 'pinchos',
            'sushi': 'sushi',
            'empanada': 'empanadas',
            'empanadas': 'empanadas',
            'arepa': 'arepas',
            'arepas': 'arepas',
            'papas': 'papas',
            'salchipapa': 'salchipapas',
            'hot dog': 'hotdog',
            'hotdog': 'hotdog'
        }
        
        problem_lower = problem.lower()
        for keyword, food_type in food_types.items():
            if keyword in problem_lower:
                return food_type
        
        return None


    @staticmethod
    async def _generate_dynamic_suggestions_with_ai(food_request: str) -> Optional[Dict[str, Any]]:
        """Genera sugerencias dinámicas usando Gemini con fallback a OpenRouter."""
        prompt = f"""
El usuario quiere sugerencias de comida. Responde SOLO con un JSON válido (sin markdown, sin texto adicional).

Solicitud del usuario: "{food_request}"

El JSON debe tener esta estructura exacta:
{{
  "direct_answer": "Respuesta natural en español, confirmando el antojo y presentando las opciones.",
  "suggestions_label": "Etiqueta descriptiva para las sugerencias (ej: 'Sugerencias con queso', 'Sugerencias de pinchos').",
  "suggestions": ["Opción 1", "Opción 2", ..., "Opción 10"]
}}

Reglas:
- Responder en español natural.
- Dar entre 8 y 12 sugerencias.
- No inventar restaurantes.
- No diagnosticar.
- No mencionar "soluciones inmediatas".
- Si el usuario pide comida, dar platos, preparaciones o ideas que podría buscar/preparar.
- Adaptar a contexto latinoamericano/Ecuador cuando tenga sentido.
- Mantenerlo seguro y común.
- El JSON debe ser válido y parseable.
"""
        
        ai_response = await AIEngine._generate_json_with_fallback_ai(prompt)
        
        if not ai_response:
            return None
        
        # Validar estructura
        if 'direct_answer' not in ai_response or 'suggestions_label' not in ai_response or 'suggestions' not in ai_response:
            return None
        if not isinstance(ai_response['suggestions'], list):
            return None
        if not isinstance(ai_response['direct_answer'], str) or not ai_response['direct_answer'].strip():
            return None
        if not isinstance(ai_response['suggestions_label'], str) or not ai_response['suggestions_label'].strip():
            return None
        
        # Normalizar suggestions: limpiar markdown y filtrar vacíos
        suggestions = ai_response['suggestions']
        suggestions = [AIEngine._clean_markdown(s) for s in suggestions if isinstance(s, str) and s.strip()]
        suggestions = [s for s in suggestions if s]
        suggestions = suggestions[:12]
        if len(suggestions) < 8:
            return None
        
        ai_response['suggestions'] = suggestions
        
        return ai_response

    @staticmethod
    async def _handle_follow_up_mode(problem: str, conversation_context: List[Dict], db: Session) -> Dict[str, Any]:
        """Maneja follow-ups usando contexto de conversación anterior."""
        last_conv = conversation_context[0] if conversation_context else None
        if not last_conv:
            # Fallback si no hay contexto
            return {
                "response_mode": "direct",
                "direct_answer": "No tengo contexto de la conversación anterior. ¿Podrías repetir tu pregunta?",
                "confidence_score": 0.3,
                "diagnosis": {"possible_causes": [], "questions": []},
                "instant_solutions": [],
                "has_providers": False,
                "providers": [],
                "composite_solution": None,
                "fallback": None,
                "natural_message": None
            }
        
        last_problem = last_conv.get("problem_text", "")
        last_response = last_conv.get("ai_response", {})
        last_solutions = last_response.get("instant_solutions", [])
        
        # Generar respuesta contextual usando Gemini con el contexto
        context_prompt = f"""
El usuario está haciendo un follow-up sobre una conversación anterior.

Pregunta anterior: {last_problem}
Soluciones anteriores:
"""
        for idx, sol in enumerate(last_solutions, 1):
            context_prompt += f"{idx}. {sol}\n"
        
        context_prompt += f"\nNueva pregunta del usuario: {problem}\n"
        context_prompt += "Responde de forma natural y conversacional, explicando el contexto relevante. No uses formato JSON, solo responde directamente."
        
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(context_prompt)
            direct_answer = response.text.strip()
        except Exception:
            # Fallback local si Gemini falla
            direct_answer = AIEngine._generate_local_follow_up(problem, last_problem, last_solutions)
        
        return {
            "response_mode": "follow_up",
            "direct_answer": direct_answer,
            "confidence_score": 0.6,
            "diagnosis": {"possible_causes": [], "questions": []},
            "instant_solutions": [],
            "has_providers": False,
            "providers": [],
            "composite_solution": None,
            "fallback": None,
            "natural_message": None
        }

    @staticmethod
    def _generate_local_follow_up(problem: str, last_problem: str, last_solutions: List[str]) -> str:
        """Genera respuesta local de follow-up cuando Gemini falla."""
        problem_lower = problem.lower()
        
        # Detectar si se refiere a dieta/nutrición específicamente
        if 'dieta' in problem_lower or 'nutrición' in problem_lower or 'nutricion' in problem_lower:
            return "Claro. En el tema de la caída del cabello, la dieta puede influir si hay deficiencias de proteínas, hierro, zinc o vitamina D. Puedes empezar revisando si estás comiendo suficiente proteína, legumbres, verduras y alimentos ricos en hierro. Si la caída es fuerte, repentina o continúa, lo ideal es consultar con un dermatólogo."
        
        # Detectar si se refiere a una opción específica
        is_follow_up, option_number = AIEngine._detect_follow_up(problem)
        if option_number and 1 <= option_number <= len(last_solutions):
            selected_solution = last_solutions[option_number - 1]
            return f"Claro. Sobre esa opción: {selected_solution}. ¿Te gustaría que profundice en algún aspecto específico?"
        
        # Fallback genérico
        return f"Entiendo que quieres continuar con el tema anterior. La última pregunta fue sobre '{last_problem}'. ¿Podrías aclarar qué aspecto específico te interesa profundizar?"
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
        # 0. Resolver intención con contexto (IA + fallback local)
        resolved = await AIEngine._resolve_intent_with_context(problem, conversation_context)

        # 1. Detectar modo de respuesta
        response_mode = AIEngine._detect_response_mode(problem, conversation_context)

        # 2. Override response_mode cuando la IA tiene un modo específico
        if (resolved.get("confidence", 0) >= 0.5 and
            resolved.get("response_mode") and
            resolved["response_mode"] not in [None, "general"]):

            # Follow-up: override con confianza >= 0.5 (más permisivo porque hay contexto)
            if resolved.get("is_followup"):
                if response_mode == "journey" or resolved.get("confidence", 0) >= 0.7:
                    response_mode = resolved["response_mode"]

            # Mensaje nuevo: override solo si existing cayó en "journey" (catch-all) con confianza >= 0.7
            elif response_mode == "journey" and resolved.get("confidence", 0) >= 0.7:
                response_mode = resolved["response_mode"]

        # Si IA devolvió "providers", convertirlo a "suggestions" (frontend lo maneja así)
        if response_mode == "providers":
            response_mode = "suggestions"

        # 3. Si needs_providers está activo y no estamos en suggestions, forzarlo
        if resolved.get("needs_providers") and response_mode not in ("suggestions", "direct"):
            response_mode = "suggestions"

        # 4. Problema efectivo (con contexto resuelto si es follow-up)
        effective_problem = resolved.get("resolved_problem", problem) if resolved.get("is_followup") else problem

        # 5. Manejar modo direct: respuestas simples sin diagnóstico
        if response_mode == "direct":
            direct_answer = AIEngine._generate_direct_answer(effective_problem, user_location)
            return {
                "response_mode": "direct",
                "direct_answer": direct_answer,
                "confidence_score": 0.5,
                "diagnosis": {"possible_causes": [], "questions": []},
                "instant_solutions": [],
                "has_providers": False,
                "providers": [],
                "composite_solution": None,
                "fallback": None,
                "natural_message": None
            }

        # 6. Manejar modo food: preguntas de comida
        if response_mode == "food":
            return await AIEngine._handle_food_mode(effective_problem, user_location, db)

        # 7. Manejar modo suggestions con resolución de contexto dinámica
        if response_mode == "suggestions":
            return await AIEngine._handle_suggestions_mode(effective_problem, conversation_context, user_location, db, resolved_intent=resolved)

        # 8. Manejar modo follow_up: continuar conversación anterior
        if response_mode == "follow_up" and conversation_context:
            return await AIEngine._handle_follow_up_mode(effective_problem, conversation_context, db)

        # 9. Para modo journey, continuar con flujo normal
        # Detectar si es follow-up y extraer número de opción
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

        Problema del usuario: {effective_problem}
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

        # 2. Llamar a Gemini con fallback a OpenRouter
        ai_result = await AIEngine._generate_json_with_fallback_ai(prompt)
        
        if not ai_result:
            # Si ambas IAs fallan, devolver respuesta directa sin tarjetas
            # Detectar si es problema de salud para mensaje específico
            problem_lower = problem.lower()
            is_clothing_related = AIEngine._is_clothing_related(problem_lower)
            is_health_related = AIEngine._is_health_related(problem_lower)
            
            if is_health_related:
                direct_answer = "No puedo darte una orientación completa en este momento porque la IA no está disponible. Si el dolor es fuerte, empeora, viene con síntomas preocupantes o no mejora, busca ayuda médica."
            else:
                direct_answer = "No pude procesar tu solicitud en este momento porque el servicio de IA no está disponible. Intenta nuevamente en unos segundos."
            
            return {
                "response_mode": "direct",
                "direct_answer": direct_answer,
                "confidence_score": 0.3,
                "diagnosis": {"possible_causes": [], "questions": []},
                "instant_solutions": [],
                "has_providers": False,
                "providers": [],
                "composite_solution": None,
                "fallback": None,
                "natural_message": None
            }

        # 3. Validar y completar instant_solutions si está vacío o inválido
        instant_solutions = ai_result.get("instant_solutions")
        
        # Detectar tipo de problema para generar soluciones apropiadas y mensajes naturales
        problem_lower = problem.lower()
        is_clothing_related = AIEngine._is_clothing_related(problem_lower)
        is_health_related = AIEngine._is_health_related(problem_lower)
        is_tech_related = AIEngine._is_tech_related(problem_lower)
        
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
                "natural_message": AIEngine._generate_natural_message(problem, False, is_health_related),
                "response_mode": "journey"
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
                "fuga": "Home Services",
                "dolor": "Health & Wellness",
                "espalda": "Health & Wellness",
                "fisioterapia": "Health & Wellness",
                "médico": "Health & Wellness",
                "medico": "Health & Wellness",
                "clínica": "Health & Wellness",
                "clinica": "Health & Wellness",
                "salud": "Health & Wellness",
                "contractura": "Health & Wellness",
                "muscular": "Health & Wellness"
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

        journey_rec_label = None
        if has_providers:
            if is_health_related:
                journey_rec_label = "Centros de atención disponibles"
            elif response_mode == "providers":
                journey_rec_label = "Especialistas disponibles"

        return {
            "confidence_score": ai_result.get("confidence_score", 0.5),
            "diagnosis": ai_result["diagnosis"],
            "instant_solutions": ai_result.get("instant_solutions", []),
            "has_providers": has_providers,
            "providers": recommended_providers,
            "composite_solution": ai_result.get("composite_solution"),
            "fallback": fallback,
            "urgency": urgency,
            "natural_message": natural_message,
            "response_mode": response_mode,
            "recommendation_label": journey_rec_label
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