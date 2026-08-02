"use client";

import { motion } from "framer-motion";
import { PROMPT_CHIPS } from "@/lib/prompts";

interface PromptChipsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
  layout?: "wrap" | "scroll" | "grid";
}

export function PromptChips({
  onSelect,
  disabled,
  layout = "wrap",
}: PromptChipsProps) {
  if (layout === "grid") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {PROMPT_CHIPS.map((chip, i) => (
          <motion.button
            key={chip.label}
            type="button"
            disabled={disabled}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.3 }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(chip.prompt)}
            className="focus-ring rounded-2xl border border-border bg-card/80 px-4 py-3.5 text-left text-sm leading-snug text-text-secondary transition hover:border-accent/30 hover:bg-card hover:text-text"
          >
            {chip.prompt}
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <div
      className={
        layout === "scroll"
          ? "-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar"
          : "flex flex-wrap justify-center gap-2"
      }
    >
      {PROMPT_CHIPS.map((chip, i) => (
        <motion.button
          key={chip.label}
          type="button"
          disabled={disabled}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 * i, duration: 0.25 }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(chip.prompt)}
          className="focus-ring shrink-0 rounded-full border border-border bg-card/90 px-4 py-2.5 text-[13px] font-medium text-text-secondary transition hover:border-accent/35 hover:text-text"
        >
          {chip.label}
        </motion.button>
      ))}
    </div>
  );
}
