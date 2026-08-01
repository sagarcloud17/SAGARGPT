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

const iconBtn =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200/80 bg-white/80 text-zinc-700 transition hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:h-9 sm:w-9";

const actionBtn =
  "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white/80 px-2.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:h-9 sm:px-3";

export function HeaderBar({
  sidebarOpen,
  onToggleSidebar,
}: HeaderBarProps) {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200/60 bg-white/80 px-3 py-2.5 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/80 sm:gap-3 sm:px-5 sm:py-3">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className={iconBtn}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftOpen className="hidden h-4 w-4 lg:block" />
              <Menu className="h-4 w-4 lg:hidden" />
            </>
          )}
        </button>
        <div className="min-w-0">
          <p className="truncate font-[family-name:var(--font-geist-sans)] text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-base">
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
          className={actionBtn}
        >
          <Linkedin className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          <span className="hidden md:inline">LinkedIn</span>
        </a>
        <a
          href={`${apiBaseUrl}/resume/download`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View resume"
          className={actionBtn}
        >
          <FileText className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          <span className="hidden md:inline">Resume</span>
        </a>
        <button
          type="button"
          onClick={toggle}
          className={iconBtn}
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
