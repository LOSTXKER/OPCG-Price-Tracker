"use client"

import { Minus, Plus } from "lucide-react"

import { cn } from "@/lib/utils"

const BTN = { sm: "size-11 sm:size-9", md: "size-11 sm:size-10" } as const
const ICON = { sm: "size-3.5", md: "size-4" } as const
const FIELD = {
  sm: "h-11 w-16 sm:h-9",
  md: "h-11 w-20 sm:h-10",
} as const

/**
 * The one quantity stepper (PLAY-07) — Minus / value / Plus, clamped to
 * [min, max]. Two layouts: `split` (separate hairline buttons + gap — drop / add
 * flows) and `joined` (buttons share one bordered pill — deck rows). `showInput`
 * swaps the read-only count for an editable numeric field. Controlled: the parent
 * owns `value`. Minus is disabled at `min`, so pass `min={0}` when reaching 0 has
 * a meaning (e.g. the deck removes the card).
 */
export function QtyStepper({
  value,
  onChange,
  min = 1,
  max,
  size = "md",
  variant = "split",
  showInput = true,
  disabled,
  decreaseLabel = "Decrease",
  increaseLabel = "Increase",
  className,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  size?: "sm" | "md"
  variant?: "split" | "joined"
  showInput?: boolean
  disabled?: boolean
  decreaseLabel?: string
  increaseLabel?: string
  className?: string
}) {
  const clamp = (n: number) => Math.max(min, max != null ? Math.min(max, n) : n)
  const joined = variant === "joined"
  const btnBase =
    "ease-chrome flex shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
  const btnChrome = joined ? "" : "rounded-lg border border-hair bg-background"
  return (
    <div
      className={cn(
        "inline-flex items-center",
        joined ? "rounded-lg border border-hair" : "gap-2.5",
        className,
      )}
    >
      <button
        type="button"
        aria-label={decreaseLabel}
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
        className={cn(btnBase, btnChrome, BTN[size], joined && "rounded-l-lg")}
      >
        <Minus className={ICON[size]} />
      </button>
      {showInput ? (
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "")
            onChange(clamp(Number(v) || min))
          }}
          className={cn(
            "rounded-lg border border-hair bg-background px-2 text-center font-mono text-sm font-semibold tabular-nums outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
            FIELD[size],
          )}
        />
      ) : (
        <span className={cn("text-center text-sm font-semibold tabular-nums", joined ? "w-6" : "w-8")}>{value}</span>
      )}
      <button
        type="button"
        aria-label={increaseLabel}
        disabled={disabled || (max != null && value >= max)}
        onClick={() => onChange(clamp(value + 1))}
        className={cn(btnBase, btnChrome, BTN[size], joined && "rounded-r-lg")}
      >
        <Plus className={ICON[size]} />
      </button>
    </div>
  )
}
