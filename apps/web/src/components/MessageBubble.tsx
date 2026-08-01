"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, RefreshCw } from "lucide-react";
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
      className="text-[15px] font-medium text-zinc-400 dark:text-zinc-500"
      aria-live="polite"
    >
      <span className="inline-flex gap-1">
        <span className="animate-pulse">{STATUS_STEPS[step]}</span>
      </span>
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

  if (isUser) {
    return (
      <div className="flex w-full justify-end">
        <div className="max-w-[85%] rounded-[22px] bg-emerald-600 px-4 py-2.5 text-[15px] leading-6 text-white sm:max-w-[75%]">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="w-full max-w-none text-[15px] leading-7 text-zinc-800 dark:text-zinc-100 sm:max-w-3xl">
        {showStatus && <ThinkingStatus />}
        {message.content && (
          <div className="ask-md break-words">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
            {showCursor && (
              <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-emerald-500 align-middle" />
            )}
          </div>
        )}
      </div>

      {!message.streaming && message.content && (
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
          {showRegenerate && onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </button>
          )}
        </div>
      )}
    </div>
  );
}
