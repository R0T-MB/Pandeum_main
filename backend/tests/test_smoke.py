def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_root(client):
    res = client.get("/")
    assert res.status_code == 200
    assert "Pandeum" in res.json()["message"]


def test_register_and_login(client):
    res = client.post("/auth/register", json={
        "email": "user@example.com",
        "password": "secret123",
        "full_name": "Test User",
    })
    assert res.status_code == 200
    assert res.json()["email"] == "user@example.com"

    login = client.post("/auth/login", json={
        "email": "user@example.com",
        "password": "secret123",
    })
    assert login.status_code == 200
    assert login.json()["access_token"]


def test_login_wrong_password(client):
    client.post("/auth/register", json={
        "email": "fail@example.com",
        "password": "secret123",
    })
    res = client.post("/auth/login", json={
        "email": "fail@example.com",
        "password": "wrong",
    })
    assert res.status_code == 401


def test_clerk_sync_rejects_without_secret(client):
    res = client.post("/auth/clerk-sync", json={
        "clerk_user_id": "user_123",
        "email": "clerk@example.com",
    })
    assert res.status_code == 403


def test_clerk_sync_account_type_sanitized(client):
    res = client.post("/auth/clerk-sync",
        headers={"x-clerk-sync-secret": "test-sync-secret"},
        json={
            "clerk_user_id": "user_admin",
            "email": "admin@example.com",
            "account_type": "admin",
        })
    assert res.status_code == 200
    user = res.json()
    assert user["is_admin"] is False
    assert user["account_type"] == "client"


def test_current_user_requires_auth(client):
    res = client.get("/users/me")
    assert res.status_code in (401, 403)