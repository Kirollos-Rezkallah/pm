from __future__ import annotations

import json
from pathlib import Path
import asyncio

import httpx
import pytest
from fastapi.testclient import TestClient

from app.database import default_board
from app.main import create_app
from app.models import AssistantResult, Board, Card, ChatMessage
from app.openrouter import AIServiceError, OpenRouterClient


class FakeAssistant:
    def __init__(self, result: AssistantResult | Exception):
        self.result = result
        self.requests: list[list[ChatMessage]] = []

    async def answer(self, board: Board, messages: list[ChatMessage]) -> AssistantResult:
        del board
        self.requests.append(messages)
        if isinstance(self.result, Exception):
            raise self.result
        return self.result


@pytest.fixture
def client(tmp_path):
    frontend_dir = tmp_path / "out"
    frontend_dir.mkdir()
    (frontend_dir / "index.html").write_text("<h1>Kanban Studio</h1>", encoding="utf-8")
    assistant = FakeAssistant(AssistantResult(reply="I can help.", board=None))
    app = create_app(tmp_path / "kanban.db", frontend_dir, assistant)
    with TestClient(app) as test_client:
        yield test_client, assistant


def login(client: TestClient) -> None:
    response = client.post("/api/auth/login", json={"username": "user", "password": "password"})
    assert response.status_code == 200


def test_health_and_static_frontend_are_available(client):
    test_client, _ = client
    assert test_client.get("/api/health").json() == {"status": "ok"}
    assert "Kanban Studio" in test_client.get("/").text


def test_authentication_protects_the_board_and_supports_logout(client):
    test_client, _ = client
    assert test_client.get("/api/board").status_code == 401
    assert test_client.post("/api/auth/login", json={"username": "user", "password": "wrong"}).status_code == 401

    login(test_client)
    assert test_client.get("/api/auth/me").json() == {"username": "user"}
    assert len(test_client.get("/api/board").json()["columns"]) == 5
    assert test_client.post("/api/auth/logout").status_code == 204
    assert test_client.get("/api/board").status_code == 401


def test_board_update_persists_and_rejects_invalid_card_ownership(client):
    test_client, _ = client
    login(test_client)
    board = test_client.get("/api/board").json()
    board["columns"][0]["title"] = "Ideas"
    assert test_client.put("/api/board", json=board).status_code == 200
    assert test_client.get("/api/board").json()["columns"][0]["title"] == "Ideas"

    board["columns"][0]["cardIds"] = ["missing-card"]
    assert test_client.put("/api/board", json=board).status_code == 422


def test_chat_persists_assistant_card_creation_edit_and_move(tmp_path):
    updated_board = default_board()
    updated_board.cards["card-1"].title = "Prepare release"
    updated_board.columns[0].cardIds.remove("card-1")
    updated_board.columns[4].cardIds.append("card-1")
    updated_board.cards["card-new"] = Card(id="card-new", title="Schedule retrospective", details="Invite the project team.")
    updated_board.columns[2].cardIds.append("card-new")
    fake_assistant = FakeAssistant(AssistantResult(reply="I created, edited, and moved cards.", board=updated_board))
    app = create_app(database_path=tmp_path / "kanban.db", frontend_dir=Path("missing"), assistant=fake_assistant)
    with TestClient(app) as test_client:
        login(test_client)
        response = test_client.post("/api/chat", json={"messages": [{"role": "user", "content": "Prepare the release."}]})
        assert response.status_code == 200
        assert response.json()["reply"] == "I created, edited, and moved cards."
        persisted = test_client.get("/api/board").json()
        assert persisted["cards"]["card-1"]["title"] == "Prepare release"
        assert "card-1" in persisted["columns"][4]["cardIds"]
        assert persisted["cards"]["card-new"]["title"] == "Schedule retrospective"
        assert fake_assistant.requests[0][0].content == "Prepare the release."


def test_chat_surfaces_provider_failure(client):
    test_client, fake_assistant = client
    fake_assistant.result = AIServiceError("OpenRouter could not complete the request.")
    login(test_client)
    saved_board = test_client.get("/api/board").json()
    response = test_client.post("/api/chat", json={"messages": [{"role": "user", "content": "Help me."}]})
    assert response.status_code == 503
    assert response.json()["detail"] == "OpenRouter could not complete the request."
    assert test_client.get("/api/board").json() == saved_board


def test_openrouter_client_requests_structured_output():
    recorded_payload: dict[str, object] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal recorded_payload
        recorded_payload = json.loads(request.content)
        return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps({"reply": "Done", "board": None})}}]})

    client = OpenRouterClient(api_key="test", transport=httpx.MockTransport(handler))
    result = asyncio.run(client.answer(default_board(), [ChatMessage(role="user", content="Summarize the board.")]))
    assert result.reply == "Done"
    assert recorded_payload["model"] == "nvidia/nemotron-3-ultra-550b-a55b"
    assert recorded_payload["response_format"]["type"] == "json_schema"


def test_openrouter_client_rejects_an_invalid_model_board():
    def handler(_: httpx.Request) -> httpx.Response:
        invalid_result = {"reply": "Done", "board": {"columns": [], "cards": {}}}
        return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps(invalid_result)}}]})

    client = OpenRouterClient(api_key="test", transport=httpx.MockTransport(handler))
    with pytest.raises(AIServiceError, match="invalid structured response"):
        asyncio.run(client.answer(default_board(), [ChatMessage(role="user", content="Break the board.")]))


def test_openrouter_connection_check_reserves_reasoning_tokens():
    recorded_payload: dict[str, object] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal recorded_payload
        recorded_payload = json.loads(request.content)
        return httpx.Response(200, json={"choices": [{"message": {"content": "4"}}]})

    client = OpenRouterClient(api_key="test", transport=httpx.MockTransport(handler))
    assert asyncio.run(client.check_connection()) == "4"
    assert recorded_payload["max_tokens"] == 256
