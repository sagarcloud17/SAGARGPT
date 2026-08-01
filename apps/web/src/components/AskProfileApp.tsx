"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Sparkles, X } from "lucide-react";
import { ChatComposer } from "@/components/ChatComposer";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { HeaderBar } from "@/components/HeaderBar";
import { MessageBubble } from "@/components/MessageBubble";
import {
  candidateName,
  candidateShortName,
  streamChat,
} from "@/lib/api";
import {
  createMessageId,
  loadActiveId,
  loadConversations,
  makeEmptyConversation,
  saveActiveId,
  saveConversations,
  titleFromMessage,
} from "@/lib/storage";
import type { ChatMessage, Conversation } from "@/lib/types";
import { useIsDesktop } from "@/lib/useMediaQuery";

const SUGGESTED_PROMPTS = [
  "Walk me through Sagar's most relevant AI / ML experience.",
  "What tech stack is Sagar strongest in?",
  "Summarize a project of his that shows production impact.",
  "How does Sagar approach RAG systems end-to-end?",
  "What roles is Sagar targeting right now?",
  "Which of Sagar's achievements is he most proud of?",
];

export function AskProfileApp() {
  const isDesktop = useIsDesktop();
  const [hydrated, setHydrated] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  const sidebarUserToggled = useRef(false);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    const stored = loadConversations();
    let list = Array.isArray(stored) ? stored : [];
    let id = loadActiveId();

    if (list.length === 0) {
      const first = makeEmptyConversation();
      list = [first];
      id = first.id;
    } else if (!id || !list.some((c) => c.id === id)) {
      id = list[0]!.id;
    }

    setConversations(list);
    setActiveId(id!);
    saveConversations(list);
    saveActiveId(id!);
    setHydrated(true);
  }, []);

  // Keep sidebar behavior solid across resize / rotate
  useEffect(() => {
    if (!hydrated) return;
    if (!sidebarUserToggled.current) {
      setSidebarOpen(isDesktop);
    } else if (isDesktop) {
      // Crossing into desktop: show sidebar by default again
      setSidebarOpen(true);
      sidebarUserToggled.current = false;
    } else {
      // Crossing into mobile: close overlay drawer
      setSidebarOpen(false);
      sidebarUserToggled.current = false;
    }
  }, [hydrated, isDesktop]);

  useEffect(() => {
    if (!hydrated) return;
    saveConversations(conversations);
  }, [conversations, hydrated]);
  useEffect(() => {
    if (!hydrated || !activeId) return;
    saveActiveId(activeId);
  }, [activeId, hydrated]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages, busy]);

  const updateConversation = useCallback(
    (convId: string, updater: (conv: Conversation) => Conversation) => {
      setConversations((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return safePrev.map((c) => (c.id === convId ? updater(c) : c));
      });
    },
    [],
  );

  const ensureActiveConversation = useCallback((): string => {
    if (activeId) return activeId;
    const created = makeEmptyConversation();
    setConversations((prev) => {
      const safe = Array.isArray(prev) ? prev : [];
      return [created, ...safe];
    });
    setActiveId(created.id);
    saveActiveId(created.id);
    return created.id;
  }, [activeId]);

  const sendMessage = useCallback(
    async (text: string, opts?: { regenerate?: boolean }) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      setError(null);
      setBusy(true);
      setDraft("");

      const convId = ensureActiveConversation();
      const snapshot =
        conversationsRef.current.find((c) => c.id === convId) ??
        makeEmptyConversation();

      let prior = Array.isArray(snapshot.messages) ? [...snapshot.messages] : [];
      if (opts?.regenerate) {
        while (prior.length > 0 && prior[prior.length - 1]?.role === "assistant") {
          prior = prior.slice(0, -1);
        }
        if (prior.length > 0 && prior[prior.length - 1]?.role === "user") {
          prior = prior.slice(0, -1);
        }
      }

      const history = prior
        .filter((m) => (m.role === "user" || m.role === "assistant") && m.content)
        .map((m) => ({ role: m.role, content: m.content }));

      const userMsg: ChatMessage = {
        id: createMessageId(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      };
      const assistantId = createMessageId();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        citations: [],
        createdAt: Date.now(),
        streaming: true,
      };

      const nextMessages = [...prior, userMsg, assistantMsg];
      const updatedConv: Conversation = {
        ...snapshot,
        id: convId,
        title:
          snapshot.title === "New chat" || !snapshot.title
            ? titleFromMessage(trimmed)
            : snapshot.title,
        messages: nextMessages,
        updatedAt: Date.now(),
      };

      setConversations((prev) => {
        const safe = Array.isArray(prev) ? [...prev] : [];
        const idx = safe.findIndex((c) => c.id === convId);
        if (idx >= 0) safe[idx] = updatedConv;
        else safe.unshift(updatedConv);
        return safe;
      });

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamChat({
          message: trimmed,
          history,
          signal: controller.signal,
          onEvent: (event) => {
            if (event.type === "citations") {
              updateConversation(convId, (conv) => ({
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === assistantId
                    ? { ...m, citations: event.citations }
                    : m,
                ),
              }));
            } else if (event.type === "token") {
              updateConversation(convId, (conv) => ({
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + event.content }
                    : m,
                ),
              }));
            } else if (event.type === "error") {
              setError(event.message);
            }
          },
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to reach the assistant API",
          );
          updateConversation(convId, (conv) => ({
            ...conv,
            messages: conv.messages.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      m.content ||
                      "I couldn't generate a reply just now. Please try again.",
                    streaming: false,
                  }
                : m,
            ),
          }));
        }
      } finally {
        updateConversation(convId, (conv) => ({
          ...conv,
          messages: conv.messages.map((m) =>
            m.id === assistantId ? { ...m, streaming: false } : m,
          ),
          updatedAt: Date.now(),
        }));
        setBusy(false);
      }
    },
    [busy, ensureActiveConversation, updateConversation],
  );

  const onNew = () => {
    const created = makeEmptyConversation();
    setConversations((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
    setActiveId(created.id);
    setDraft("");
    setError(null);
  };

  const onDelete = (id: string) => {
    setConversations((prev) => {
      const safe = (Array.isArray(prev) ? prev : []).filter((c) => c.id !== id);
      if (safe.length === 0) {
        const fresh = makeEmptyConversation();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) {
        setActiveId(safe[0]!.id);
      }
      return safe;
    });
  };

  const onRegenerate = () => {
    const msgs = active?.messages ?? [];
    let i = msgs.length - 1;
    while (i >= 0 && msgs[i]?.role === "assistant") i -= 1;
    const lastUser = i >= 0 ? msgs[i] : null;
    if (!lastUser || lastUser.role !== "user") return;
    void sendMessage(lastUser.content, { regenerate: true });
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        Loading Ask {candidateShortName}…
      </div>
    );
  }

  const messages = active?.messages ?? [];
  const empty = messages.length === 0;

  return (
    <div className="relative flex h-dvh max-h-dvh overflow-hidden text-zinc-900 dark:text-zinc-50">
      <div className="pointer-events-none absolute inset-0 -z-10 mesh-bg" />
      <ConversationSidebar
        open={sidebarOpen}
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={onNew}
        onDelete={onDelete}
        onCloseMobile={() => {
          sidebarUserToggled.current = true;
          setSidebarOpen(false);
        }}
        isDesktop={isDesktop}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <HeaderBar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => {
            sidebarUserToggled.current = true;
            setSidebarOpen((v) => !v);
          }}
        />

        {error && (
          <div className="mx-3 mt-3 flex shrink-0 items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300 sm:mx-5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="min-w-0 flex-1 break-words">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-red-500/10"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5 sm:py-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 sm:gap-5">
            {empty ? (
              <div className="animate-fade-in py-6 text-center sm:py-14">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 sm:mb-5 sm:h-14 sm:w-14">
                  <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <h1 className="font-[family-name:var(--font-geist-sans)] text-2xl font-semibold tracking-tight sm:text-4xl">
                  Ask {candidateShortName}
                </h1>
                <p className="mx-auto mt-3 max-w-md px-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Chat with {candidateName}&apos;s personal assistant — an
                  advocate grounded in his résumé. Strong on substance, no
                  invented credentials.
                </p>
                <div className="mt-6 grid grid-cols-1 gap-2 sm:mt-8 sm:grid-cols-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      disabled={busy}
                      onClick={() => void sendMessage(prompt)}
                      className="min-h-12 rounded-xl border border-zinc-200/80 bg-white/70 px-3 py-3 text-left text-sm leading-snug text-zinc-700 transition hover:border-emerald-500/40 hover:bg-emerald-500/5 active:scale-[0.99] dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-emerald-500/40"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, idx) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  showRegenerate={
                    !busy &&
                    m.role === "assistant" &&
                    idx === messages.length - 1 &&
                    !m.streaming
                  }
                  onRegenerate={onRegenerate}
                />
              ))
            )}
            <div ref={bottomRef} className="h-2" />
          </div>
        </main>

        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSubmit={() => void sendMessage(draft)}
          disabled={busy}
        />
      </div>
    </div>
  );
}
