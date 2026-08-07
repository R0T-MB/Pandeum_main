"""
Moderación automática de proveedores (filtro anti negocios de mala intención).

Analiza los datos de registro de un negocio y devuelve un veredicto:
- "pending": sin señales claras de mala intención => espera revisión del admin
  (proceso normal de verificación). Si hay señales menores, se anotan en flags.
- "rejected": señales claras de spam/PII/categoría prohibida => bloqueado
  automáticamente sin pasar a revisión humana.
"""
import re
from typing import Dict, List, Optional
from datetime import datetime, timezone

# Categorías que no corresponden a un negocio legítimo de servicios
BANNED_CATEGORIES = [
    "sexo", "adultos", "nude", "casino", "apuestas", "juego de azar",
    "armas", "droga", "narcotico", "préstamo pirata", "cartel",
]

# Patrones reutilizados del sistema de moderación de reseñas
URL_PATTERN = re.compile(
    r"(https?://|www\.|\b[a-z0-9.-]+\.(com|net|org|io|xyz|info|co|click|biz)([/\s]|$|\b))",
    re.IGNORECASE,
)
EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PHONE_PATTERN = re.compile(r"(\+?\d[\d\s\-()]{7,}\d)")
CARD_PATTERN = re.compile(r"\b(?:\d[ -]*){13,16}\b")

# Palabras de spam/promoción no propias de una descripción legítima
SPAM_WORDS = [
    "gana dinero rapido", "gana dinero fácil", "haz clic", "click aqui", "click aquí",
    "compra seguidores", "venta de seguidores", "trabaja desde casa ganando",
    "invierte y gana", "pago por adelantado", "solo transferencia", "dinero facil",
    "link en la bio", "sigueme", "sígueme", "entera", "compra ya", "oferta limitada",
]


def _scan(text: Optional[str]) -> List[str]:
    """Devuelve señales encontradas en un texto (enlaces, email, tel, tarjeta, spam)."""
    signals: List[str] = []
    t = text or ""
    tl = t.lower()
    if URL_PATTERN.search(t):
        signals.append("url")
    if EMAIL_PATTERN.search(t):
        signals.append("email")
    if PHONE_PATTERN.search(t):
        signals.append("phone")
    if CARD_PATTERN.search(t):
        signals.append("card")
    for word in SPAM_WORDS:
        if word in tl:
            signals.append(f"spam:{word}")
    return signals


def provider_decision(
    business_name: Optional[str],
    description: Optional[str],
    category: Optional[str],
) -> Dict:
    """
    Devuelve {status, flags} con el veredicto del filtro automático.

    - category prohibida => rejected.
    - PII dura (email en nombre/descripción, tarjeta) => rejected.
    - Spam claro / enlaces / teléfono / palabras de promoción => rejected.
    - Sin señales claras => pending (revisión admin normal).
    """
    flags: Dict[str, List[str]] = {}

    name = (business_name or "").strip()
    desc = (description or "").strip()
    category_l = (category or "").strip().lower()

    banned = [c for c in BANNED_CATEGORIES if c in category_l]
    if banned:
        flags["banned_category"] = banned
        return {"status": "rejected", "flags": flags}

    name_signals = _scan(name)
    desc_signals = _scan(desc)

    combined: Dict[str, List[str]] = {}
    if name_signals:
        combined["name"] = name_signals
    if desc_signals:
        combined["description"] = desc_signals

    # PII dura: email/card son datos personales en el texto del negocio
    for field, sigs in combined.items():
        if "card" in sigs or "email" in sigs:
            flags["pii"] = [f"{field}:{s}" for s in sigs if s in ("card", "email")]
    if flags.get("pii"):
        return {"status": "rejected", "flags": flags}

    # Spam: palabras de promoción o enlaces al nombre/descripción
    hard = any("spam:" in s for sigs in combined.values() for s in sigs)
    if hard or "url" in name_signals:
        flags["spam"] = [s for sigs in combined.values() for s in sigs if "spam:" in s or s == "url"]
        return {"status": "rejected", "flags": flags}

    # Señales menores (teléfono en descripción, URL en web) => no bloquean,
    # solo anotan para la revisión humana.
    if combined:
        flags["review_hints"] = combined

    return {"status": "pending", "flags": flags}


def apply_moderation(provider, business_name, description, category) -> bool:
    """Aplica el filtro anti negocios de mala intención a un Provider.

    Guarda las señales en `provider.trust_factors["provider_moderation"]` y,
    si el veredicto es reject, marca el provider como rechazado automáticamente.
    Devuelve True si fue rechazado por el filtro.
    """
    decision = provider_decision(
        business_name=business_name,
        description=description,
        category=category,
    )
    trust_factors = dict(provider.trust_factors or {})
    trust_factors["provider_moderation"] = decision["flags"]
    provider.trust_factors = trust_factors

    if decision["status"] == "rejected":
        provider.verification_status = "rejected"
        provider.rejection_category = "contenido_inapropiado"
        provider.rejection_reason = (
            "Tu solicitud fue rechazada automáticamente por datos que no corresponden "
            "a un negocio legítimo. Edita tu información y vuelve a intentarlo."
        )
        provider.rejected_at = datetime.now(timezone.utc)
        return True
    return False
