"use client";

import { useEffect, useState } from "react";

/** True at Tailwind `lg` breakpoint and above (1024px). */
export function useIsDesktop(breakpointPx = 1024): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpointPx}px)`);
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [breakpointPx]);

  return isDesktop;
}
