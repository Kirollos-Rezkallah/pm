from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Protocol

import httpx
from dotenv import load_dotenv

from app.models import AssistantResult, Board, ChatMessage


MODEL = "nvidia/nemotron-3-ultra-550b-a55b"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


class AIServiceError(RuntimeError):
    pass


class BoardAssistant(Protocol):
    async def answer(self, board: Board, messages: list[ChatMessage]) -> AssistantResult: ...


class OpenRouterClient:
    def __init__(self, api_key: str | None = None, transport: httpx.AsyncBaseTransport | None = None) -> None:
        load_dotenv(Path(__file__).resolve().parents[2] / ".env")
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        self.transport = transport

    async def answer(self, board: Board, messages: list[ChatMessage]) -> AssistantResult:
        if not self.api_key:
            raise AIServiceError("OpenRouter is not configured. Add OPENROUTER_API_KEY to .env.")

        schema = AssistantResult.model_json_schema()
        payload = {
            "model": MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a concise project-management assistant. The user owns one Kanban board with exactly five fixed columns. "
                        "Answer their request. Set board to null if no board change is needed. If a change is needed, return the complete updated board, "
                        "preserving every existing card unless the user explicitly asks to change it. Keep column IDs and the five columns."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {"board": board.model_dump(), "conversation": [message.model_dump() for message in messages]},
                        separators=(",", ":"),
                    ),
                },
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {"name": "kanban_assistant_response", "strict": True, "schema": schema},
            },
        }
        response = await self._request(payload)
        try:
            content = response["choices"][0]["message"]["content"]
            if not isinstance(content, str):
                raise TypeError("Response content was not text.")
            return AssistantResult.model_validate_json(content)
        except (KeyError, IndexError, TypeError, ValueError) as error:
            raise AIServiceError("OpenRouter returned an invalid structured response.") from error

    async def check_connection(self) -> str:
        if not self.api_key:
            raise AIServiceError("OpenRouter is not configured. Add OPENROUTER_API_KEY to .env.")
        response = await self._request(
            {
                "model": MODEL,
                "messages": [{"role": "user", "content": "What is 2 + 2? Reply with only the number."}],
                "max_tokens": 256,
            }
        )
        try:
            content = response["choices"][0]["message"]["content"]
            if not isinstance(content, str):
                raise TypeError("Response content was not text.")
            return content
        except (KeyError, IndexError, TypeError) as error:
            raise AIServiceError("OpenRouter returned an unexpected connectivity response.") from error

    async def _request(self, payload: dict[str, object]) -> dict[str, object]:
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        try:
            async with httpx.AsyncClient(timeout=30, transport=self.transport) as client:
                response = await client.post(OPENROUTER_URL, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()
        except (httpx.HTTPError, ValueError) as error:
            raise AIServiceError("OpenRouter could not complete the request.") from error
