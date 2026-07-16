"use client";

import { Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";

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
  size?: "sm" | "md";
  /** Stretch each segment to fill the row equally. */
  fullWidth?: boolean;
  /**
   * Keep a 44px mobile hit target while painting a compact 36px toolbar frame.
   * The compact frame remains touch-sized below `md`; desktop geometry starts
   * at the chrome breakpoint. Pill/range controls opt into this by default.
   * Pass `false` only for intentionally prominent selectors (for example the
   * pricing billing cadence).
   */
  compactVisual?: boolean;
  /**
   * Visual style:
   * - `default` — rounded-xl on 44px mobile controls, rounded-lg once compact.
   *   Used for tab-like controls (home tabs, view toggle, etc.).
   * - `pill` — rounded-full pill on a frameless `bg-muted/50` track. Used as the
   *   canonical style for time-period / chart-range filters across the site
   *   (24h / 7d / 30d, chart ranges, portfolio history, etc.). Pill controls
   *   use the compact painted frame by default.
   */
  variant?: "default" | "pill";
  /**
   * Optional muted icon rendered before the first segment. Mostly used with
   * `variant="pill"` for the "trend / range" affordance on period filters.
   */
  leadingIcon?: LucideIcon;
}

export type SegmentedNavigationKey =
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "ArrowDown"
  | "Home"
  | "End";

/** Return the next enabled option for the radiogroup keyboard pattern. */
export function getSegmentedNavigationTarget(
  options: ReadonlyArray<Pick<SegmentedOption, "disabled">>,
  currentIndex: number,
  key: SegmentedNavigationKey,
): number | null {
  const enabledIndexes = options.flatMap((option, index) =>
    option.disabled ? [] : [index],
  );

  if (enabledIndexes.length === 0) return null;
  if (key === "Home") return enabledIndexes[0] ?? null;
  if (key === "End") return enabledIndexes.at(-1) ?? null;

  const currentPosition = enabledIndexes.indexOf(currentIndex);
  const movingBackward = key === "ArrowLeft" || key === "ArrowUp";

  if (currentPosition === -1) {
    return movingBackward
      ? (enabledIndexes.at(-1) ?? null)
      : (enabledIndexes[0] ?? null);
  }

  const offset = movingBackward ? -1 : 1;
  const nextPosition =
    (currentPosition + offset + enabledIndexes.length) % enabledIndexes.length;

  return enabledIndexes[nextPosition] ?? null;
}

/**
 * Single source of truth for "tab-like" pill controls.
 *
 * Replaces the home market tabs, trending tabs, view-mode toggle, orders status
 * tabs, time-period filters, chart-range filters, and other ad-hoc segmented
 * rows. Two visual variants:
 *
 *   - `default` (track-style):
 *       track:   `bg-muted/50`, responsive rounded track
 *       segment: inner corners `rounded-lg`; first/last outer corners follow
 *                the mobile track, then all corners become `rounded-md`
 *       active:  `bg-primary/15 text-primary`
 *
 *   - `pill` (period/range filters):
 *       track:   compact `rounded-full bg-muted/50`
 *       segment: `rounded-full`
 *       active:  `bg-primary/15 text-primary`
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
  size = "md",
  fullWidth = false,
  compactVisual,
  variant = "default",
  leadingIcon: LeadingIcon,
}: SegmentedControlProps<T>) {
  const isPill = variant === "pill";
  const useCompactVisual = compactVisual ?? isPill;
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = options.findIndex(
    (option) => option.value === value && !option.disabled,
  );
  const fallbackTabIndex = options.findIndex((option) => !option.disabled);
  const tabStopIndex = selectedIndex >= 0 ? selectedIndex : fallbackTabIndex;

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight" &&
      event.key !== "ArrowUp" &&
      event.key !== "ArrowDown" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }

    event.preventDefault();
    const targetIndex = getSegmentedNavigationTarget(
      options,
      currentIndex,
      event.key,
    );
    if (targetIndex == null) return;

    buttonRefs.current[targetIndex]?.focus();
    const targetOption = options[targetIndex];
    if (
      targetOption &&
      !targetOption.locked &&
      targetOption.value !== value
    ) {
      onChange(targetOption.value);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      data-compact-visual={useCompactVisual || undefined}
      className={cn(
        "inline-flex items-center",
        useCompactVisual
          ? cn(
              "relative h-11 gap-0.5 before:pointer-events-none before:absolute before:inset-x-0 before:inset-y-1 before:bg-muted/50 before:content-[''] md:h-auto md:bg-muted/50 md:before:hidden",
              isPill
                ? "px-0.5 before:rounded-full md:rounded-full md:p-0.5"
                : "before:rounded-lg md:rounded-lg md:p-1",
            )
          : isPill
            ? "gap-0.5 rounded-full bg-muted/50 px-0.5 md:p-0.5"
            : "gap-0.5 rounded-xl bg-muted/50 sm:rounded-lg sm:p-1",
        fullWidth && "w-full",
        className,
      )}
    >
      {LeadingIcon && (
        <LeadingIcon
          aria-hidden
          className={cn(
            "shrink-0 text-muted-foreground/50",
            useCompactVisual && "relative z-10",
            isPill ? "mx-1.5 size-3.5" : "ml-1 mr-0.5 size-3.5",
          )}
        />
      )}
      {options.map((option, index) => {
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
            tabIndex={index === tabStopIndex ? 0 : -1}
            ref={(node) => {
              buttonRefs.current[index] = node;
            }}
            onClick={handleClick}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "inline-flex h-11 min-w-11 items-center justify-center font-medium motion-base",
              useCompactVisual
                ? "gap-1 md:min-w-0 md:gap-1.5"
                : isPill
                  ? "gap-1.5 md:min-w-0"
                  : "gap-1.5 sm:min-w-0",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              "disabled:cursor-not-allowed disabled:opacity-50",
              useCompactVisual &&
                "relative isolate before:pointer-events-none before:absolute before:inset-x-0 before:inset-y-1 before:content-[''] md:before:hidden [&>*]:relative [&>*]:z-10",
              isPill
                ? cn("rounded-full", useCompactVisual && "before:rounded-full")
                : useCompactVisual
                  ? "rounded-md before:rounded-md md:rounded-md md:first:rounded-l-md md:last:rounded-r-md"
                  : "rounded-lg first:rounded-l-xl last:rounded-r-xl sm:rounded-md sm:first:rounded-l-md sm:last:rounded-r-md",
              size === "sm"
                ? isPill
                  ? useCompactVisual
                    ? "px-2 text-xs tabular-nums md:h-7 md:px-2.5"
                    : "px-2.5 text-xs tabular-nums md:h-7"
                  : useCompactVisual
                    ? "px-1.5 text-xs md:h-7 md:px-2"
                    : "px-2 text-xs sm:h-7"
                : isPill
                  ? useCompactVisual
                    ? "px-2 text-xs font-semibold tabular-nums md:h-7 md:px-2.5"
                    : "px-2.5 text-xs font-semibold tabular-nums md:h-7"
                  : useCompactVisual
                    ? "px-2.5 text-sm md:h-8 md:px-3"
                    : "px-3 text-sm sm:h-8",
              locked
                ? useCompactVisual
                  ? "cursor-pointer text-muted-foreground/60 hover:before:bg-amber-500/10 hover:text-amber-700 md:hover:bg-amber-500/10 dark:hover:text-amber-400"
                  : "cursor-pointer text-muted-foreground/60 hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-400"
                : active
                  ? useCompactVisual
                    ? "text-primary before:bg-primary/15 md:bg-primary/15"
                    : "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              fullWidth && "flex-1",
            )}
          >
            {Icon && (
              <Icon
                aria-hidden
                className={cn(size === "sm" ? "size-3.5" : "size-4")}
              />
            )}
            {option.label != null && (
              <span className="truncate">{option.label}</span>
            )}
            {locked && <Lock aria-hidden className="size-2.5" />}
            {option.badge}
          </button>
        );
      })}
    </div>
  );
}
