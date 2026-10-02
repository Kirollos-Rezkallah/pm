from __future__ import annotations

import secrets
from contextlib import asynccontextmanager
import os
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from fastapi.staticfiles import StaticFiles

from app.database import Database
from app.models import AssistantResult, Board, ChatRequest, ChatResponse, LoginRequest, UserResponse
from app.openrouter import AIServiceError, BoardAssistant, OpenRouterClient


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATABASE_PATH = Path(os.getenv("KANBAN_DATABASE_PATH", PROJECT_ROOT / "backend" / "data" / "kanban.db"))
DEFAULT_FRONTEND_DIR = PROJECT_ROOT / "frontend" / "out"
SESSION_COOKIE = "kanban_session"


class SessionStore:
    def __init__(self) -> None:
        self._sessions: dict[str, int] = {}

    def create(self, user_id: int) -> str:
        token = secrets.token_urlsafe(32)
        self._sessions[token] = user_id
        return token

    def get_user_id(self, token: str | None) -> int | None:
        return self._sessions.get(token or "")

    def revoke(self, token: str | None) -> None:
        if token:
            self._sessions.pop(token, None)


def create_app(
    database_path: Path = DEFAULT_DATABASE_PATH,
    frontend_dir: Path = DEFAULT_FRONTEND_DIR,
    assistant: BoardAssistant | None = None,
) -> FastAPI:
    @asynccontextmanager
    async def lifespan(application: FastAPI):
        application.state.database.initialize()
        yield

    app = FastAPI(title="Project Management MVP", lifespan=lifespan)
    app.state.database = Database(database_path)
    app.state.sessions = SessionStore()
    app.state.assistant = assistant or OpenRouterClient()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://127.0.0.1:3000", "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    def current_user_id(request: Request) -> int:
        user_id = app.state.sessions.get_user_id(request.cookies.get(SESSION_COOKIE))
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sign in is required.")
        return user_id

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/api/auth/login", response_model=UserResponse)
    def login(credentials: LoginRequest, response: Response) -> UserResponse:
        if credentials.username != "user" or credentials.password != "password":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password.")
        user_id = app.state.database.get_or_create_user("user")
        token = app.state.sessions.create(user_id)
        response.set_cookie(SESSION_COOKIE, token, httponly=True, samesite="lax", max_age=60 * 60 * 8)
        return UserResponse(username="user")

    @app.post("/api/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
    def logout(request: Request, response: Response) -> None:
        app.state.sessions.revoke(request.cookies.get(SESSION_COOKIE))
        response.delete_cookie(SESSION_COOKIE)
        response.status_code = status.HTTP_204_NO_CONTENT

    @app.get("/api/auth/me", response_model=UserResponse)
    def current_user(user_id: int = Depends(current_user_id)) -> UserResponse:
        del user_id
        return UserResponse(username="user")

    @app.get("/api/board", response_model=Board)
    def get_board(user_id: int = Depends(current_user_id)) -> Board:
        return app.state.database.get_board(user_id)

    @app.put("/api/board", response_model=Board)
    def update_board(board: Board, user_id: int = Depends(current_user_id)) -> Board:
        return app.state.database.save_board(user_id, board)

    @app.post("/api/chat", response_model=ChatResponse)
    async def chat(request: ChatRequest, user_id: int = Depends(current_user_id)) -> ChatResponse:
        board = app.state.database.get_board(user_id)
        try:
            result: AssistantResult = await app.state.assistant.answer(board, request.messages)
        except AIServiceError as error:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error
        if result.board is not None:
            app.state.database.save_board(user_id, result.board)
        return ChatResponse(reply=result.reply, board=result.board)

    if frontend_dir.exists():
        app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
    else:
        @app.get("/")
        def frontend_not_built() -> PlainTextResponse:
            return PlainTextResponse("Frontend build not found. Run the start script.", status_code=503)

    return app


app = create_app()
