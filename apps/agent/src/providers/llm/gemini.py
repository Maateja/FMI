import json
import time
from collections.abc import AsyncIterator
from typing import Any

import httpx
from pydantic import BaseModel

from src.core.config import agent_settings
from src.core.logging import agent_logger
from src.providers.base import LLMMessage, LLMProvider


class GeminiLLM(LLMProvider):
    """
    LLM Provider using Google Gemini 2.0 Flash via REST endpoint.
    Free tier primary brain for the interviewer.
    """

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self.api_key = api_key or agent_settings.GEMINI_API_KEY
        self.model = model or agent_settings.GEMINI_MODEL
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}"

    def _convert_messages(self, messages: list[LLMMessage]) -> list[dict[str, Any]]:
        contents: list[dict[str, Any]] = []
        for msg in messages:
            role = "user" if msg.role in ("user", "system") else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg.content}],
            })
        return contents

    async def generate_response(
        self,
        messages: list[LLMMessage],
        temperature: float = 0.7,
        max_tokens: int = 250,
    ) -> str:
        # Fallback to MockLLM if placeholder key
        if self.api_key.startswith("placeholder"):
            agent_logger.warning("Using mock LLM because GEMINI_API_KEY is a placeholder")
            last_user_text = ""
            for m in reversed(messages):
                if m.role == "user":
                    last_user_text = m.content.lower()
                    break

            if any(k in last_user_text for k in ["project", "built", "created", "developed", "app", "website"]):
                tech_match = next((t for t in ["react", "node", "python", "fastapi", "django", "sql", "aws", "docker", "nextjs"] if t in last_user_text), None)
                if tech_match:
                    return f"You mentioned building that with {tech_match.title()}! Why did you choose that specific tech stack over alternatives, and how did you architect the application?"
                return "That sounds like an interesting project! How did you build it from scratch, and what was the toughest engineering challenge you solved?"

            if any(k in last_user_text for k in ["certification", "certified", "course", "coursera", "udemy", "bootcamp"]):
                return "Congratulations on completing that certification course! What was the most challenging technical concept you mastered, and how have you applied it to real code?"

            if "react" in last_user_text:
                return "You brought up React—how do you manage component state and side effects, and what strategies do you use to prevent unnecessary re-renders?"

            if any(k in last_user_text for k in ["myself", "background", "student", "graduate", "college", "introduce", "hello", "hi"]):
                return "Thank you for introducing yourself! Could you highlight one technical project from your resume that you are most proud of building?"

            return "That's a solid explanation. Can you elaborate on how you handle performance optimization and error handling in that context?"

        url = f"{self.base_url}:generateContent?key={self.api_key}"
        payload = {
            "contents": self._convert_messages(messages),
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }

        start_time = time.perf_counter()
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(url, json=payload)
            res.raise_for_status()
            data = res.json()

        latency_ms = (time.perf_counter() - start_time) * 1000
        agent_logger.info("Gemini LLM response received", latency_ms=round(latency_ms, 2))

        try:
            return str(data["candidates"][0]["content"]["parts"][0]["text"]).strip()
        except (KeyError, IndexError):
            return "Could you please elaborate on that point?"

    async def stream_response(
        self,
        messages: list[LLMMessage],
        temperature: float = 0.7,
    ) -> AsyncIterator[str]:
        response_text = await self.generate_response(messages, temperature=temperature)
        for word in response_text.split(" "):
            yield word + " "

    async def evaluate_structured(
        self,
        prompt: str,
        output_schema: type[BaseModel],
    ) -> BaseModel:
        # Schema-guided structured output
        schema_json = json.dumps(output_schema.model_json_schema())
        messages = [
            LLMMessage(
                role="system",
                content=(
                    "You are a strict technical evaluator. Output MUST be valid JSON "
                    f"conforming strictly to this JSON Schema:\n{schema_json}"
                ),
            ),
            LLMMessage(role="user", content=prompt),
        ]
        raw_text = await self.generate_response(messages, temperature=0.2, max_tokens=1500)
        cleaned = raw_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return output_schema.model_validate_json(cleaned)


class GroqLlamaLLM(LLMProvider):
    """
    Fallback LLM Provider using Groq's Llama 3.3 70B Versatile.
    """

    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key or agent_settings.GROQ_API_KEY
        self.endpoint = "https://api.groq.com/openai/v1/chat/completions"

    async def generate_response(
        self,
        messages: list[LLMMessage],
        temperature: float = 0.7,
        max_tokens: int = 250,
    ) -> str:
        if self.api_key.startswith("placeholder"):
            return "Good start. Can you tell me what happens under the hood when a Promise resolves?"

        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        headers = {"Authorization": f"Bearer {self.api_key}"}

        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(self.endpoint, headers=headers, json=payload)
            res.raise_for_status()
            data = res.json()

        return str(data["choices"][0]["message"]["content"]).strip()

    async def stream_response(
        self,
        messages: list[LLMMessage],
        temperature: float = 0.7,
    ) -> AsyncIterator[str]:
        text = await self.generate_response(messages, temperature=temperature)
        for word in text.split(" "):
            yield word + " "

    async def evaluate_structured(
        self,
        prompt: str,
        output_schema: type[BaseModel],
    ) -> BaseModel:
        messages = [
            LLMMessage(
                role="system",
                content="Output ONLY raw JSON conforming to the requested schema.",
            ),
            LLMMessage(role="user", content=prompt),
        ]
        raw = await self.generate_response(messages, temperature=0.1, max_tokens=1500)
        cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return output_schema.model_validate_json(cleaned)


class MockLLM(LLMProvider):
    """Zero-dependency deterministic Mock LLM for automated tests and offline dev."""

    def __init__(self, default_response: str = "Great answer. How does this behave in concurrent requests?") -> None:
        self.default_response = default_response

    async def generate_response(
        self,
        messages: list[LLMMessage],
        temperature: float = 0.7,
        max_tokens: int = 250,
    ) -> str:
        return self.default_response

    async def stream_response(
        self,
        messages: list[LLMMessage],
        temperature: float = 0.7,
    ) -> AsyncIterator[str]:
        for token in self.default_response.split(" "):
            yield token + " "

    async def evaluate_structured(
        self,
        prompt: str,
        output_schema: type[BaseModel],
    ) -> BaseModel:
        # Returns default instance of model for test
        return output_schema()
