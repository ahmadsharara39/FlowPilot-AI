"""Static catalog of connectors surfaced on the Connectors page.

Active connectors map to real step types / trigger capabilities. Coming-soon
connectors are clearly flagged and are NOT wired to any executable behavior.
"""
from __future__ import annotations

from app.core.config import settings

CONNECTORS: list[dict] = [
    {
        "key": "webhook",
        "name": "Webhook",
        "description": "Trigger workflows from external HTTP POST requests via a unique token URL.",
        "category": "trigger",
        "status": "active",
        "icon": "webhook",
    },
    {
        "key": "http_api",
        "name": "HTTP API",
        "description": "Call any external REST API as a workflow step with method, headers and body.",
        "category": "action",
        "status": "active",
        "icon": "globe",
    },
    {
        "key": "ai_provider",
        "name": "AI Provider",
        "description": "Summarize, classify and extract structured data via OpenRouter (any model) or the built-in mock.",
        "category": "ai",
        "status": "active",
        "icon": "sparkles",
    },
    {
        "key": "slack_webhook_mock",
        "name": "Slack Webhook (Mock)",
        "description": "Send Slack-style notifications. Works fully in mock mode; supports a real incoming webhook URL too.",
        "category": "action",
        "status": "active",
        "icon": "message",
    },
    {
        "key": "website_monitor",
        "name": "Website Monitor",
        "description": "Detect changes on a web page and summarize them with AI.",
        "category": "trigger",
        "status": "coming_soon",
        "icon": "monitor",
    },
    {
        "key": "gmail",
        "name": "Gmail",
        "description": "Trigger on new emails and send messages.",
        "category": "trigger",
        "status": "coming_soon",
        "icon": "mail",
    },
    {
        "key": "google_sheets",
        "name": "Google Sheets",
        "description": "Read and append rows to spreadsheets.",
        "category": "action",
        "status": "coming_soon",
        "icon": "table",
    },
]


def get_connectors() -> list[dict]:
    """Return connectors with live runtime info attached to the AI provider card."""
    result = []
    for c in CONNECTORS:
        item = dict(c)
        if c["key"] == "ai_provider":
            using_mock = settings.ai_provider != "openrouter" or not settings.openrouter_api_key
            item["detail"] = (
                "Using deterministic mock AI"
                if using_mock
                else f"Provider: OpenRouter · model {settings.ai_model or 'openai/gpt-4o-mini'}"
            )
            item["using_mock"] = using_mock
        result.append(item)
    return result
