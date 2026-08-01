#!/usr/bin/env python3
"""Ingest résumé PDF into Pinecone for Ask Profile RAG.

Usage (from repo root, with venv active):
  python scripts/ingest.py
  python scripts/ingest.py --pdf data/resume.pdf --reset
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[1]
API_ROOT = REPO_ROOT / "apps" / "api"

# Ensure API package is importable
sys.path.insert(0, str(API_ROOT))

load_dotenv(REPO_ROOT / ".env", override=True)
load_dotenv(API_ROOT / ".env", override=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("ingest")


def ensure_pinecone_index(settings, dimension: int = 1536) -> None:
    from pinecone import Pinecone, ServerlessSpec

    pc = Pinecone(api_key=settings.pinecone_api_key)
    existing = {idx.name for idx in pc.list_indexes()}
    if settings.pinecone_index_name in existing:
        logger.info("Pinecone index already exists: %s", settings.pinecone_index_name)
        return

    logger.info(
        "Creating Pinecone index %s (dim=%s, cosine, serverless aws/us-east-1)",
        settings.pinecone_index_name,
        dimension,
    )
    pc.create_index(
        name=settings.pinecone_index_name,
        dimension=dimension,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )
    logger.info("Index created.")


def reset_namespace(settings) -> None:
    from pinecone import Pinecone

    pc = Pinecone(api_key=settings.pinecone_api_key)
    index = pc.Index(settings.pinecone_index_name)
    logger.info("Deleting vectors in namespace=%s", settings.pinecone_namespace)
    try:
        index.delete(delete_all=True, namespace=settings.pinecone_namespace)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Namespace reset skipped/failed: %s", exc)


def main() -> int:
    parser = argparse.ArgumentParser(description="Ingest résumé into Pinecone")
    parser.add_argument(
        "--pdf",
        type=Path,
        default=REPO_ROOT / "data" / "resume.pdf",
        help="Path to résumé PDF",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete existing vectors in the namespace before upsert",
    )
    args = parser.parse_args()

    from langchain_openai import OpenAIEmbeddings
    from langchain_pinecone import PineconeVectorStore

    from app.config import get_settings
    from app.observability import configure_langsmith
    from app.rag.ingest_utils import chunk_stats, load_and_chunk_resume

    settings = get_settings()
    configure_langsmith(settings)
    if not settings.openai_api_key:
        logger.error("OPENAI_API_KEY is required")
        return 1
    if not settings.pinecone_api_key:
        logger.error("PINECONE_API_KEY is required")
        return 1

    pdf_path = args.pdf if args.pdf.is_absolute() else REPO_ROOT / args.pdf
    if not pdf_path.exists():
        logger.error("PDF not found: %s", pdf_path)
        return 1

    chunks = load_and_chunk_resume(pdf_path, source_name="resume.pdf")
    stats = chunk_stats(chunks)
    logger.info("Chunk stats: %s", stats)

    ensure_pinecone_index(settings, dimension=1536)
    if args.reset:
        reset_namespace(settings)

    embeddings = OpenAIEmbeddings(
        model=settings.openai_embedding_model,
        api_key=settings.openai_api_key,
    )

    logger.info(
        "Upserting %s chunks → index=%s namespace=%s",
        len(chunks),
        settings.pinecone_index_name,
        settings.pinecone_namespace,
    )
    PineconeVectorStore.from_documents(
        documents=chunks,
        embedding=embeddings,
        index_name=settings.pinecone_index_name,
        namespace=settings.pinecone_namespace,
        pinecone_api_key=settings.pinecone_api_key,
    )
    logger.info("Ingestion complete. Run the API and open the web app.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
