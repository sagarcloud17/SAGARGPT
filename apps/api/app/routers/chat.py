"""Streaming chat endpoint (SSE)."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.rate_limit import limiter
from app.rag.service import get_rag_service

router = APIRouter(tags=["chat"])


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatStreamRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=8000)
    history: list[ChatMessage] = Field(default_factory=list)


@router.post("/chat/stream")
@limiter.limit("20/minute")
async def chat_stream(request: Request, body: ChatStreamRequest) -> StreamingResponse:
    rag = get_rag_service()
    history = [{"role": m.role, "content": m.content} for m in body.history]

    def event_generator():
        yield from rag.stream_chat(body.message.strip(), history)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
