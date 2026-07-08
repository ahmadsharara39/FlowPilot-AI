"""SQLAlchemy engine, session factory, and declarative base."""
from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


def _normalize_db_url(url: str) -> str:
    """Make managed-Postgres URLs work with the psycopg (v3) driver we ship.

    Hosts like Render/Heroku hand out ``postgres://`` or ``postgresql://`` URLs,
    which SQLAlchemy would route to psycopg2 (not installed). Force psycopg v3.
    """
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://") :]
    elif url.startswith("postgresql://") and "+psycopg" not in url:
        url = "postgresql+psycopg://" + url[len("postgresql://") :]
    return url


DATABASE_URL = _normalize_db_url(settings.database_url)

# SQLite needs a special connect arg when used across threads (FastAPI).
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=_connect_args,
    pool_pre_ping=True,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
