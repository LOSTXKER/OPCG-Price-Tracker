"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { z } from "zod"
import { Loader2, Mail, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthShell } from "@/components/auth/auth-shell"
import { OAuthButtons } from "@/components/auth/oauth-buttons"
import { PasswordInput } from "@/components/auth/password-input"
import { PasswordRules } from "@/components/auth/password-rules"
import { FormError } from "@/components/auth/form-error"
import { createClient } from "@/lib/supabase/client"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"

const registerSchema = z
  .object({
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  })

export function RegisterClient() {
  const router = useRouter()
  const lang = useUIStore((s) => s.language)
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const parsed = registerSchema.safeParse({ email, password, confirm })
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      setError(first?.message ?? "Invalid data")
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error: signError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
    })
    setLoading(false)
    if (signError) {
      setError(signError.message)
      return
    }
    router.push(redirect)
    router.refresh()
  }

  return (
    <AuthShell
      lang={lang}
      title={t(lang, "register")}
      subtitle={t(lang, "registerSubtitle")}
      showBackLink
      hero={{
        radialGradient:
          "bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/25 via-transparent to-transparent",
        title: t(lang, "registerHeroTitle"),
        desc: t(lang, "registerHeroDesc"),
        extra: (
          <div className="mt-8 flex flex-col gap-3">
            {([
              t(lang, "registerFeature1"),
              t(lang, "registerFeature2"),
              t(lang, "registerFeature3"),
            ] as const).map((text) => (
              <div key={text} className="flex items-center gap-2 text-sm text-background/70">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                {text}
              </div>
            ))}
          </div>
        ),
      }}
    >
      {/* OAuth buttons */}
      <OAuthButtons
        redirect={redirect}
        lang={lang}
        disabled={loading}
        setLoading={setLoading}
        setError={setError}
      />

      {/* Email form */}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="register-email" className="text-label">
            {t(lang, "emailLabel")}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="you@example.com"
              disabled={loading}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={error ? "register-error" : undefined}
              className="h-11 pl-10"
            />
          </div>
        </div>

        <PasswordInput
          id="register-password"
          label={t(lang, "passwordLabel")}
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          disabled={loading}
          lang={lang}
          autoComplete="new-password"
          leftIcon
          showToggle
          inputClassName="h-11"
          hint={<PasswordRules value={password} lang={lang} />}
          invalid={Boolean(error)}
          describedBy={error ? "register-error" : undefined}
        />

        <PasswordInput
          id="register-confirm"
          label={t(lang, "confirmPasswordLabel")}
          value={confirm}
          onChange={(ev) => setConfirm(ev.target.value)}
          disabled={loading}
          lang={lang}
          autoComplete="new-password"
          leftIcon
          showToggle
          inputClassName="h-11"
          invalid={Boolean(error)}
          describedBy={error ? "register-error" : undefined}
        />

        <FormError id="register-error" message={error} />

        <Button type="submit" className="h-11 w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {t(lang, "signingUp")}
            </>
          ) : (
            t(lang, "register")
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t(lang, "hasAccount")}{" "}
        <Link
          href={`/login?redirect=${encodeURIComponent(redirect)}`}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t(lang, "login")}
        </Link>
      </p>
    </AuthShell>
  )
}
