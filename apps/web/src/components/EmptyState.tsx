"use client";

import { motion } from "framer-motion";
import { Hero } from "@/components/Hero";
import { PromptChips } from "@/components/PromptChips";
import { candidateName, candidateShortName } from "@/lib/api";

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export function EmptyState({ onSelectPrompt, disabled }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-start px-1 pb-4 pt-2 sm:justify-center sm:pb-8 sm:pt-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="flex w-full max-w-2xl flex-col items-center"
      >
        <Hero />

        <p className="mt-4 max-w-md text-center font-sans text-[13px] leading-relaxed text-text-muted sm:mt-5 sm:text-sm">
          👋 Hi, I&apos;m {candidateShortName}&apos;s AI. Ask about{" "}
          {candidateName}&apos;s experience, projects, architecture, and career —
          answers stay grounded in verified information.
        </p>

        <div className="mt-6 w-full sm:mt-8">
          <PromptChips
            layout="wrap"
            onSelect={onSelectPrompt}
            disabled={disabled}
          />
        </div>
      </motion.div>
    </div>
  );
}
