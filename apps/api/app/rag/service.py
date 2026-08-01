"""RAG retrieval and SSE streaming chat service (Pinecone + OpenAI)."""

from __future__ import annotations

import json
import logging
from typing import Any, AsyncIterator, Iterator

from langchain_core.documents import Document
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langsmith import traceable
from pinecone import Pinecone

from app.config import Settings, get_settings
from app.rag.prompts import build_rag_user_prompt, build_system_prompt

logger = logging.getLogger(__name__)

TOP_K = 5


class RAGService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._embeddings: OpenAIEmbeddings | None = None
        self._vectorstore: PineconeVectorStore | None = None
        self._llm: ChatOpenAI | None = None
        self._index_ready: bool | None = None

    @property
    def embeddings(self) -> OpenAIEmbeddings:
        if self._embeddings is None:
            if not self.settings.openai_api_key:
                raise RuntimeError("OPENAI_API_KEY is not set")
            self._embeddings = OpenAIEmbeddings(
                model=self.settings.openai_embedding_model,
                api_key=self.settings.openai_api_key,
            )
        return self._embeddings

    @property
    def llm(self) -> ChatOpenAI:
        if self._llm is None:
            if not self.settings.openai_api_key:
                raise RuntimeError("OPENAI_API_KEY is not set")
            self._llm = ChatOpenAI(
                model=self.settings.openai_chat_model,
                api_key=self.settings.openai_api_key,
                temperature=0.2,
                streaming=True,
                tags=["ask-profile", "chat"],
                metadata={
                    "candidate": self.settings.candidate_name,
                    "service": "ask-profile",
                },
            )
        return self._llm

    def get_vectorstore(self) -> PineconeVectorStore:
        if self._vectorstore is None:
            if not self.settings.pinecone_api_key:
                raise RuntimeError("PINECONE_API_KEY is not set")
            Pinecone(api_key=self.settings.pinecone_api_key)
            self._vectorstore = PineconeVectorStore(
                index_name=self.settings.pinecone_index_name,
                embedding=self.embeddings,
                namespace=self.settings.pinecone_namespace,
                pinecone_api_key=self.settings.pinecone_api_key,
            )
        return self._vectorstore

    def is_knowledge_base_ready(self) -> bool:
        if not self.settings.knowledge_base_configured:
            return False
        if self._index_ready is not None:
            return self._index_ready
        try:
            pc = Pinecone(api_key=self.settings.pinecone_api_key)
            names = {idx.name for idx in pc.list_indexes()}
            if self.settings.pinecone_index_name not in names:
                self._index_ready = False
                return False
            index = pc.Index(self.settings.pinecone_index_name)
            stats = index.describe_index_stats()
            namespaces = stats.get("namespaces") or {}
            ns = namespaces.get(self.settings.pinecone_namespace) or {}
            count = int(ns.get("vector_count") or stats.get("total_vector_count") or 0)
            self._index_ready = count > 0
            return self._index_ready
        except Exception as exc:  # noqa: BLE001
            logger.warning("Knowledge base readiness check failed: %s", exc)
            self._index_ready = False
            return False

    def invalidate_ready_cache(self) -> None:
        self._index_ready = None

    @traceable(
        name="retrieve_resume_chunks",
        run_type="retriever",
        tags=["ask-profile", "rag"],
    )
    def retrieve(self, query: str, k: int = TOP_K) -> list[Document]:
        store = self.get_vectorstore()
        return store.similarity_search(query, k=k)

    @staticmethod
    def format_context(docs: list[Document]) -> str:
        blocks: list[str] = []
        for i, doc in enumerate(docs, start=1):
            source = doc.metadata.get("source", "resume.pdf")
            page = doc.metadata.get("page", "?")
            blocks.append(f"[{i}] Source: {source}, p.{page}\n{doc.page_content}")
        return "\n\n".join(blocks) if blocks else "(No résumé context retrieved.)"

    @staticmethod
    def citations_from_docs(docs: list[Document]) -> list[dict[str, Any]]:
        seen: set[tuple[Any, Any]] = set()
        citations: list[dict[str, Any]] = []
        for doc in docs:
            source = doc.metadata.get("source", "resume.pdf")
            page = doc.metadata.get("page")
            key = (source, page)
            if key in seen:
                continue
            seen.add(key)
            citations.append(
                {
                    "source": source,
                    "page": page,
                    "label": f"Source: {source}, p.{page}",
                }
            )
        return citations

    @traceable(
        name="ask_profile_rag_chat",
        run_type="chain",
        tags=["ask-profile", "rag", "chat"],
    )
    def stream_chat(
        self,
        message: str,
        history: list[dict[str, str]] | None = None,
    ) -> Iterator[str]:
        """Yield SSE `data: {json}\\n\\n` lines. Traced as a LangSmith chain run."""
        history = history or []
        try:
            docs = self.retrieve(message)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Retrieval failed")
            yield _sse({"type": "error", "message": f"Retrieval failed: {exc}"})
            yield _sse({"type": "done"})
            return

        citations = self.citations_from_docs(docs)
        yield _sse({"type": "citations", "citations": citations})

        context = self.format_context(docs)
        system = build_system_prompt(self.settings.candidate_name)
        user_prompt = build_rag_user_prompt(message, context)

        messages: list[Any] = [SystemMessage(content=system)]
        for turn in history[-8:]:
            role = (turn.get("role") or "").lower()
            content = turn.get("content") or ""
            if not content:
                continue
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))
        messages.append(HumanMessage(content=user_prompt))

        try:
            for chunk in self.llm.stream(messages):
                token = chunk.content
                if not token:
                    continue
                if isinstance(token, list):
                    token = "".join(
                        part.get("text", "") if isinstance(part, dict) else str(part)
                        for part in token
                    )
                yield _sse({"type": "token", "content": str(token)})
        except Exception as exc:  # noqa: BLE001
            logger.exception("LLM stream failed")
            yield _sse({"type": "error", "message": f"Generation failed: {exc}"})

        yield _sse({"type": "done"})

    async def astream_chat(
        self,
        message: str,
        history: list[dict[str, str]] | None = None,
    ) -> AsyncIterator[str]:
        for event in self.stream_chat(message, history):
            yield event


_rag_service: RAGService | None = None


def get_rag_service() -> RAGService:
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service


def _sse(payload: dict[str, Any]) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
