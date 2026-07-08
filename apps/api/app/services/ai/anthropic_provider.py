"""Anthropic-backed AI provider."""
from __future__ import annotations

from app.services.ai.base import AIProvider, AIResult
from app.services.ai.prompts import (
    classify_prompt,
    extract_prompt,
    safe_json_loads,
    summarize_prompt,
)

DEFAULT_MODEL = "claude-haiku-4-5-20251001"


class AnthropicProvider(AIProvider):
    name = "anthropic"

    def __init__(self, api_key: str, model: str = "") -> None:
        super().__init__(model=model or DEFAULT_MODEL, is_mock=False)
        from anthropic import Anthropic

        self._client = Anthropic(api_key=api_key)

    def _chat(self, prompt: str) -> str:
        resp = self._client.messages.create(
            model=self.model,
            max_tokens=1024,
            temperature=0.2,
            messages=[{"role": "user", "content": prompt}],
        )
        parts = [block.text for block in resp.content if getattr(block, "type", "") == "text"]
        return "".join(parts).strip()

    def _result(self, data) -> AIResult:
        return AIResult(data=data, provider=self.name, model=self.model, is_mock=False)

    def summarize(self, text: str) -> AIResult:
        return self._result(self._chat(summarize_prompt(text)))

    def classify(self, text: str, categories: list[str]) -> AIResult:
        raw = self._chat(classify_prompt(text, categories))
        try:
            data = safe_json_loads(raw)
        except Exception:
            data = {"category": categories[-1] if categories else "unknown",
                    "confidence": 0.0, "explanation": raw[:200]}
        return self._result(data)

    def extract_json(self, text: str, schema_description: str) -> AIResult:
        raw = self._chat(extract_prompt(text, schema_description))
        try:
            data = safe_json_loads(raw)
        except Exception:
            data = {"_raw": raw[:500], "_error": "could not parse JSON"}
        return self._result(data)
