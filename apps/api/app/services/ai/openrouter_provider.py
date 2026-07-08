"""OpenRouter-backed AI provider.

OpenRouter (https://openrouter.ai) exposes an OpenAI-compatible API, so we reuse
the OpenAI client (and all of OpenAIProvider's summarize/classify/extract logic)
and only swap the base URL, key, and default model. This gives access to Claude,
GPT, Gemini, Llama, and free models through a single key.

Model ids use the ``vendor/model`` form, e.g. ``openai/gpt-4o-mini``,
``anthropic/claude-3.5-sonnet``, ``meta-llama/llama-3.1-8b-instruct:free``.
"""
from __future__ import annotations

from app.services.ai.base import AIProvider
from app.services.ai.openai_provider import OpenAIProvider

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "openai/gpt-4o-mini"


class OpenRouterProvider(OpenAIProvider):
    name = "openrouter"

    def __init__(self, api_key: str, model: str = "") -> None:
        # Initialize the base AIProvider directly so we control the model
        # default and build the client against OpenRouter's endpoint.
        AIProvider.__init__(self, model=model or DEFAULT_MODEL, is_mock=False)
        from openai import OpenAI

        self._client = OpenAI(
            api_key=api_key,
            base_url=OPENROUTER_BASE_URL,
            # Optional attribution headers OpenRouter uses for app ranking.
            default_headers={
                "HTTP-Referer": "https://github.com/ahmadsharara39/FlowPilot-AI",
                "X-Title": "FlowPilot AI",
            },
        )
