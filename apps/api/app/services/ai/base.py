"""AI provider interface.

Every provider implements the same three operations so the workflow engine
never cares which backend is in use. Each call returns an ``AIResult`` that
carries the payload plus metadata (which provider/model, whether it was mock).
"""
from __future__ import annotations

import abc
from dataclasses import dataclass, field
from typing import Any


@dataclass
class AIResult:
    """Uniform return type for every AI operation."""

    data: Any
    provider: str
    model: str
    is_mock: bool = False
    meta: dict[str, Any] = field(default_factory=dict)


class AIProvider(abc.ABC):
    """Abstract AI provider."""

    name: str = "base"

    def __init__(self, model: str, is_mock: bool = False) -> None:
        self.model = model
        self.is_mock = is_mock

    @abc.abstractmethod
    def summarize(self, text: str) -> AIResult:
        """Return a concise summary of ``text``."""

    @abc.abstractmethod
    def classify(self, text: str, categories: list[str]) -> AIResult:
        """Classify ``text`` into one of ``categories``.

        Returns ``AIResult`` whose ``data`` is a dict:
        ``{"category": str, "confidence": float, "explanation": str}``.
        """

    @abc.abstractmethod
    def extract_json(self, text: str, schema_description: str) -> AIResult:
        """Extract a structured JSON object from ``text``.

        ``schema_description`` describes the fields to pull out. Returns an
        ``AIResult`` whose ``data`` is a dict.
        """
