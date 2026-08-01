"""Health check endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Request

from app.rag.service import get_rag_service

router = APIRouter(tags=["health"])


@router.get("/health")
def health(request: Request) -> dict:
    rag = get_rag_service()
    ready = False
    try:
        ready = rag.is_knowledge_base_ready()
    except Exception:  # noqa: BLE001
        ready = False
    return {
        "status": "ok",
        "knowledge_base_ready": ready,
        "candidate": rag.settings.candidate_name,
        "langsmith_enabled": rag.settings.langsmith_enabled,
    }
