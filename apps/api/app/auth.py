"""Bearer API-key authentication for protected routes."""

from __future__ import annotations

import hmac
import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings

logger = logging.getLogger("ask_profile.auth")

_bearer = HTTPBearer(auto_error=False)


async def require_api_key(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> None:
    """Require `Authorization: Bearer <API_SECRET>` on protected endpoints."""
    settings = get_settings()
    expected = (settings.api_secret or "").strip()

    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="API authentication is not configured (API_SECRET missing)",
        )

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header. Expected: Bearer <API_SECRET>",
            headers={"WWW-Authenticate": "Bearer"},
        )

    provided = credentials.credentials.strip()
    if not hmac.compare_digest(provided, expected):
        logger.warning("Rejected request with invalid API key")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "Bearer"},
        )
