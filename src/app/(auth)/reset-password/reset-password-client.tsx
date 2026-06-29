"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock, CheckCircle2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export function ResetPasswordClient() {
  const lang = useUIStore((s) => s.language);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const PASSWORD_RULES = [
    { test: (v: string) => v.length >= 8, label: t(lang, "pwRuleLength") },
    { test: (v: string) => /[A-Z]/.test(v), label: t(lang, "pwRuleUppercase") },
    { test: (v: string) => /\d/.test(v), label: t(lang, "pwRuleNumber") },
  ];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid data");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSuccess(true);
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/"><Logo size="lg" /></Link>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-h1">{t(lang, "resetPasswordTitle")}</h1>
          <p className="text-body-sm text-muted-foreground">{t(lang, "resetPasswordDesc")}</p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
              <CheckCircle2 className="size-8 text-emerald-500" />
              <p className="text-sm">{t(lang, "passwordResetSuccess")}</p>
            </div>
            <Link href="/login" className="block">
              <Button className="h-11 w-full">{t(lang, "login")}</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="new-password" className="text-label">
                {t(lang, "newPasswordLabel")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="new-password"
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
              {password.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
                  {PASSWORD_RULES.map((rule) => {
                    const pass = rule.test(password);
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
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-label">
                {t(lang, "confirmNewPasswordLabel")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(ev) => setConfirm(ev.target.value)}
                  disabled={loading}
                  className="h-11 pl-10"
                />
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
                  {t(lang, "resettingPassword")}
                </>
              ) : (
                t(lang, "resetPassword")
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
