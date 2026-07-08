"""Step handlers + registry.

Each handler has the signature ``handler(config: dict, data: Any) -> Any`` and
returns the output that becomes the input to the next step. Handlers raise
``StepError`` on expected failures. New step types are added by writing a
handler and decorating it with ``@register("step_type")`` — no engine changes.
"""
from __future__ import annotations

from collections.abc import Callable
from typing import Any

import httpx

from app.services.ai import get_ai_provider
from app.services.engine.context import StepError, coerce_text, render_template

Handler = Callable[[dict, Any], Any]

_REGISTRY: dict[str, Handler] = {}


def register(step_type: str) -> Callable[[Handler], Handler]:
    def deco(fn: Handler) -> Handler:
        _REGISTRY[step_type] = fn
        return fn

    return deco


def get_handler(step_type: str) -> Handler:
    handler = _REGISTRY.get(step_type)
    if handler is None:
        raise StepError(f"Unknown step type: '{step_type}'")
    return handler


def registered_step_types() -> list[str]:
    return sorted(_REGISTRY.keys())


# --------------------------------------------------------------------------- #
# AI steps
# --------------------------------------------------------------------------- #
@register("ai_summarize")
def ai_summarize(config: dict, data: Any) -> dict:
    text = coerce_text(data)
    result = get_ai_provider().summarize(text)
    return {
        "summary": result.data,
        "_ai": {"provider": result.provider, "model": result.model, "mock": result.is_mock},
    }


@register("ai_classify")
def ai_classify(config: dict, data: Any) -> dict:
    categories = config.get("categories") or []
    if not categories:
        raise StepError("ai_classify requires a non-empty 'categories' list in config.")
    text = coerce_text(data)
    result = get_ai_provider().classify(text, categories)
    payload = dict(result.data) if isinstance(result.data, dict) else {"category": result.data}
    payload["_ai"] = {"provider": result.provider, "model": result.model, "mock": result.is_mock}
    return payload


@register("ai_extract_json")
def ai_extract_json(config: dict, data: Any) -> dict:
    schema = config.get("schema_description") or config.get("fields") or ""
    if isinstance(schema, list):
        schema = ", ".join(str(s) for s in schema)
    text = coerce_text(data)
    result = get_ai_provider().extract_json(text, schema)
    payload = dict(result.data) if isinstance(result.data, dict) else {"value": result.data}
    payload["_ai"] = {"provider": result.provider, "model": result.model, "mock": result.is_mock}
    return payload


# --------------------------------------------------------------------------- #
# HTTP request
# --------------------------------------------------------------------------- #
@register("http_request")
def http_request(config: dict, data: Any) -> dict:
    method = (config.get("method") or "POST").upper()
    url = config.get("url")
    if not url:
        raise StepError("http_request requires a 'url' in config.")
    headers = config.get("headers") or {}
    body_template = config.get("body_template")
    timeout = float(config.get("timeout", 15))

    body: Any = None
    if body_template is not None:
        if isinstance(body_template, str):
            body = render_template(body_template, data)
        else:
            body = body_template  # already a dict/list -> send as JSON

    try:
        with httpx.Client(timeout=timeout) as client:
            kwargs: dict[str, Any] = {"headers": headers}
            if method in ("GET", "DELETE", "HEAD"):
                pass
            elif isinstance(body, (dict, list)):
                kwargs["json"] = body
            elif body is not None:
                kwargs["content"] = body
            resp = client.request(method, url, **kwargs)
    except httpx.HTTPError as exc:
        raise StepError(f"HTTP request failed: {exc}") from exc

    try:
        parsed = resp.json()
    except Exception:
        parsed = resp.text[:2000]
    return {"status_code": resp.status_code, "response": parsed}


# --------------------------------------------------------------------------- #
# Slack webhook (mock, with optional real delivery)
# --------------------------------------------------------------------------- #
@register("slack_webhook_mock")
def slack_webhook_mock(config: dict, data: Any) -> dict:
    template = config.get("message_template") or "New notification: {{ input }}"
    message = render_template(template, data)
    channel = config.get("channel", "#general")
    webhook_url = config.get("webhook_url")

    delivered = False
    delivery_error = None
    if webhook_url:
        try:
            with httpx.Client(timeout=10) as client:
                resp = client.post(webhook_url, json={"text": message})
                delivered = resp.status_code < 400
                if not delivered:
                    delivery_error = f"Slack returned {resp.status_code}"
        except httpx.HTTPError as exc:
            delivery_error = str(exc)

    return {
        "slack_message": message,
        "channel": channel,
        "delivered": delivered,
        "mode": "real" if webhook_url else "mock",
        "delivery_error": delivery_error,
    }


# --------------------------------------------------------------------------- #
# Save result
# --------------------------------------------------------------------------- #
@register("save_result")
def save_result(config: dict, data: Any) -> dict:
    label = config.get("label", "result")
    # Persisting happens via the execution's output_payload; here we just
    # wrap/echo the current data so it is clearly captured as the final output.
    return {"saved": True, "label": label, "data": data}
