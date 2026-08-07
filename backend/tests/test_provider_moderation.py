import pytest
from app.provider_moderation import provider_decision


def test_clean_provider_is_pending():
    d = provider_decision(
        business_name="Taller Mecánico Pérez",
        description="Reparación y mantenimiento de vehículos ligeros y pesados.",
        category="Home Services",
    )
    assert d["status"] == "pending"
    assert not d["flags"].get("pii")
    assert not d["flags"].get("spam")


def test_banned_category_is_rejected():
    d = provider_decision(
        business_name="Venta de Apuestas",
        category="apuestas",
        description="Casino online",
    )
    assert d["status"] == "rejected"
    assert "banned_category" in d["flags"]


def test_card_pii_in_description_is_rejected():
    d = provider_decision(
        business_name="Negocio Test",
        category="General",
        description="Pago con tarjeta 4111 1111 1111 1111 para contratar",
    )
    assert d["status"] == "rejected"
    assert "pii" in d["flags"]


def test_promotion_spam_is_rejected():
    d = provider_decision(
        business_name="Gana dinero rápido compra ya",
        category="General",
        description="te recomiendo visitar mi link en la bio",
    )
    assert d["status"] == "rejected"
    assert "spam" in d["flags"]


def test_phone_in_description_only_flags_pending():
    d = provider_decision(
        business_name="Tecnico Pablo",
        category="Technology",
        description="Reparo celulares, contactame al 0991234567",
    )
    # No es PII dura (teléfono ni email/card), no bloquea => pending con hint
    assert d["status"] == "pending"
    assert "review_hints" in d["flags"]