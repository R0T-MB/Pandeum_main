"""
Moderación automática de reseñas (estilo + detección de fraude).

El flujo asigna a cada reseña un `review_verification_status`:
- "approved": pasa todos los filtros => visible en el/la proveedor.
- "pending": genera sospecha (espera revisión del admin).
- "rejected": contenido claramente inapropiado (spam/profanidad/PII).
"""
import re
from typing import Dict, List
from datetime import timedelta, datetime, timezone
from sqlalchemy.orm import Session
from .models import Review, User

# ---- Palabras/clave de contenido inapropiado y profanidad (en minúsculas) ----
PROFANITY_KEYWORDS = [
    "mierda", "puta", "puto", "hijo de puta", "pendejo", "estupido", "estúpido",
    "idiota", "imbecil", "imbécil", "maldito", "culo", "pinche", "zorra", "zorro",
    "joder", "coño", "gilipollas", "cabron", "cabrón", "váyanse a la mierda",
    "vete a la mierda", "molestos", "estafador", "ladron", "ladrón", "incompetente",
    # odio/discriminación
    "negro", "sucio", "marica", "maricon", "maricón", "basura humana",
    "raro", "enfermo", "pervertido", "asqueroso",
]

# Patrones: enlaces sospechosos y datos personales (PII)
URL_PATTERN = re.compile(
    r"(https?://|www\.|\b[a-z0-9.-]+\.(com|net|org|io|xyz|info|co|click|biz)([/\s]|$|\b))",
    re.IGNORECASE,
)
EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PHONE_PATTERN = re.compile(r"(\+?\d[\d\s\-()]{7,}\d)")
CARD_PATTERN = re.compile(r"\b(?:\d[ -]*){13,16}\b")

# Palabras que indican spam (promoción, links, venta)
SPAM_KEYWORDS = [
    "comprar", "visitar", "haz clic", "click aqui", "click aquí", "gratis",
    "descuento", "promocion", "promoción", "ofert", "contactame", "contactanos",
    "whatsapp", "sigo", "sangria", "entera", "visita", "te recomiendo visitar",
]


def _flags_of(comment: str) -> Dict[str, List[str]]:
    """Devuelve dict de indicadores por tipo de filtro para un comentario."""
    flags: Dict[str, List[str]] = {}
    fc = comment or ""
    fc_l = fc.lower()

    fp = [k for k in PROFANITY_KEYWORDS if k in fc_l]
    if fp:
        flags["inappropriate"] = fp

    if URL_PATTERN.search(fc):
        flags["spam_links"] = [m for m in URL_PATTERN.findall(fc)]
    sp = [k for k in SPAM_KEYWORDS if k in fc_l]
    if sp:
        flags.setdefault("spam", []).extend(sp)
    if EMAIL_PATTERN.search(fc):
        flags["pii_email"] = EMAIL_PATTERN.findall(fc)
    if PHONE_PATTERN.search(fc):
        flags["pii_phone"] = PHONE_PATTERN.findall(fc)
    if CARD_PATTERN.search(fc):
        flags["pii_card"] = True
    return flags


def _flagged_user(db: Session, user: User) -> List[str]:
    """Detección de falsa impeditura / bots: cuenta nueva, reseñas masivas."""
    risk: List[str] = []
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if user:
        created = user.created_at
        if created is not None and getattr(created, "tzinfo", None) is not None:
            created = created.replace(tzinfo=None)
        # Cuenta demasiado nueva (menos de 24h) reseñando = señal de bots
        if created and created > (now - timedelta(hours=24)):
            risk.append("fresh_account")
        # Reseñas masivas en ventana de 10 minutos
        recent = db.query(Review).filter(
            Review.user_id == user.id,
            Review.created_at > (now - timedelta(minutes=10))
        ).count()
        if recent >= 3:
            risk.append("burst_reviews")
    return risk


def review_decision(comment: str, db: Session, user: User) -> dict:
    """
    Decide el estado y retorna dict con status y fraud_risk_flags.
    Reglas:
      - PII (email/phone/card) siempre manda a 'rejected'.
      - Profanidad o enlaces/spam => 'rejected'.
      - Señales de bots / cuenta nueva => 'pending' (revisión manual).
      - Caso contrario => 'approved'.
    """
    flags = _flags_of(comment)
    user_risks = _flagged_user(db, user)

    hard_issues = (
        flags.get("pii_email")
        or flags.get("pii_phone")
        or flags.get("pii_card")
        or flags.get("inappropriate")
        or flags.get("spam_links")
        or flags.get("spam")
    )

    combined = dict(flags)
    if user_risks:
        combined["account_signals"] = user_risks

    if hard_issues:
        status = "rejected"
    elif user_risks:
        status = "pending"
    else:
        status = "approved"

    return {"status": status, "flags": combined}