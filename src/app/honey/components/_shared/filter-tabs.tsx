"use client";

import { cn } from "@/lib/utils";
import { SegmentedControl } from "@/components/ui/segmented-control";

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
      className={cn(
        "scroll-fade-x flex gap-1 overflow-x-auto bg-muted/20 px-4 py-1.5 scrollbar-none",
        className,
      )}
    >
      <SegmentedControl<T>
        value={value}
        onChange={onChange}
        options={options.map((option) => ({
          value: option.key,
          label: option.label,
        }))}
        size="sm"
        ariaLabel={ariaLabel}
        className="shrink-0 bg-transparent p-0 sm:p-0"
      />
    </div>
  );
}
