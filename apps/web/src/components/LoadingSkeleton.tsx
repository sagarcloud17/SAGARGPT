"use client";

export function LoadingSkeleton() {
  return (
    <div className="space-y-3 py-2" aria-hidden>
      <div className="h-3 w-[72%] animate-pulse rounded-full bg-white/5" />
      <div className="h-3 w-[88%] animate-pulse rounded-full bg-white/5" />
      <div className="h-3 w-[64%] animate-pulse rounded-full bg-white/5" />
    </div>
  );
}
