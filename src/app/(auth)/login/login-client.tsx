"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { z } from "zod"
import { Loader2, Mail, Play } from "lucide-react"

import { AuthShell } from "@/components/auth/auth-shell"
import { OAuthButtons } from "@/components/auth/oauth-buttons"
import { PasswordInput } from "@/components/auth/password-input"
import { FormError } from "@/components/auth/form-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { isAuthBypassed } from "@/lib/env"

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
})

export function LoginClient() {
  const router = useRouter()
  const lang = useUIStore((s) => s.language)
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/"
  const authError = searchParams.get("error")

  useEffect(() => {
    if (isAuthBypassed()) {
      router.replace(redirect)
    }
  }, [router, redirect])

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(
    authError === "auth_failed" ? "Sign in failed. Please try again." : null
  )
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  const signInDemo = async () => {
    setError(null)
    setDemoLoading(true)
    const supabase = createClient()
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: "demo@meecard.com",
      password: "demo1234",
    })
    setDemoLoading(false)
    if (signError) {
      setError("Demo account unavailable")
      return
    }
    router.push(redirect)
    router.refresh()
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid credentials")
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error: signError } = await supabase.auth.signInWithPassword({
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
      title={t(lang, "login")}
      subtitle={t(lang, "loginSubtitle")}
      showBackLink
      hero={{
        radialGradient:
          "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent",
        title: t(lang, "loginHeroTitle"),
        desc: t(lang, "loginHeroDesc"),
      }}
    >
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
          <label htmlFor="login-email" className="text-label">
            {t(lang, "emailLabel")}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="you@example.com"
              disabled={loading}
              className="h-11 pl-10"
            />
          </div>
        </div>
        <PasswordInput
          id="login-password"
          label={t(lang, "passwordLabel")}
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          disabled={loading}
          lang={lang}
          autoComplete="current-password"
          leftIcon={false}
          showToggle
          inputClassName="h-11"
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-meta underline-offset-4 hover:text-primary hover:underline"
          >
            {t(lang, "forgotPassword")}
          </Link>
        </div>

        <FormError message={error} />

        <Button type="submit" className="h-11 w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {t(lang, "signingIn")}
            </>
          ) : (
            t(lang, "login")
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t(lang, "noAccount")}{" "}
        <Link
          href={`/register?redirect=${encodeURIComponent(redirect)}`}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t(lang, "register")}
        </Link>
      </p>

      {/* Demo login */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-eyebrow">{t(lang, "or")}</span>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={loading || demoLoading}
        onClick={() => void signInDemo()}
        className="h-11 w-full gap-2 border-dashed"
      >
        {demoLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Play className="size-3.5" />
        )}
        {demoLoading ? t(lang, "signingIn") : t(lang, "tryDemo")}
      </Button>
    </AuthShell>
  )
}
