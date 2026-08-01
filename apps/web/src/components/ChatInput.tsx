"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { motion } from "framer-motion";
import { ArrowUp, Loader2 } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: ChatInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (disabled || !value.trim()) return;
    onSubmit();
    requestAnimationFrame(() => {
      if (ref.current) {
        ref.current.style.height = "auto";
        ref.current.focus();
      }
    });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = Boolean(value.trim()) && !disabled;

  return (
    <div className="shrink-0 bg-gradient-to-t from-bg via-bg to-transparent px-3 pb-3 pt-2 sm:px-4 sm:pb-5">
      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-[900px]"
      >
        <div className="flex items-end gap-2 rounded-[28px] border border-border bg-surface px-3 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:px-4 sm:py-2.5">
          <textarea
            ref={ref}
            rows={1}
            value={value}
            disabled={disabled}
            placeholder="Ask about Bantu’s experience…"
            enterKeyHint="send"
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            className="max-h-[160px] min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-[16px] leading-6 text-text outline-none placeholder:text-text-muted disabled:opacity-60 sm:text-[15px]"
            aria-label="Message input"
          />
          <motion.button
            type="submit"
            disabled={!canSend}
            whileTap={canSend ? { scale: 0.92 } : undefined}
            className="focus-ring mb-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white transition enabled:hover:bg-accent-dim disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-text-muted"
            aria-label="Send message"
          >
            {disabled ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
            )}
          </motion.button>
        </div>
        <p className="mt-2 hidden text-center text-[11px] text-text-muted sm:block">
          Enter to send · Shift+Enter for a new line · Grounded in verified résumé data
        </p>
      </form>
    </div>
  );
}
