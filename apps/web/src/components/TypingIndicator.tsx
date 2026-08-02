"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  "Thinking…",
  "Searching…",
  "Searching projects…",
  "Generating answer…",
] as const;

export function TypingIndicator() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, 1100);
    return () => window.clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 py-2"
      aria-live="polite"
      aria-label={STEPS[step]}
    >
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-accent"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={STEPS[step]}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="font-sans text-sm text-text-muted"
        >
          {STEPS[step]}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}
