from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator


class Card(BaseModel):
    id: str = Field(min_length=1)
    title: str = Field(min_length=1, max_length=200)
    details: str = Field(max_length=2_000)


class Column(BaseModel):
    id: str = Field(min_length=1)
    title: str = Field(min_length=1, max_length=80)
    cardIds: list[str]


class Board(BaseModel):
    columns: list[Column] = Field(min_length=5, max_length=5)
    cards: dict[str, Card]

    @model_validator(mode="after")
    def validate_card_ownership(self) -> "Board":
        column_ids = [column.id for column in self.columns]
        if len(set(column_ids)) != len(column_ids):
            raise ValueError("Column IDs must be unique.")

        if any(card_id != card.id for card_id, card in self.cards.items()):
            raise ValueError("Card keys must match card IDs.")

        card_ids = [card_id for column in self.columns for card_id in column.cardIds]
        if len(set(card_ids)) != len(card_ids):
            raise ValueError("A card can belong to only one column.")
        if set(card_ids) != set(self.cards):
            raise ValueError("Each card must belong to one column.")
        return self


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=200)


class UserResponse(BaseModel):
    username: str


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4_000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=20)


class AssistantResult(BaseModel):
    reply: str = Field(min_length=1, max_length=4_000)
    board: Board | None = None


class ChatResponse(AssistantResult):
    pass
