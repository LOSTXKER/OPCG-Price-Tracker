import { t, type Language } from "@/lib/i18n"

/**
 * The single source of the advisory password rules shown as a checklist on
 * register / reset-password / settings-security. UI-only hints — NOT wired into
 * any zod schema (submit validation stays `.min(8)`; enforcing all three is
 * IDENTITY-09, out of scope). Takes `lang` so labels stay reactive via t().
 */
export function getPasswordRules(lang: Language): { test: (v: string) => boolean; label: string }[] {
  return [
    { test: (v: string) => v.length >= 8, label: t(lang, "pwRuleLength") },
    { test: (v: string) => /[A-Z]/.test(v), label: t(lang, "pwRuleUppercase") },
    { test: (v: string) => /\d/.test(v), label: t(lang, "pwRuleNumber") },
  ]
}
