"use client";

import { MessageSquarePlus, Trash2, X } from "lucide-react";
import type { Conversation } from "@/lib/types";

interface ConversationSidebarProps {
  open: boolean;
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onCloseMobile?: () => void;
  isDesktop?: boolean;
}

export function ConversationSidebar({
  open,
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onCloseMobile,
  isDesktop = false,
}: ConversationSidebarProps) {
  return (
    <>
      {open && !isDesktop && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          aria-label="Close sidebar overlay"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`z-50 flex w-[min(100vw-3rem,300px)] shrink-0 flex-col border-r border-zinc-200/70 bg-white/95 backdrop-blur-xl transition-[transform,width,opacity] duration-300 ease-out dark:border-zinc-800 dark:bg-zinc-950/95 ${
          isDesktop
            ? `static h-full ${open ? "translate-x-0" : "w-0 overflow-hidden border-0 opacity-0"}`
            : `fixed inset-y-0 left-0 h-dvh pt-[env(safe-area-inset-top)] ${
                open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
              }`
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-zinc-200/70 px-3 py-3 dark:border-zinc-800">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Chats
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onNew}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 text-xs font-medium text-white transition hover:bg-emerald-500 active:scale-[0.98]"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              New
            </button>
            {!isDesktop && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                aria-label="Close chats"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-2">
          {conversations.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-zinc-500">
              No conversations yet
            </p>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-1 rounded-xl px-2 py-1.5 transition ${
                c.id === activeId
                  ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              }`}
            >
              <button
                type="button"
                className="min-h-10 min-w-0 flex-1 truncate py-1 text-left text-sm"
                onClick={() => {
                  onSelect(c.id);
                  if (!isDesktop) onCloseMobile?.();
                }}
              >
                {c.title}
              </button>
              <button
                type="button"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-200/80 hover:text-red-500 dark:hover:bg-zinc-800 md:h-8 md:w-8 md:opacity-0 md:group-hover:opacity-100"
                aria-label="Delete conversation"
                onClick={() => onDelete(c.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <p className="border-t border-zinc-200/70 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-[11px] text-zinc-500 dark:border-zinc-800">
          History stays in this browser only.
        </p>
      </aside>
    </>
  );
}
