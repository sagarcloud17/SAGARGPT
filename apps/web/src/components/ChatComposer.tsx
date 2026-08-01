"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Loader2, SendHorizontal } from "lucide-react";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = "Ask about Sagar…",
}: ChatComposerProps) {
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
    // Desktop: Enter sends. Mobile keyboards often use Enter for newline;
    // still allow Enter-to-send, Shift+Enter always newline.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 border-t border-zinc-200/70 bg-white/80 px-3 pt-3 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80 sm:px-4 sm:pt-4"
      style={{
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-zinc-200/80 bg-white p-2 shadow-sm shadow-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/20">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          enterKeyHint="send"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="max-h-40 min-h-[48px] flex-1 resize-none bg-transparent px-2 py-3 text-base leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-60 dark:text-zinc-100 sm:min-h-[44px] sm:py-2.5 sm:text-sm"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:h-11 sm:w-11"
          aria-label="Send message"
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizontal className="h-4 w-4" />
          )}
        </button>
      </div>
      <p className="mx-auto mt-2 hidden max-w-3xl text-center text-[11px] text-zinc-500 sm:block">
        Enter to send · Shift+Enter for a new line
      </p>
    </form>
  );
}
