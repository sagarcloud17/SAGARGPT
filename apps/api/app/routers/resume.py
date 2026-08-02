"""Resume download / inline view endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from app.auth import require_api_key
from app.config import get_settings

router = APIRouter(tags=["resume"], dependencies=[Depends(require_api_key)])


@router.get("/resume/download")
def download_resume() -> FileResponse:
    settings = get_settings()
    path = settings.resume_path
    if not path.exists():
        raise HTTPException(status_code=404, detail="Resume PDF not found")
    return FileResponse(
        path=str(path),
        media_type="application/pdf",
        filename="resume.pdf",
        content_disposition_type="inline",
    )
