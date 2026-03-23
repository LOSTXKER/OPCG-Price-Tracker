"use client";

import { Lock } from "lucide-react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

/** Placeholder until Pro subscription is wired. */
const IS_PRO_USER = false;

export function ModeToggle({ className }: { className?: string }) {
  const mode = useUIStore((s) => s.mode);
  const setMode = useUIStore((s) => s.setMode);

  return (
    <div
      className={cn(
        "relative inline-flex h-8 items-center rounded-full border border-border bg-card p-0.5 shadow-sm",
        className
      )}
      role="group"
      aria-label="Display mode"
    >
      <motion.div
        className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full bg-primary/15 ring-1 ring-primary/25"
        initial={false}
        animate={{
          left: mode === "casual" ? "2px" : "calc(50% + 0px)",
        }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
      />
      <button
        type="button"
        onClick={() => setMode("casual")}
        className={cn(
          "relative z-10 flex min-w-[4.5rem] items-center justify-center gap-1 rounded-full px-2.5 text-xs font-medium transition-colors",
          mode === "casual"
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Casual
      </button>
      <button
        type="button"
        onClick={() => setMode("trader")}
        className={cn(
          "relative z-10 flex min-w-[4.5rem] items-center justify-center gap-1 rounded-full px-2.5 text-xs font-medium transition-colors",
          mode === "trader"
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Trader
        {!IS_PRO_USER && (
          <span title="Pro — unlockable" className="inline-flex">
            <Lock className="size-3 shrink-0 text-pro" aria-hidden />
          </span>
        )}
      </button>
    </div>
  );
}
