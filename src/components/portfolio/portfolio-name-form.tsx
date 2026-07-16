"use client"

import { Check, Loader2, X } from "lucide-react"

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
  pending = false,
  error,
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
  pending?: boolean
  error?: string | null
  className?: string
}) {
  const icon = size === "sm" ? "size-3.5" : "size-4"
  return (
    <form
      className={cn("space-y-1.5", className)}
      aria-busy={pending}
      onSubmit={(e) => {
        e.preventDefault()
        const v = value.trim()
        if (v && !pending) onSubmit(v)
      }}
    >
      <div className={cn("flex items-center", size === "sm" ? "gap-1" : "gap-1.5")}>
        <input
          autoFocus={autoFocus}
          aria-label={placeholder ?? t(lang, "portfolioName")}
          aria-invalid={!!error}
          aria-describedby={error ? "portfolio-name-error" : undefined}
          placeholder={placeholder}
          value={value}
          disabled={pending}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && !pending) onCancel()
          }}
          className={cn(
            "min-h-11 min-w-0 flex-1 rounded-lg border border-hair bg-background py-1.5 text-sm outline-none ring-primary/30 transition-shadow focus:ring-2 sm:min-h-9",
            size === "sm" ? "px-2" : "px-2.5",
            placeholder && "placeholder:text-muted-foreground",
          )}
        />
        <button
          type="submit"
          disabled={pending || value.trim().length === 0}
          aria-label={t(lang, "save")}
          className="ease-chrome flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 sm:size-9"
        >
          {pending ? <Loader2 className={cn(icon, "animate-spin")} /> : <Check className={icon} />}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onCancel}
          aria-label={t(lang, "cancel")}
          className="ease-chrome flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 sm:size-9"
        >
          <X className={icon} />
        </button>
      </div>
      {error && (
        <p id="portfolio-name-error" role="alert" className="text-meta text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
