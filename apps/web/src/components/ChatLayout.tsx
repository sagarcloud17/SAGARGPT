"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { ChatContainer } from "@/components/ChatContainer";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatInput } from "@/components/ChatInput";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { streamChat } from "@/lib/api";
import {
  createMessageId,
  loadConversations,
  makeEmptyConversation,
  saveActiveId,
  saveConversations,
  titleFromMessage,
} from "@/lib/storage";
import type { ChatMessage, Conversation } from "@/lib/types";
import { useIsDesktop } from "@/lib/useMediaQuery";

export function ChatLayout() {
  const isDesktop = useIsDesktop();
  const [hydrated, setHydrated] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  const sidebarUserToggled = useRef(false);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    const stored = loadConversations();
    const previous = (Array.isArray(stored) ? stored : []).filter(
      (c) => Array.isArray(c.messages) && c.messages.length > 0,
    );
    // Always open on a fresh home chat when the page loads / link is reopened.
    // Past conversations remain available in the sidebar.
    const home = makeEmptyConversation();
    const list = [home, ...previous];

    setConversations(list);
    setActiveId(home.id);
    saveConversations(list);
    saveActiveId(home.id);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!sidebarUserToggled.current) {
      setSidebarOpen(isDesktop);
    } else if (isDesktop) {
      setSidebarOpen(true);
      sidebarUserToggled.current = false;
    } else {
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

  const updateConversation = useCallback(
    (convId: string, updater: (conv: Conversation) => Conversation) => {
      setConversations((prev) => {
        const safe = Array.isArray(prev) ? prev : [];
        return safe.map((c) => (c.id === convId ? updater(c) : c));
      });
    },
    [],
  );

  const ensureActiveConversation = useCallback((): string => {
    if (activeId) return activeId;
    const created = makeEmptyConversation();
    setConversations((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
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

      const updatedConv: Conversation = {
        ...snapshot,
        id: convId,
        title:
          snapshot.title === "New chat" || !snapshot.title
            ? titleFromMessage(trimmed)
            : snapshot.title,
        messages: [...prior, userMsg, assistantMsg],
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
    // On mobile, close the drawer so the clean empty chat is visible
    if (!isDesktop) {
      sidebarUserToggled.current = true;
      setSidebarOpen(false);
    }
  };

  const onDelete = (id: string) => {
    setConversations((prev) => {
      const safe = (Array.isArray(prev) ? prev : []).filter((c) => c.id !== id);
      if (safe.length === 0) {
        const fresh = makeEmptyConversation();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(safe[0]!.id);
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
      <div className="flex h-svh items-center justify-center bg-bg text-sm text-text-muted">
        Loading Ask Bantu…
      </div>
    );
  }

  return (
    <div className="relative flex h-svh max-h-svh overflow-hidden text-text">
      <div className="pointer-events-none absolute inset-0 -z-10 app-atmosphere" />

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
        <ChatHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => {
            sidebarUserToggled.current = true;
            setSidebarOpen((v) => !v);
          }}
        />

        {error && (
          <div className="mx-3 mt-2 flex shrink-0 items-start gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-sm text-red-300 sm:mx-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="min-w-0 flex-1 break-words">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-red-500/10"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <ChatContainer
          messages={active?.messages ?? []}
          busy={busy}
          onSelectPrompt={(p) => void sendMessage(p)}
          onRegenerate={onRegenerate}
        />

        <ChatInput
          value={draft}
          onChange={setDraft}
          onSubmit={() => void sendMessage(draft)}
          disabled={busy}
        />
      </div>
    </div>
  );
}
