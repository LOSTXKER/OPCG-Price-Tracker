"use client";

import { Lock } from "lucide-react";
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
  /**
   * If true, the option is rendered with a lock indicator and clicking it calls
   * `onLocked` instead of `onChange`. Used for tier-gated options (e.g. extended
   * chart history on the price chart).
   */
  locked?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  /** Called when the user clicks a `locked` option. */
  onLocked?: (option: SegmentedOption<T>) => void;
  /** ARIA label for the radiogroup. */
  ariaLabel?: string;
  className?: string;
  size?: "default" | "sm";
  /** Stretch each segment to fill the row equally. */
  fullWidth?: boolean;
  /**
   * Visual style:
   * - `default` — rounded-lg pill on a `bg-muted/50` track. Used for tab-like
   *   segmented controls (home tabs, trending tabs, view toggle, etc.).
   * - `pill` — rounded-full pill on a frameless `bg-muted/50` track. Used as the
   *   canonical style for time-period / chart-range filters across the site
   *   (24h / 7d / 30d, chart ranges, portfolio history, etc.).
   */
  variant?: "default" | "pill";
  /**
   * Optional muted icon rendered before the first segment. Mostly used with
   * `variant="pill"` for the "trend / range" affordance on period filters.
   */
  leadingIcon?: LucideIcon;
}

/**
 * Single source of truth for "tab-like" pill controls.
 *
 * Replaces the home market tabs, trending tabs, view-mode toggle, orders status
 * tabs, time-period filters, chart-range filters, and other ad-hoc segmented
 * rows. Two visual variants:
 *
 *   - `default` (track-style):
 *       track:   `bg-muted/50 rounded-lg p-1`
 *       segment: `rounded-md`
 *       active:  `bg-card shadow-sm text-foreground`
 *
 *   - `pill` (period/range filters):
 *       track:   `rounded-full border border-border/50 p-0.5`
 *       segment: `rounded-full`
 *       active:  `bg-background shadow-sm text-foreground`
 *
 * Implemented as a radiogroup so screen readers announce arrow-key movement
 * between options.
 */
export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  onLocked,
  ariaLabel,
  className,
  size = "default",
  fullWidth = false,
  variant = "default",
  leadingIcon: LeadingIcon,
}: SegmentedControlProps<T>) {
  const isPill = variant === "pill";

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center",
        isPill
          ? "gap-0.5 rounded-full bg-muted/50 p-0.5"
          : "gap-0.5 rounded-lg bg-muted/50 p-1",
        fullWidth && "w-full",
        className,
      )}
    >
      {LeadingIcon && (
        <LeadingIcon
          aria-hidden
          className={cn(
            "shrink-0 text-muted-foreground/50",
            isPill ? "mx-1.5 size-3.5" : "ml-1 mr-0.5 size-3.5",
          )}
        />
      )}
      {options.map((option) => {
        const Icon = option.icon;
        const active = option.value === value;
        const locked = !!option.locked;

        const handleClick = () => {
          if (option.disabled) return;
          if (locked) {
            onLocked?.(option);
            return;
          }
          onChange(option.value);
        };

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.ariaLabel}
            disabled={option.disabled}
            onClick={handleClick}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 font-medium motion-base",
              "disabled:cursor-not-allowed disabled:opacity-50",
              isPill ? "rounded-full" : "rounded-md",
              size === "sm"
                ? isPill
                  ? "h-7 px-2.5 text-xs tabular-nums"
                  : "h-7 px-2 text-xs"
                : isPill
                  ? "h-7 px-2.5 text-xs font-semibold tabular-nums"
                  : "h-8 px-3 text-sm",
              locked
                ? "cursor-pointer text-muted-foreground/60 hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-400"
                : active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              fullWidth && "flex-1",
            )}
          >
            {Icon && <Icon className={cn(size === "sm" ? "size-3.5" : "size-4")} />}
            <span className="truncate">{option.label}</span>
            {locked && <Lock aria-hidden className="size-2.5" />}
            {option.badge}
          </button>
        );
      })}
    </div>
  );
}
