"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { candidateShortName } from "@/lib/api";

/** Hero block used inside the empty state. */
export function Hero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-center"
    >
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent shadow-[0_0_40px_rgba(16,185,129,0.15)]">
        <Sparkles className="h-5 w-5" />
      </div>
      <h1 className="text-[32px] font-semibold tracking-tight text-text sm:text-[48px] sm:leading-[1.1]">
        Ask {candidateShortName}
      </h1>
      <p className="mt-2 text-base font-medium text-accent/90 sm:text-lg">
        Personal AI Engineer
      </p>
      <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-text-secondary sm:text-base">
        Grounded in real experience, production projects, résumé, and portfolio.
      </p>
    </motion.div>
  );
}
