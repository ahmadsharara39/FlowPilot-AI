"""Shared helpers for step handlers."""
from __future__ import annotations

import json
from typing import Any


class StepError(Exception):
    """Raised by a handler when a step fails in an expected way."""


def coerce_text(payload: Any) -> str:
    """Turn an arbitrary payload into text a language model can read."""
    if payload is None:
        return ""
    if isinstance(payload, str):
        return payload
    if isinstance(payload, dict):
        # Prefer a natural-language field if present.
        for key in ("message", "text", "content", "body", "input"):
            val = payload.get(key)
            if isinstance(val, str) and val.strip():
                return val
        return json.dumps(payload, ensure_ascii=False, indent=2)
    return str(payload)


def render_template(template: str, data: Any) -> str:
    """Very small ``{{ key }}`` templating over a dict/text payload.

    Unknown keys are left blank. Supports ``{{ input }}`` to inject the whole
    payload as JSON/text.
    """
    if not template:
        return ""
    import re

    def replace(match: "re.Match[str]") -> str:
        key = match.group(1).strip()
        if key == "input":
            return coerce_text(data)
        if isinstance(data, dict) and key in data:
            val = data[key]
            return val if isinstance(val, str) else json.dumps(val, ensure_ascii=False)
        return ""

    return re.sub(r"{{\s*([\w.]+)\s*}}", replace, template)
