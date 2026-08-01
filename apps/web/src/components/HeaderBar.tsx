"use client";

import {
  FileText,
  Linkedin,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
} from "lucide-react";
import { apiBaseUrl, candidateShortName, linkedInUrl } from "@/lib/api";
import { useTheme } from "@/lib/theme";

interface HeaderBarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function HeaderBar({
  sidebarOpen,
  onToggleSidebar,
}: HeaderBarProps) {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200/60 bg-white/70 px-3 py-3 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/70 sm:px-5">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-white/80 text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftOpen className="hidden h-4 w-4 sm:block" />
              <Menu className="h-4 w-4 sm:hidden" />
            </>
          )}
        </button>
        <div className="min-w-0">
          <p className="truncate font-[family-name:var(--font-geist-sans)] text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-base">
            Ask {candidateShortName}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open LinkedIn profile"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white/80 px-2.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:px-3"
        >
          <Linkedin className="h-3.5 w-3.5" />
          <span>LinkedIn</span>
        </a>
        <a
          href={`${apiBaseUrl}/resume/download`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View resume"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white/80 px-2.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:px-3"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Resume</span>
        </a>
        <button
          type="button"
          onClick={toggle}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-white/80 text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>
    </header>
  );
}
