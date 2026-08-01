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
    <header className="z-30 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-zinc-200/50 bg-zinc-50/80 px-2 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/80 sm:h-14 sm:px-4">
      <div className="flex min-w-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-800"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <>
              <PanelLeftOpen className="hidden h-5 w-5 lg:block" />
              <Menu className="h-5 w-5 lg:hidden" />
            </>
          )}
        </button>
        <p className="truncate text-[15px] font-semibold tracking-tight sm:text-base">
          Ask {candidateShortName}
        </p>
      </div>

      <div className="flex items-center gap-0.5">
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-800 md:w-auto md:gap-1.5 md:px-3"
        >
          <Linkedin className="h-4 w-4" />
          <span className="hidden text-xs font-medium md:inline">LinkedIn</span>
        </a>
        <a
          href={`${apiBaseUrl}/resume/download`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Resume"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-800 md:w-auto md:gap-1.5 md:px-3"
        >
          <FileText className="h-4 w-4" />
          <span className="hidden text-xs font-medium md:inline">Resume</span>
        </a>
        <button
          type="button"
          onClick={toggle}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
