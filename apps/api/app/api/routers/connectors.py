"""Connector catalog route."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.services.connectors import get_connectors

router = APIRouter(prefix="/api/connectors", tags=["connectors"])


@router.get("")
def list_connectors(user: User = Depends(get_current_user)) -> list[dict]:
    return get_connectors()
