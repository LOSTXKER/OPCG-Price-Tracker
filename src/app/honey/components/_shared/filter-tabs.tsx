"use client";

import { cn } from "@/lib/utils";

/**
 * Pill segmented control used as the inline filter strip across Achievements,
 * Activity, Rankings, and Shop. Single source of truth for the "soft tab" look:
 * raised active pill on a muted track.
 */
export function FilterTabs<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: T;
  onChange: (next: T) => void;
  options: { key: T; label: string }[];
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex gap-1 overflow-x-auto bg-muted/20 px-4 py-1.5 scrollbar-none",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.key)}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium motion-base",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
