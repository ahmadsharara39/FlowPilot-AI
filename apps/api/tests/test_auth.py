def test_register_and_me(client):
    resp = client.post(
        "/api/auth/register",
        json={"name": "Ada", "email": "ada@example.com", "password": "secret123"},
    )
    assert resp.status_code == 201
    token = resp.json()["access_token"]

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "ada@example.com"


def test_login_wrong_password(client):
    client.post(
        "/api/auth/register",
        json={"name": "Ada", "email": "ada@example.com", "password": "secret123"},
    )
    resp = client.post(
        "/api/auth/login", json={"email": "ada@example.com", "password": "nope"}
    )
    assert resp.status_code == 401


def test_protected_requires_auth(client):
    assert client.get("/api/workflows").status_code == 401
