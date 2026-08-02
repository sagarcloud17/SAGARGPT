"""Application configuration loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Prefer repo-root .env, then apps/api/.env. override=True avoids stale shell vars.
_API_ROOT = Path(__file__).resolve().parents[1]
_REPO_ROOT = Path(__file__).resolve().parents[3]


def _resolve_resume_path() -> Path:
    """Find resume.pdf across local monorepo and FastAPI Cloud app-dir layouts."""
    candidates = [
        _REPO_ROOT / "data" / "resume.pdf",
        _API_ROOT / "data" / "resume.pdf",
        Path.cwd() / "data" / "resume.pdf",
        Path.cwd() / "resume.pdf",
    ]
    for path in candidates:
        if path.is_file():
            return path
    return candidates[0]


load_dotenv(_REPO_ROOT / ".env", override=True)
load_dotenv(_API_ROOT / ".env", override=True)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_REPO_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    openai_api_key: str = ""
    pinecone_api_key: str = ""
    pinecone_index_name: str = "ask-profile"
    pinecone_namespace: str = "resume"

    openai_embedding_model: str = "text-embedding-3-small"
    openai_chat_model: str = "gpt-4o-mini"

    candidate_name: str = "Bantu Sagar Kumar"
    candidate_short_name: str = "Bantu"
    linkedin_url: str = "https://www.linkedin.com/in/your-profile"

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    # Shared secret for Authorization: Bearer <API_SECRET>
    api_secret: str = ""

    rate_limit_chat: str = "20/minute"
    rate_limit_default: str = "30/minute"

    # LangSmith
    langsmith_tracing: bool = False
    langsmith_api_key: str = ""
    langsmith_project: str = "ask-bantu"
    langsmith_endpoint: str = "https://api.smith.langchain.com"

    # Paths
    resume_path: Path = _resolve_resume_path()

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def knowledge_base_configured(self) -> bool:
        return bool(self.openai_api_key and self.pinecone_api_key)

    @property
    def langsmith_enabled(self) -> bool:
        return bool(self.langsmith_tracing and self.langsmith_api_key.strip())


@lru_cache
def get_settings() -> Settings:
    return Settings()
