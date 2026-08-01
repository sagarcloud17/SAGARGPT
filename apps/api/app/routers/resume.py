"""Résumé download / inline view endpoint."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.config import get_settings

router = APIRouter(tags=["resume"])


@router.get("/resume/download")
def download_resume() -> FileResponse:
    settings = get_settings()
    path = settings.resume_path
    if not path.exists():
        raise HTTPException(status_code=404, detail="Résumé PDF not found")
    return FileResponse(
        path=str(path),
        media_type="application/pdf",
        filename="resume.pdf",
        content_disposition_type="inline",
    )
