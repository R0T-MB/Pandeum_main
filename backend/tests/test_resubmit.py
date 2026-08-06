from datetime import datetime, timezone, timedelta

from app.auth import create_access_token
from app.models import User, Provider
from app.database import get_db
from app.main import app


def _db_session():
    gen = app.dependency_overrides[get_db]()
    return next(gen), gen


def _mk_user(client, email, name):
    client.post("/auth/register", json={"email": email, "password": "secret123", "full_name": name})
    login = client.post("/auth/login", json={"email": email, "password": "secret123"}).json()
    return {"Authorization": f"Bearer {login['access_token']}"}


def test_provider_resubmit_after_rejection(client):
    # proveedor con cuenta antigua (evita fresh_account en reseñas; aquí no aplica)
    ph = _mk_user(client, "prov@x.com", "Proveedor")
    r = client.post("/providers/register", headers=ph, json={
        "business_name": "Taller", "category": "Tecnologia",
    })
    assert r.status_code == 200, r.text
    pid = r.json()["id"]

    # crear admin autenticado
    gen = app.dependency_overrides[get_db]()
    db = next(gen)
    prov_user = db.query(User).filter(User.email == "prov@x.com").first()
    prov_user.is_admin = True
    db.commit()
    gen.close()
    ah = {"Authorization": f"Bearer {create_access_token({'sub': str(prov_user.id)})}"}

    # rechazar sin motivo -> 400
    bad = client.put(f"/admin/providers/{pid}/verify", headers=ah,
                     json={"verification_status": "rejected"})
    assert bad.status_code == 400

    # en la etapa inicial solo se rechaza por infracciones vigentes (contenido inapropiado / identidad falsa);
    # "datos_incompletos" no es motivo de bloqueo por ahora -> 400
    future = client.put(f"/admin/providers/{pid}/verify", headers=ah, json={
        "verification_status": "rejected",
        "rejection_category": "datos_incompletos",
        "rejection_reason": "Falta la dirección",
    })
    assert future.status_code == 400

    # rechazar con categoría vigente+motivo -> rejected con datos
    rej = client.put(f"/admin/providers/{pid}/verify", headers=ah, json={
        "verification_status": "rejected",
        "rejection_category": "contenido_inapropiado",
        "rejection_reason": "La descripción contiene ofertas promocionales y enlaces externos",
    })
    assert rej.status_code == 200, rej.text
    assert rej.json()["verification_status"] == "rejected"
    assert rej.json()["rejection_reason"] == "La descripción contiene ofertas promocionales y enlaces externos"
    assert rej.json()["can_apply"] is False
    assert rej.json()["cooldown_seconds"] > 0

    # re-solicitud dentro del cooldown -> 429
    early = client.post("/providers/resubmit", headers=ph, json={})
    assert early.status_code == 429

    # forzar rejected_at hacia el pasado (>72h) para poder re-enviar
    from datetime import timedelta
    gen = app.dependency_overrides[get_db]()
    db = next(gen)
    prov = db.query(Provider).filter(Provider.id == pid).first()
    prov.rejected_at = datetime.now(timezone.utc) - timedelta(hours=96)
    db.commit()
    gen.close()

    # re-solicitud explícita → vuelve a pending y limpia el rechazo
    ok = client.post("/providers/resubmit", headers=ph, json={
        "correction_note": "Añadí dirección y precios",
    })
    assert ok.status_code == 200, ok.text
    body = ok.json()
    assert body["verification_status"] == "pending"
    assert body["rejection_reason"] is None
    assert body["can_apply"] is True

    # la petición aparece de nuevo en la cola pendiente del admin
    pending = client.get("/admin/providers/pending", headers=ah).json()
    assert any(p["id"] == pid for p in pending)