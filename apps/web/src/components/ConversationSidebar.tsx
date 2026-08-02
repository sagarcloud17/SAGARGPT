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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          aria-label="Close sidebar overlay"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`z-50 flex w-[min(100vw-3rem,280px)] shrink-0 flex-col border-r border-border bg-surface transition-[transform,width,opacity] duration-300 ease-out ${
          isDesktop
            ? `static h-full ${open ? "translate-x-0" : "w-0 overflow-hidden border-0 opacity-0"}`
            : `fixed inset-y-0 left-0 h-svh ${
                open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
              }`
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
            Chats
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onNew}
              className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-2.5 text-xs font-medium text-white transition hover:bg-accent-dim"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              New
            </button>
            {!isDesktop && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-white/5 hover:text-text"
                aria-label="Close chats"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-0.5 overflow-y-auto p-2 chat-scroll">
          {conversations.length === 0 && (
            <p className="px-2 py-8 text-center text-xs text-text-muted">
              No conversations yet
            </p>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-1 rounded-xl px-1.5 py-0.5 transition ${
                c.id === activeId
                  ? "bg-accent/10 text-accent"
                  : "text-text-secondary hover:bg-white/5 hover:text-text"
              }`}
            >
              <button
                type="button"
                className="min-h-11 min-w-0 flex-1 truncate px-1.5 py-2 text-left text-sm"
                onClick={() => {
                  onSelect(c.id);
                  if (!isDesktop) onCloseMobile?.();
                }}
              >
                {c.title}
              </button>
              <button
                type="button"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted opacity-100 transition hover:bg-white/5 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100"
                aria-label="Delete conversation"
                onClick={() => onDelete(c.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <p className="border-t border-border px-3 py-3 text-[11px] text-text-muted">
          History stays in this browser only.
        </p>
      </aside>
    </>
  );
}
