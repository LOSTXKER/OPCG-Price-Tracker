"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/client";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";

export function ForgotPasswordClient() {
  const lang = useUIStore((s) => s.language);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/"><Logo size="lg" /></Link>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-h1">{t(lang, "forgotPasswordTitle")}</h1>
          <p className="text-body-sm text-muted-foreground">{t(lang, "forgotPasswordDesc")}</p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
              <CheckCircle2 className="size-8 text-emerald-500" />
              <p className="text-sm">{t(lang, "resetLinkSent")}</p>
            </div>
            <Link href="/login" className="block">
              <Button variant="outline" className="h-11 w-full">
                <ArrowLeft className="mr-2 size-4" />
                {t(lang, "backToLogin")}
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="reset-email" className="text-label">
                {t(lang, "emailLabel")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reset-email"
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

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="h-11 w-full" disabled={loading || !email}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t(lang, "sendingResetLink")}
                </>
              ) : (
                t(lang, "sendResetLink")
              )}
            </Button>

            <Link href="/login" className="block">
              <Button variant="ghost" className="h-11 w-full" type="button">
                <ArrowLeft className="mr-2 size-4" />
                {t(lang, "backToLogin")}
              </Button>
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
