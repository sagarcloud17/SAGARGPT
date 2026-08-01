"""PDF extraction and chunking utilities for résumé ingestion."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

CHUNK_SIZE = 900
CHUNK_OVERLAP = 120


def extract_pages(pdf_path: Path) -> list[tuple[int, str]]:
    """Extract text page-by-page. Prefer pdfplumber; fall back to pypdf."""
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        raise FileNotFoundError(f"Résumé PDF not found: {pdf_path}")

    pages = _extract_with_pdfplumber(pdf_path)
    if not pages or all(not text.strip() for _, text in pages):
        logger.warning("pdfplumber returned empty text; falling back to pypdf")
        pages = _extract_with_pypdf(pdf_path)

    if not pages or all(not text.strip() for _, text in pages):
        raise ValueError(f"No extractable text in PDF: {pdf_path}")

    return [(num, text.strip()) for num, text in pages if text.strip()]


def _extract_with_pdfplumber(pdf_path: Path) -> list[tuple[int, str]]:
    try:
        import pdfplumber
    except ImportError:
        return []

    pages: list[tuple[int, str]] = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            pages.append((i, text))
    return pages


def _extract_with_pypdf(pdf_path: Path) -> list[tuple[int, str]]:
    from pypdf import PdfReader

    reader = PdfReader(str(pdf_path))
    pages: list[tuple[int, str]] = []
    for i, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        pages.append((i, text))
    return pages


def pages_to_documents(
    pages: list[tuple[int, str]],
    source_name: str = "resume.pdf",
) -> list[Document]:
    docs: list[Document] = []
    for page_num, text in pages:
        docs.append(
            Document(
                page_content=text,
                metadata={
                    "source": source_name,
                    "page": page_num,
                },
            )
        )
    return docs


def split_documents(documents: list[Document]) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(documents)
    # Ensure page metadata survives splitting
    for i, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = i
        chunk.metadata.setdefault("source", "resume.pdf")
    return chunks


def load_and_chunk_resume(pdf_path: Path, source_name: str = "resume.pdf") -> list[Document]:
    pages = extract_pages(pdf_path)
    docs = pages_to_documents(pages, source_name=source_name)
    chunks = split_documents(docs)
    logger.info("Loaded %s pages → %s chunks from %s", len(pages), len(chunks), pdf_path)
    return chunks


def chunk_stats(chunks: list[Document]) -> dict[str, Any]:
    return {
        "chunk_count": len(chunks),
        "avg_chars": round(sum(len(c.page_content) for c in chunks) / max(len(chunks), 1)),
        "pages": sorted({c.metadata.get("page") for c in chunks if c.metadata.get("page")}),
    }
