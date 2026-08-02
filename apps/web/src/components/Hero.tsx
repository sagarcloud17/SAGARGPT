"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { candidateShortName } from "@/lib/api";

const TRUST_ITEMS = [
  "Resume",
  "Portfolio",
  "Production Projects",
  "Verified Experience",
] as const;

/** Hero block used inside the empty state. */
export function Hero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-center"
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-accent/12 text-accent shadow-[0_0_48px_rgba(62,207,142,0.12)] sm:h-[64px] sm:w-[64px]">
        <Sparkles className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.75} />
      </div>
      <h1 className="font-sans text-[30px] font-semibold tracking-tight text-text sm:text-[44px] sm:leading-[1.08]">
        Ask {candidateShortName}
      </h1>
      <p className="mt-1.5 font-sans text-[15px] font-medium text-accent sm:text-base">
        Personal AI Engineer
      </p>
      <p className="mx-auto mt-3 max-w-md font-sans text-[14px] leading-relaxed text-text-secondary sm:text-[15px]">
        Grounded in real experience, production projects, résumé, and portfolio.
      </p>

      <div className="mx-auto mt-5 flex max-w-lg flex-wrap items-center justify-center gap-2">
        {TRUST_ITEMS.map((item) => (
          <span
            key={item}
            className="rounded-full border border-border bg-card/60 px-3 py-1 font-sans text-[11px] text-text-muted sm:text-[12px]"
          >
            {item}
          </span>
        ))}
      </div>
      <p className="mt-3 font-sans text-[12px] text-text-muted/80">
        Grounded on professional data + portfolio
      </p>
    </motion.div>
  );
}
