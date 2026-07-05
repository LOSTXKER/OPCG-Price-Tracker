"use client"

import { Minus, Plus } from "lucide-react"

import { cn } from "@/lib/utils"

const BTN = { sm: "size-9", md: "size-10" } as const
const ICON = { sm: "size-3.5", md: "size-4" } as const
const FIELD = { sm: "h-9 w-16", md: "h-10 w-20" } as const

/**
 * The one quantity stepper (PLAY-07) — Minus / value / Plus, clamped to
 * [min, max]. `showInput` swaps the read-only count for an editable numeric
 * field. Buttons + field share the hairline border + hover treatment so every
 * stepper reads the same. Controlled: the parent owns `value`.
 */
export function QtyStepper({
  value,
  onChange,
  min = 1,
  max,
  size = "md",
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
  showInput?: boolean
  disabled?: boolean
  decreaseLabel?: string
  increaseLabel?: string
  className?: string
}) {
  const clamp = (n: number) => Math.max(min, max != null ? Math.min(max, n) : n)
  const btn =
    "ease-chrome flex shrink-0 items-center justify-center rounded-lg border border-[var(--p-hair)] bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <button
        type="button"
        aria-label={decreaseLabel}
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
        className={cn(btn, BTN[size])}
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
            "rounded-lg border border-[var(--p-hair)] bg-background px-2 text-center font-mono text-sm font-semibold tabular-nums outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
            FIELD[size],
          )}
        />
      ) : (
        <span className="w-8 text-center text-sm font-semibold tabular-nums">{value}</span>
      )}
      <button
        type="button"
        aria-label={increaseLabel}
        disabled={disabled || (max != null && value >= max)}
        onClick={() => onChange(clamp(value + 1))}
        className={cn(btn, BTN[size])}
      >
        <Plus className={ICON[size]} />
      </button>
    </div>
  )
}
