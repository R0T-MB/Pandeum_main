from datetime import datetime, timezone

def _mk_user(client, email, name):
    client.post("/auth/register", json={
        "email": email, "password": "secret123", "full_name": name,
    })
    # backdatear created_at para simular cuenta antigua (evita flag de bots)
    from app.models import User
    from app.database import get_db
    from app.main import app
    gen = app.dependency_overrides[get_db]()
    db = next(gen)
    u = db.query(User).filter(User.email == email).first()
    u.created_at = datetime(2020, 1, 1, tzinfo=timezone.utc)
    db.commit()
    gen.close()
    login = client.post("/auth/login", json={"email": email, "password": "secret123"}).json()
    return {"Authorization": f"Bearer {login['access_token']}"}


def test_review_content_moderation(client):
    # Proveedor
    client.post("/auth/register", json={
        "email": "prov@example.com", "password": "secret123", "full_name": "Prov",
    })
    plogin = client.post("/auth/login", json={"email": "prov@example.com", "password": "secret123"}).json()
    ph = {"Authorization": f"Bearer {plogin['access_token']}"}
    pid = client.post("/providers/register", headers=ph, json={
        "business_name": "Taller Mod", "category": "Tecnologia"}).json()["id"]

    h_good = _mk_user(client, "good@example.com", "Good")
    h_bad = _mk_user(client, "bad@example.com", "Bad")

    ok = client.post(f"/providers/{pid}/reviews", headers=h_good,
                     json={"rating": 5, "comment": "Excelente servicio"})
    assert ok.status_code == 200
    prof = client.post(f"/providers/{pid}/reviews", headers=h_bad,
                       json={"rating": 1, "comment": "Este lugar es una puta mierda"})
    assert prof.status_code == 200

    # solo la aprobada debe contarse en rating
    pub = client.get(f"/providers/{pid}").json()
    assert pub["rating"] == 5.0, pub
    assert pub["review_count"] == 1

    # listado solo muestra aprobadas
    revs = client.get(f"/providers/{pid}/reviews").json()
    assert len(revs) == 1
    assert revs[0]["comment"] == "Excelente servicio"
    assert all(r["comment"] != "Este lugar es una puta mierda" for r in revs)