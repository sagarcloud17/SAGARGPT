"""Ask Profile FastAPI application entrypoint."""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import get_settings
from app.observability import configure_langsmith
from app.rate_limit import limiter
from app.routers import chat, health, resume

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("ask_profile")

settings = get_settings()
configure_langsmith(settings)

app = FastAPI(
    title="Ask Profile API",
    description="RAG-powered personal AI assistant grounded in a candidate résumé.",
    version="0.1.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(chat.router)
app.include_router(resume.router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


@app.on_event("startup")
async def on_startup() -> None:
    logger.info(
        "Ask Profile API starting — candidate=%s cors=%s langsmith=%s",
        settings.candidate_name,
        settings.cors_origin_list,
        settings.langsmith_enabled,
    )
    if not settings.openai_api_key:
        logger.warning("OPENAI_API_KEY is missing")
    if not settings.pinecone_api_key:
        logger.warning("PINECONE_API_KEY is missing")
    if settings.langsmith_tracing and not settings.langsmith_api_key:
        logger.warning("LANGSMITH_TRACING is on but LANGSMITH_API_KEY is missing")
