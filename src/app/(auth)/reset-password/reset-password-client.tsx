"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordRules } from "@/components/auth/password-rules";
import { FormError } from "@/components/auth/form-error";
import { createClient } from "@/lib/supabase/client";
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
    <AuthShell
      lang={lang}
      title={t(lang, "resetPasswordTitle")}
      subtitle={t(lang, "resetPasswordDesc")}
    >
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
          <PasswordInput
            id="reset-password"
            label={t(lang, "newPasswordLabel")}
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            disabled={loading}
            lang={lang}
            autoComplete="new-password"
            leftIcon
            showToggle
            inputClassName="h-11"
            hint={<PasswordRules value={password} lang={lang} />}
          />

          <PasswordInput
            id="reset-confirm"
            label={t(lang, "confirmNewPasswordLabel")}
            value={confirm}
            onChange={(ev) => setConfirm(ev.target.value)}
            disabled={loading}
            lang={lang}
            autoComplete="new-password"
            leftIcon
            showToggle={false}
            inputClassName="h-11"
          />

          <FormError message={error} />

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
    </AuthShell>
  );
}
