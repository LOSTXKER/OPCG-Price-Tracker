"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { z } from "zod"
import { Eye, EyeOff, Loader2, Mail, Lock, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/brand/logo"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

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

const PASSWORD_RULES = [
  { test: (v: string) => v.length >= 8, label: "At least 8 characters" },
  { test: (v: string) => /[A-Z]/.test(v), label: "At least 1 uppercase" },
  { test: (v: string) => /\d/.test(v), label: "At least 1 number" },
]

export function RegisterClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const oauthRedirect = () => {
    const origin = window.location.origin
    return `${origin}/callback?redirect=${encodeURIComponent(redirect)}`
  }

  const signInOAuth = async (provider: "google" | "facebook") => {
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: oauthRedirect() },
    })
    setLoading(false)
    if (oauthError) setError(oauthError.message)
  }

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
    <div className="flex min-h-svh">
      {/* Decorative left panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-foreground lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/25 via-transparent to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo size="lg" mono className="text-background" />
          <div className="max-w-md">
            <h2 className="text-3xl font-bold tracking-tight text-background">
              Start collecting
              <br />
              and tracking for free
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-background/60">
              Create a portfolio, track card prices, and get alerts when prices hit your target.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              {[
                "Free, no cost",
                "Unlimited portfolios",
                "Automatic price alerts",
              ].map((text) => (
                <div key={text} className="flex items-center gap-2 text-sm text-background/70">
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />
                  {text}
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-background/30">
            Meecard
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-sm space-y-8">
            {/* Mobile logo */}
            <div className="text-center lg:hidden">
              <Logo size="lg" />
            </div>

            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold tracking-tight">Sign up</h1>
              <p className="text-sm text-muted-foreground">
                Create an account for Portfolio &amp; Watchlist
              </p>
            </div>

            {/* OAuth buttons */}
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => void signInOAuth("google")}
                className="h-11 gap-2"
              >
                <svg viewBox="0 0 24 24" className="size-4">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => void signInOAuth("facebook")}
                className="h-11 gap-2"
              >
                <svg viewBox="0 0 24 24" className="size-4 fill-[#1877F2]">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground">or use email</span>
              </div>
            </div>

            {/* Email form */}
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="register-email" className="text-sm font-medium">
                  Email
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
                    className="h-11 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="register-password" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    disabled={loading}
                    className="h-11 pl-10 pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {/* Password strength hints */}
                {password.length > 0 && (
                  <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
                    {PASSWORD_RULES.map((rule) => {
                      const pass = rule.test(password)
                      return (
                        <span
                          key={rule.label}
                          className={cn(
                            "flex items-center gap-1 text-xs transition-colors",
                            pass ? "text-emerald-500" : "text-muted-foreground"
                          )}
                        >
                          <CheckCircle2 className={cn("size-3", pass ? "opacity-100" : "opacity-40")} />
                          {rule.label}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="register-confirm" className="text-sm font-medium">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="register-confirm"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(ev) => setConfirm(ev.target.value)}
                    disabled={loading}
                    className="h-11 pl-10 pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="h-11 w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Signing up...
                  </>
                ) : (
                  "Sign up"
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={`/login?redirect=${encodeURIComponent(redirect)}`}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
