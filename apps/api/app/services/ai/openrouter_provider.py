"""OpenRouter AI provider — the single external LLM backend for FlowPilot.

OpenRouter (https://openrouter.ai) is one API + one key that routes to many
models (OpenAI, Anthropic, Google, Llama, …). It speaks an OpenAI-compatible
protocol, but we call it directly with httpx so the app needs no vendor SDKs.

Model ids use the ``vendor/model`` form, e.g. ``openai/gpt-4o-mini``,
``anthropic/claude-3.5-sonnet``, ``meta-llama/llama-3.1-8b-instruct``.
"""
from __future__ import annotations

import httpx

from app.services.ai.base import AIProvider, AIResult
from app.services.ai.prompts import (
    classify_prompt,
    extract_prompt,
    safe_json_loads,
    summarize_prompt,
)

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
# "openrouter/free" is OpenRouter's auto-router that picks an available *free*
# model — so real AI runs at zero cost out of the box. Override with AI_MODEL
# (e.g. openai/gpt-4o-mini) for more consistent quality.
DEFAULT_MODEL = "openrouter/free"


class OpenRouterProvider(AIProvider):
    name = "openrouter"

    def __init__(self, api_key: str, model: str = "") -> None:
        super().__init__(model=model or DEFAULT_MODEL, is_mock=False)
        self._api_key = api_key

    def _chat(self, prompt: str) -> str:
        resp = httpx.post(
            f"{OPENROUTER_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {self._api_key}",
                "Content-Type": "application/json",
                # Optional attribution headers OpenRouter uses for app ranking.
                "HTTP-Referer": "https://github.com/ahmadsharara39/FlowPilot-AI",
                "X-Title": "FlowPilot AI",
            },
            json={
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2,
            },
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        return (data["choices"][0]["message"]["content"] or "").strip()

    def _result(self, data) -> AIResult:
        return AIResult(data=data, provider=self.name, model=self.model, is_mock=False)

    def summarize(self, text: str) -> AIResult:
        return self._result(self._chat(summarize_prompt(text)))

    def classify(self, text: str, categories: list[str]) -> AIResult:
        raw = self._chat(classify_prompt(text, categories))
        try:
            data = safe_json_loads(raw)
        except Exception:
            data = {
                "category": categories[-1] if categories else "unknown",
                "confidence": 0.0,
                "explanation": raw[:200],
            }
        return self._result(data)

    def extract_json(self, text: str, schema_description: str) -> AIResult:
        raw = self._chat(extract_prompt(text, schema_description))
        try:
            data = safe_json_loads(raw)
        except Exception:
            data = {"_raw": raw[:500], "_error": "could not parse JSON"}
        return self._result(data)
