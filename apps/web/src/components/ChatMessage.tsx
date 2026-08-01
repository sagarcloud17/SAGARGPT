"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, RefreshCw } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { TypingIndicator } from "@/components/TypingIndicator";
import type { ChatMessage as ChatMessageType } from "@/lib/types";

interface ChatMessageProps {
  message: ChatMessageType;
  onRegenerate?: () => void;
  showRegenerate?: boolean;
}

export function ChatMessage({
  message,
  onRegenerate,
  showRegenerate,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const showCursor = Boolean(message.streaming && message.content);
  const showTyping = Boolean(message.streaming && !message.content);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex w-full justify-end"
      >
        <div className="max-w-[min(85%,560px)] rounded-[22px] bg-accent px-4 py-3 text-[15px] leading-relaxed text-white shadow-[0_8px_24px_rgba(16,185,129,0.18)] sm:text-base">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="flex w-full flex-col gap-3"
    >
      <div className="w-full rounded-2xl bg-card/60 px-1 py-1 sm:px-2">
        {showTyping && <TypingIndicator />}
        {message.content && (
          <div className="relative">
            <MarkdownRenderer content={message.content} />
            {showCursor && (
              <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-accent align-middle" />
            )}
          </div>
        )}
      </div>

      {!message.streaming && message.content && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copy}
            className="focus-ring inline-flex h-11 min-w-11 items-center gap-1.5 rounded-xl px-3 text-sm text-text-muted transition hover:bg-white/5 hover:text-text"
            aria-label="Copy message"
          >
            {copied ? (
              <Check className="h-4 w-4 text-accent" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </button>
          {showRegenerate && onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              className="focus-ring inline-flex h-11 min-w-11 items-center gap-1.5 rounded-xl px-3 text-sm text-text-muted transition hover:bg-white/5 hover:text-text"
              aria-label="Regenerate response"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Regenerate</span>
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
