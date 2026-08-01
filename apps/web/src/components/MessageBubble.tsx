"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Check, Copy, RefreshCw, User } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

interface MessageBubbleProps {
  message: ChatMessage;
  onRegenerate?: () => void;
  showRegenerate?: boolean;
}

const STATUS_STEPS = ["Thinking…", "Searching…", "Answering…"] as const;

function ThinkingStatus() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % STATUS_STEPS.length);
    }, 1400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <p
      className="animate-pulse text-sm font-medium text-zinc-400 dark:text-zinc-500"
      aria-live="polite"
      aria-label={STATUS_STEPS[step]}
    >
      {STATUS_STEPS[step]}
    </p>
  );
}

export function MessageBubble({
  message,
  onRegenerate,
  showRegenerate,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const showCursor = Boolean(message.streaming && message.content);
  const showStatus = Boolean(message.streaming && !message.content);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className={`flex w-full gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600/15 text-emerald-700 dark:text-emerald-400"
          aria-label="Assistant"
        >
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div className="max-w-[min(100%,42rem)]">
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-900/10"
              : "border border-zinc-200/80 bg-white/80 text-zinc-800 shadow-sm shadow-zinc-900/5 dark:border-zinc-700/80 dark:bg-zinc-900/70 dark:text-zinc-100 dark:shadow-black/20"
          }`}
        >
          {showStatus && <ThinkingStatus />}
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            message.content && (
              <div className="ask-md">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
                {showCursor && (
                  <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-emerald-500 align-middle" />
                )}
              </div>
            )
          )}
        </div>

        {!isUser && !message.streaming && message.content && (
          <div className="mt-2 flex items-center gap-1">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
            {showRegenerate && onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          aria-label="You"
        >
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
