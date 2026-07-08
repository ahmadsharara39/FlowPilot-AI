"""FastAPI application entrypoint for FlowPilot AI."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import (
    auth,
    connectors,
    dashboard,
    executions,
    health,
    webhooks,
    workflows,
)
from app.core.config import settings
from app.core.database import Base, engine

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Import models so metadata is populated, then create tables if missing.
    # (Alembic is the source of truth for migrations; this keeps local dev
    # frictionless — e.g. SQLite with no migration step.)
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="AI-powered automation & integration platform.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


for router in (
    health.router,
    auth.router,
    dashboard.router,
    workflows.router,
    executions.router,
    webhooks.router,
    connectors.router,
):
    app.include_router(router)


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {"app": settings.app_name, "docs": "/docs", "health": "/api/health"}
