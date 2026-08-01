"use client";

import { MessageSquarePlus, Trash2 } from "lucide-react";
import type { Conversation } from "@/lib/types";

interface ConversationSidebarProps {
  open: boolean;
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onCloseMobile?: () => void;
}

export function ConversationSidebar({
  open,
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onCloseMobile,
}: ConversationSidebarProps) {
  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
          aria-label="Close sidebar overlay"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[280px] shrink-0 flex-col border-r border-zinc-200/70 bg-white/90 backdrop-blur-xl transition-[transform,width] duration-300 dark:border-zinc-800 dark:bg-zinc-950/95 lg:static lg:z-0 lg:h-full lg:translate-x-0 ${
          open
            ? "translate-x-0"
            : "-translate-x-full lg:w-0 lg:overflow-hidden lg:border-0"
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-zinc-200/70 px-3 py-3 dark:border-zinc-800">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Chats
          </p>
          <button
            type="button"
            onClick={onNew}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 text-xs font-medium text-white transition hover:bg-emerald-500"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            New
          </button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {conversations.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-zinc-500">
              No conversations yet
            </p>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-1 rounded-xl px-2 py-2 transition ${
                c.id === activeId
                  ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              }`}
            >
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-left text-sm"
                onClick={() => {
                  onSelect(c.id);
                  // Only auto-close the drawer on mobile overlays
                  if (
                    typeof window !== "undefined" &&
                    window.matchMedia("(max-width: 1023px)").matches
                  ) {
                    onCloseMobile?.();
                  }
                }}
              >
                {c.title}
              </button>
              <button
                type="button"
                className="rounded-md p-1 text-zinc-400 opacity-0 transition hover:bg-zinc-200/80 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-zinc-800"
                aria-label="Delete conversation"
                onClick={() => onDelete(c.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <p className="border-t border-zinc-200/70 px-3 py-3 text-[11px] text-zinc-500 dark:border-zinc-800">
          History stays in this browser only.
        </p>
      </aside>
    </>
  );
}
