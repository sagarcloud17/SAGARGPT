"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { EmptyState } from "@/components/EmptyState";
import type { ChatMessage as ChatMessageType } from "@/lib/types";

interface ChatContainerProps {
  messages: ChatMessageType[];
  busy: boolean;
  onSelectPrompt: (prompt: string) => void;
  onRegenerate: () => void;
}

export function ChatContainer({
  messages,
  busy,
  onSelectPrompt,
  onRegenerate,
}: ChatContainerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const empty = messages.length === 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain chat-scroll">
      <div className="mx-auto flex min-h-full w-full max-w-[900px] flex-col px-4 py-5 sm:px-6 sm:py-8">
        {empty ? (
          <EmptyState onSelectPrompt={onSelectPrompt} disabled={busy} />
        ) : (
          <div className="flex flex-col gap-6 pb-4 sm:gap-8">
            {messages.map((m, idx) => (
              <ChatMessage
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
            ))}
            <div ref={bottomRef} className="h-px" />
          </div>
        )}
      </div>
    </main>
  );
}
