"use client";

import { Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300/70 bg-white/75 text-slate-700",
        className,
      )}
      aria-label="Light mode enabled"
      title="Light mode enabled"
    >
      <Sun className="h-4 w-4" />
    </span>
  );
}
