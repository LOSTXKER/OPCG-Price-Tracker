"use client"

import { cn } from "@/lib/utils"

/**
 * The one on/off Switch (SETTINGS-09). Replaces the hand-rolled toggles in the
 * settings surfaces. Controlled — pass `checked` + `onCheckedChange`.
 *
 * Visual track is the familiar 44×24 pill (primary when on, muted when off); a
 * transparent expander grows the *tap* target to ≥44px tall without changing the
 * visual size, so it satisfies the mobile tap-target rule from the start.
 */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  ariaLabel,
  id,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  /** Accessible name when there is no associated visible <label>. */
  ariaLabel?: string
  id?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent motion-base",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked ? "bg-primary" : "bg-muted",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
        className,
      )}
    >
      {/* transparent tap-target expander → ≥44px tall hit area, visual stays 44×24 */}
      <span aria-hidden className="absolute -inset-y-2.5 inset-x-0" />
      <span
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-background shadow ring-1 ring-border/10 motion-base",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  )
}
