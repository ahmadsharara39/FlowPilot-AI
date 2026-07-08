"""Pytest fixtures: isolated in-memory app + client."""
from __future__ import annotations

import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_flowpilot.db")
os.environ.setdefault("AI_PROVIDER", "mock")
os.environ.setdefault("EXECUTION_MODE", "inline")

import pytest
from fastapi.testclient import TestClient

from app.core.database import Base, engine
from app.main import app


@pytest.fixture(autouse=True)
def _fresh_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_client(client):
    client.post(
        "/api/auth/register",
        json={"name": "Test", "email": "t@example.com", "password": "secret123"},
    )
    resp = client.post(
        "/api/auth/login", json={"email": "t@example.com", "password": "secret123"}
    )
    token = resp.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client
