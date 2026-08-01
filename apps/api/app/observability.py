"""LangSmith tracing bootstrap for Ask Profile."""

from __future__ import annotations

import logging
import os

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)


def configure_langsmith(settings: Settings | None = None) -> bool:
    """Wire LangSmith env vars so LangChain auto-traces LLM/retriever calls.

    Returns True when tracing is enabled.
    """
    settings = settings or get_settings()
    api_key = (settings.langsmith_api_key or "").strip()
    enabled = bool(settings.langsmith_tracing and api_key)

    # Prefer modern LANGSMITH_* vars; also set legacy LANGCHAIN_* for compatibility.
    os.environ["LANGSMITH_TRACING"] = "true" if enabled else "false"
    os.environ["LANGCHAIN_TRACING_V2"] = "true" if enabled else "false"

    if api_key:
        os.environ["LANGSMITH_API_KEY"] = api_key
        os.environ["LANGCHAIN_API_KEY"] = api_key

    project = (settings.langsmith_project or "ask-bantu").strip()
    os.environ["LANGSMITH_PROJECT"] = project
    os.environ["LANGCHAIN_PROJECT"] = project

    endpoint = (settings.langsmith_endpoint or "").strip()
    if endpoint:
        os.environ["LANGSMITH_ENDPOINT"] = endpoint
        os.environ["LANGCHAIN_ENDPOINT"] = endpoint

    if enabled:
        logger.info("LangSmith tracing enabled — project=%s", project)
    else:
        logger.info(
            "LangSmith tracing disabled (set LANGSMITH_TRACING=true and LANGSMITH_API_KEY)"
        )
    return enabled
