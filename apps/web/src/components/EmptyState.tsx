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
    <div className="flex flex-1 flex-col items-center justify-center px-1 py-6 sm:py-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="flex w-full max-w-2xl flex-col items-center"
      >
        <Hero />

        <p className="mt-5 max-w-md text-center text-sm leading-relaxed text-text-muted">
          👋 Hi, I&apos;m {candidateShortName}&apos;s AI. I answer questions about{" "}
          {candidateName}&apos;s experience, projects, architecture, and career —
          every response grounded in verified information.
        </p>

        <div className="mt-8 w-full sm:mt-10">
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
