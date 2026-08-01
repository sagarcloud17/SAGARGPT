"use client";

import { FileText, Github, Linkedin, Menu, PanelLeft } from "lucide-react";
import { apiBaseUrl, candidateShortName, linkedInUrl } from "@/lib/api";

interface ChatHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function ChatHeader({
  sidebarOpen,
  onToggleSidebar,
}: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-bg/80 px-3 backdrop-blur-xl sm:h-16 sm:px-5">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-xl text-text-secondary transition hover:bg-white/5 hover:text-text"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tracking-tight text-text sm:text-base">
            Ask {candidateShortName}
          </p>
          <p className="hidden text-xs text-text-muted sm:block">
            Personal AI Engineer
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn profile"
          className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-xl text-text-secondary transition hover:bg-white/5 hover:text-text sm:w-auto sm:gap-2 sm:px-3"
        >
          <Linkedin className="h-4 w-4" />
          <span className="hidden text-xs font-medium md:inline">LinkedIn</span>
        </a>
        <a
          href={`${apiBaseUrl}/resume/download`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Download resume"
          className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-xl text-text-secondary transition hover:bg-white/5 hover:text-text sm:w-auto sm:gap-2 sm:px-3"
        >
          <FileText className="h-4 w-4" />
          <span className="hidden text-xs font-medium md:inline">Resume</span>
        </a>
        <a
          href="https://github.com/sagarcloud17"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub profile"
          className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-xl text-text-secondary transition hover:bg-white/5 hover:text-text"
        >
          <Github className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
}
