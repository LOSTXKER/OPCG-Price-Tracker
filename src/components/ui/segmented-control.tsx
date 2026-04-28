"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: ReactNode;
  icon?: LucideIcon;
  /** Optional badge / count chip rendered after the label. */
  badge?: ReactNode;
  disabled?: boolean;
  /** Optional aria-label override. */
  ariaLabel?: string;
}

export interface SegmentedControlProps<T extends string = string> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  /** ARIA label for the radiogroup. */
  ariaLabel?: string;
  className?: string;
  size?: "default" | "sm";
  /** Stretch each segment to fill the row equally. */
  fullWidth?: boolean;
}

/**
 * Single source of truth for "tab-like" pill controls.
 *
 * Replaces the home market tabs, trending tabs, view-mode toggle, orders status
 * tabs, and other ad-hoc segmented rows. Pattern:
 *   - track: `bg-muted/50 rounded-lg p-1`
 *   - segment: `rounded-md` button
 *   - active: `bg-card shadow-sm text-foreground`
 *
 * Implemented as a radiogroup so screen readers announce arrow-key movement
 * between options.
 */
export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
  size = "default",
  fullWidth = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg bg-muted/50 p-1",
        fullWidth && "w-full",
        className,
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.ariaLabel}
            disabled={option.disabled}
            onClick={() => !option.disabled && onChange(option.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-50",
              size === "sm" ? "h-7 px-2 text-xs" : "h-8 px-3 text-sm",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              fullWidth && "flex-1",
            )}
          >
            {Icon && <Icon className={cn(size === "sm" ? "size-3.5" : "size-4")} />}
            <span className="truncate">{option.label}</span>
            {option.badge}
          </button>
        );
      })}
    </div>
  );
}
