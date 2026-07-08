"""Shared prompt builders for real LLM providers."""
from __future__ import annotations

import json


def summarize_prompt(text: str) -> str:
    return (
        "Summarize the following content in 1-3 clear sentences. "
        "Return only the summary text, no preamble.\n\n"
        f"CONTENT:\n{text}"
    )


def classify_prompt(text: str, categories: list[str]) -> str:
    cats = ", ".join(categories)
    return (
        "You are a strict text classifier. Classify the content into exactly one "
        f"of these categories: [{cats}].\n"
        "Respond with ONLY a JSON object of the form "
        '{"category": <one of the categories>, "confidence": <0..1 float>, '
        '"explanation": <short reason>}. No markdown, no code fences.\n\n'
        f"CONTENT:\n{text}"
    )


def extract_prompt(text: str, schema_description: str) -> str:
    return (
        "Extract structured data from the content below. "
        f"Fields / schema to extract: {schema_description}.\n"
        "Respond with ONLY a valid JSON object using snake_case keys. "
        "Use null when a value is not present. No markdown, no code fences.\n\n"
        f"CONTENT:\n{text}"
    )


def safe_json_loads(raw: str) -> dict:
    """Best-effort parse of an LLM JSON response (strips code fences)."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        # drop a leading language tag like "json\n"
        if "\n" in cleaned:
            cleaned = cleaned.split("\n", 1)[1]
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start != -1 and end != -1:
        cleaned = cleaned[start : end + 1]
    return json.loads(cleaned)
