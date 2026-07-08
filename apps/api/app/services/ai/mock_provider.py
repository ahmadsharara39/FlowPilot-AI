"""Deterministic mock AI provider.

Used automatically when no real API key is configured so the whole platform
is fully demoable offline. Every method is deterministic (keyword heuristics),
which also makes tests reliable.
"""
from __future__ import annotations

import re

from app.services.ai.base import AIProvider, AIResult

_URGENT_HINTS = ("urgent", "immediately", "asap", "today", "charged twice", "broken", "down", "critical", "refund")
_BILLING_HINTS = ("charge", "billing", "invoice", "payment", "refund", "subscription", "price")
_BUG_HINTS = ("bug", "error", "crash", "broken", "not working", "fails", "500")
_FEATURE_HINTS = ("feature", "would be nice", "please add", "request", "suggestion", "wish")


class MockAIProvider(AIProvider):
    name = "mock"

    def __init__(self, model: str = "mock-1") -> None:
        super().__init__(model=model, is_mock=True)

    def _result(self, data) -> AIResult:
        return AIResult(data=data, provider=self.name, model=self.model, is_mock=True)

    def summarize(self, text: str) -> AIResult:
        clean = re.sub(r"\s+", " ", text or "").strip()
        if not clean:
            return self._result("(no input to summarize)")
        sentences = re.split(r"(?<=[.!?])\s+", clean)
        head = " ".join(sentences[:2]).strip()
        summary = head if len(head) <= 240 else head[:237].rstrip() + "..."
        return self._result(f"Summary: {summary}")

    def classify(self, text: str, categories: list[str]) -> AIResult:
        lowered = (text or "").lower()
        scores: dict[str, int] = {c: 0 for c in categories}

        def bump(cat: str, hints: tuple[str, ...], weight: int = 1) -> None:
            if cat in scores:
                scores[cat] += sum(weight for h in hints if h in lowered)

        # Heuristic mapping onto common category names.
        for cat in categories:
            cl = cat.lower()
            if "bug" in cl or "urgent" in cl:
                bump(cat, _BUG_HINTS + _URGENT_HINTS)
            if "bill" in cl:
                bump(cat, _BILLING_HINTS, weight=2)
            if "feature" in cl:
                bump(cat, _FEATURE_HINTS, weight=2)
            # keyword overlap with the category label itself
            scores[cat] += sum(1 for w in re.findall(r"\w+", cl) if w in lowered)

        best = max(scores, key=scores.get) if categories else "unknown"
        top = scores.get(best, 0)
        if top == 0 and categories:
            best = categories[-1]  # fall back to the last (often "general") category
        total = sum(scores.values()) or 1
        confidence = round(0.5 + 0.5 * (top / total), 2) if categories else 0.0
        return self._result(
            {
                "category": best,
                "confidence": confidence,
                "explanation": f"(mock) Matched category '{best}' via keyword heuristics.",
            }
        )

    def extract_json(self, text: str, schema_description: str) -> AIResult:
        fields = [f.strip() for f in re.split(r"[,\n]", schema_description or "") if f.strip()]
        out: dict[str, object] = {}
        lowered = text or ""
        for field in fields:
            key = re.sub(r"\s+", "_", field.lower())
            # Try "field: value" patterns; otherwise leave null.
            m = re.search(rf"{re.escape(field)}\s*[:=]\s*(.+)", lowered, re.IGNORECASE)
            out[key] = m.group(1).strip().splitlines()[0] if m else None
        if not fields:
            out = {"text": (text or "").strip()[:500]}
        out["_extracted_by"] = "mock"
        return self._result(out)
