"use client"

import { Check, X } from "lucide-react"

import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

/**
 * Inline "create / rename portfolio" form (RESPONSIVE-04) — one input + save /
 * cancel, Enter to submit, Escape to cancel. Replaces the four hand-rolled copies
 * across the portfolio switcher / hub / hub-card. Controlled: the parent owns the
 * text state. `size="sm"` = the compact switcher row; `size="md"` = the roomier
 * panel forms. Buttons carry real aria-labels (the copies had none).
 */
export function PortfolioNameForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  lang,
  placeholder,
  size = "md",
  autoFocus = true,
  className,
}: {
  value: string
  onChange: (v: string) => void
  /** Called with the trimmed name when non-empty. */
  onSubmit: (name: string) => void
  onCancel: () => void
  lang: Language
  placeholder?: string
  size?: "sm" | "md"
  autoFocus?: boolean
  className?: string
}) {
  const icon = size === "sm" ? "size-3.5" : "size-4"
  return (
    <form
      className={cn("flex items-center", size === "sm" ? "gap-1" : "gap-1.5", className)}
      onSubmit={(e) => {
        e.preventDefault()
        const v = value.trim()
        if (v) onSubmit(v)
      }}
    >
      <input
        autoFocus={autoFocus}
        aria-label={placeholder ?? t(lang, "portfolioName")}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel()
        }}
        className={cn(
          "min-w-0 flex-1 rounded-lg border border-hair bg-background py-1.5 text-sm outline-none ring-primary/30 transition-shadow focus:ring-2",
          size === "sm" ? "px-2" : "px-2.5",
          placeholder && "placeholder:text-muted-foreground",
        )}
      />
      <button
        type="submit"
        aria-label={t(lang, "save")}
        className="ease-chrome shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Check className={icon} />
      </button>
      <button
        type="button"
        onClick={onCancel}
        aria-label={t(lang, "cancel")}
        className="ease-chrome shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className={icon} />
      </button>
    </form>
  )
}
