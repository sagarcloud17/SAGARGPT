"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { ArrowUp, Loader2 } from "lucide-react";

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
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
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

  return (
    <div className="shrink-0 bg-gradient-to-t from-zinc-50 via-zinc-50 to-transparent px-3 pb-3 pt-2 dark:from-zinc-950 dark:via-zinc-950 sm:px-4 sm:pb-4">
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl">
        <div className="flex items-end gap-2 rounded-[28px] border border-zinc-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:px-4 sm:py-2.5">
          <textarea
            ref={ref}
            rows={1}
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            enterKeyHint="send"
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            className="max-h-[140px] min-h-[40px] flex-1 resize-none bg-transparent py-2 text-[16px] leading-6 text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-60 dark:text-zinc-100 sm:text-[15px]"
          />
          <button
            type="submit"
            disabled={disabled || !value.trim()}
            className="mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition enabled:hover:bg-emerald-500 enabled:active:scale-95 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
            aria-label="Send message"
          >
            {disabled ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
