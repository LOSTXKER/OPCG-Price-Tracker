"use client"

import { useState, type ReactNode } from "react"
import { Eye, EyeOff, Lock } from "lucide-react"

import { Input } from "@/components/ui/input"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

/**
 * The canonical password field for every auth surface (login · register ×2 ·
 * reset ×2 · settings-security ×2). Owns its own show/hide `visible` state.
 *
 * Fixes IDENTITY-10 in one place: the eye toggle is now in tab order (no
 * `tabIndex={-1}`) with an aria-label + aria-pressed — a keyboard/screen-reader
 * fix that is visually identical to the old button.
 */
export function PasswordInput({
  id,
  label,
  value,
  onChange,
  disabled,
  lang,
  autoComplete,
  leftIcon = false,
  showToggle = true,
  inputClassName,
  labelClassName = "text-label",
  hint,
}: {
  id: string
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  lang: Language
  autoComplete?: string
  /** show the leading Lock icon (register/reset) — login/security omit it. */
  leftIcon?: boolean
  /** render the show/hide eye button (false for masked confirm fields). */
  showToggle?: boolean
  inputClassName?: string
  /** label token — defaults to `.text-label` (auth pages); settings uses `.text-eyebrow`. */
  labelClassName?: string
  /** slotted below the input inside the same field group (e.g. PasswordRules). */
  hint?: ReactNode
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="space-y-2">
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      <div className="relative">
        {leftIcon && (
          <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={cn(inputClassName, leftIcon && "pl-10", showToggle && "pr-10")}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={t(lang, visible ? "hidePassword" : "showPassword")}
            aria-pressed={visible}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {hint}
    </div>
  )
}
