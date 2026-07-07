import { CheckCircle2 } from "lucide-react"

import { getPasswordRules } from "@/lib/auth/password-rules"
import { type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

/**
 * The password-strength checklist shared by register / reset-password /
 * settings-security. Renders nothing until the user starts typing. Advisory
 * only — does not gate submission (see getPasswordRules).
 */
export function PasswordRules({ value, lang }: { value: string; lang: Language }) {
  if (!value.length) return null
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
      {getPasswordRules(lang).map((rule) => {
        const pass = rule.test(value)
        return (
          <span
            key={rule.label}
            className={cn(
              "flex items-center gap-1 text-xs transition-colors",
              pass ? "text-success" : "text-muted-foreground"
            )}
          >
            <CheckCircle2 className={cn("size-3", pass ? "opacity-100" : "opacity-40")} />
            {rule.label}
          </span>
        )
      })}
    </div>
  )
}
