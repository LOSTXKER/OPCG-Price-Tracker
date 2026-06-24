"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  History,
  KeyRound,
  Loader2,
  Lock,
  Monitor,
  ShieldCheck,
  ShieldOff,
  Smartphone,
} from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { ApiError, apiFetch, apiGet, apiTry } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import { useUIStore } from "@/stores/ui-store";
import { t, getLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const passwordSchema = z
  .object({
    password: z.string().min(8),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"] });

type LoginSession = {
  id: number;
  method: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

function parseDevice(ua: string | null): { label: string; isMobile: boolean } {
  if (!ua) return { label: "Unknown", isMobile: false };
  const mobile = /mobile|android|iphone|ipad/i.test(ua);
  const browser =
    ua.match(/(Chrome|Firefox|Safari|Edge|Opera|Brave)\/[\d.]+/)?.[1] ?? "Browser";
  const os = ua.match(/(Windows|Mac OS X|Linux|Android|iOS|iPhone OS)/)?.[1] ?? "";
  return { label: `${browser}${os ? ` · ${os}` : ""}`, isMobile: mobile };
}

function methodLabelKey(m: string): "authOAuth" | "authPassword" | "authMagicLink" {
  if (m === "google" || m === "facebook") return "authOAuth";
  if (m === "magiclink") return "authMagicLink";
  return "authPassword";
}

export function SectionSecurity() {
  const lang = useUIStore((s) => s.language);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // 2FA state
  type MfaFactor = { id: string; friendlyName?: string; status: string; createdAt: string };
  const [mfaFactors, setMfaFactors] = useState<MfaFactor[]>([]);
  const [loadingMfa, setLoadingMfa] = useState(true);
  const [mfaStep, setMfaStep] = useState<"idle" | "enrolling" | "verifying" | "disabling">("idle");
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [enrollFactorId, setEnrollFactorId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaSaving, setMfaSaving] = useState(false);

  const PASSWORD_RULES = [
    { test: (v: string) => v.length >= 8, label: t(lang, "pwRuleLength") },
    { test: (v: string) => /[A-Z]/.test(v), label: t(lang, "pwRuleUppercase") },
    { test: (v: string) => /\d/.test(v), label: t(lang, "pwRuleNumber") },
  ];

  useEffect(() => {
    void (async () => {
      const j = await apiTry(apiGet<{ sessions: LoginSession[] }>("/api/me/login-history"));
      if (j) setSessions(j.sessions);
      setLoadingSessions(false);
    })();

    void (async () => {
      const j = await apiTry(apiGet<{ factors: MfaFactor[] }>("/api/me/mfa"));
      if (j) setMfaFactors(j.factors);
      setLoadingMfa(false);
    })();
  }, []);

  const mfaEnabled = mfaFactors.some((f) => f.status === "verified");

  const handleEnroll2FA = async () => {
    setMfaError(null);
    setMfaStep("enrolling");
    setMfaSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error || !data) {
        setMfaError(error?.message ?? "Enrollment failed");
        setMfaStep("idle");
        return;
      }
      setQrUri(data.totp.uri);
      setTotpSecret(data.totp.secret);
      setEnrollFactorId(data.id);
      setMfaStep("verifying");
    } catch {
      setMfaError("Enrollment failed");
      setMfaStep("idle");
    } finally {
      setMfaSaving(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!enrollFactorId || totpCode.length !== 6) return;
    setMfaError(null);
    setMfaSaving(true);
    try {
      const supabase = createClient();
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: enrollFactorId });
      if (cErr || !challenge) {
        setMfaError(cErr?.message ?? "Challenge failed");
        return;
      }
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: enrollFactorId,
        challengeId: challenge.id,
        code: totpCode,
      });
      if (vErr) {
        setMfaError(vErr.message);
        return;
      }
      setMfaFactors((prev) => [...prev, { id: enrollFactorId, status: "verified", createdAt: new Date().toISOString() }]);
      setMfaStep("idle");
      setQrUri(null);
      setTotpSecret(null);
      setTotpCode("");
      setEnrollFactorId(null);
    } catch {
      setMfaError("Verification failed");
    } finally {
      setMfaSaving(false);
    }
  };

  const handleDisable2FA = async () => {
    const factor = mfaFactors.find((f) => f.status === "verified");
    if (!factor) return;
    setMfaError(null);
    setMfaSaving(true);
    try {
      await apiFetch("/api/me/mfa", {
        method: "DELETE",
        body: { factorId: factor.id },
      });
      setMfaFactors((prev) => prev.filter((f) => f.id !== factor.id));
      setMfaStep("idle");
    } catch (err) {
      setMfaError(err instanceof ApiError ? err.message : "Failed to disable 2FA");
    } finally {
      setMfaSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    const parsed = passwordSchema.safeParse({ password, confirm });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setPwError(
        issue?.path[0] === "confirm"
          ? t(lang, "passwordMismatch")
          : issue?.message ?? "Invalid",
      );
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    setSaving(false);

    if (error) {
      setPwError(error.message);
      return;
    }

    setPwSuccess(true);
    setPassword("");
    setConfirm("");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-h2">{t(lang, "security")}</h2>

      {/* Change password */}
      <Surface variant="outline" padding="lg" className="space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="size-4 text-muted-foreground" />
          <h3 className="text-h5">{t(lang, "changePassword")}</h3>
        </div>

        <form onSubmit={(e) => void handleChangePassword(e)} className="max-w-sm space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="new-pw" className="text-eyebrow">
              {t(lang, "newPasswordLabel")}
            </label>
            <div className="relative">
              <Input
                id="new-pw"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPwSuccess(false); }}
                disabled={saving}
                className="pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="ease-chrome absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
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
                        pass ? "text-emerald-500" : "text-muted-foreground",
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

          <div className="space-y-1.5">
            <label htmlFor="confirm-pw" className="text-eyebrow">
              {t(lang, "confirmNewPasswordLabel")}
            </label>
            <Input
              id="confirm-pw"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setPwSuccess(false); }}
              disabled={saving}
            />
          </div>

          {pwError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {pwError}
            </div>
          )}

          {pwSuccess && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
              {t(lang, "passwordChanged")}
            </div>
          )}

          <Button type="submit" size="sm" disabled={saving || !password || !confirm}>
            {saving ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                {t(lang, "saving")}
              </>
            ) : (
              t(lang, "changePassword")
            )}
          </Button>
        </form>
      </Surface>

      {/* Two-Factor Authentication */}
      <Surface variant="outline" padding="lg" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" />
            <h3 className="text-h5">{t(lang, "twoFactor")}</h3>
          </div>
          {!loadingMfa && (
            <Badge
              variant={mfaEnabled ? "secondary" : "outline"}
              className={mfaEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}
            >
              {mfaEnabled ? t(lang, "twoFactorEnabled") : t(lang, "twoFactorDisabled")}
            </Badge>
          )}
        </div>
        <p className="text-meta">{t(lang, "twoFactorDesc")}</p>

        {loadingMfa ? (
          <div className="flex justify-center py-3">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : mfaStep === "idle" ? (
          mfaEnabled ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-4" />
                {t(lang, "twoFactorEnabled")}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => setMfaStep("disabling")}
              >
                <ShieldOff className="mr-1.5 size-3.5" />
                {t(lang, "disable2FA")}
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => void handleEnroll2FA()} disabled={mfaSaving}>
              {mfaSaving ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <ShieldCheck className="mr-1.5 size-3.5" />}
              {t(lang, "enable2FA")}
            </Button>
          )
        ) : mfaStep === "verifying" ? (
          <div className="space-y-4">
            {qrUri && (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-[var(--p-hair)] bg-white p-4">
                <p className="text-xs font-medium text-neutral-600">{t(lang, "scanQR")}</p>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUri)}`}
                  alt="2FA QR Code"
                  className="size-48"
                />
                {totpSecret && (
                  <code className="select-all rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-700">
                    {totpSecret}
                  </code>
                )}
              </div>
            )}
            <div className="max-w-xs space-y-2">
              <label className="text-eyebrow">
                {t(lang, "enterCode")}
              </label>
              <Input
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="font-mono tracking-widest"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => void handleVerify2FA()}
                  disabled={mfaSaving || totpCode.length !== 6}
                >
                  {mfaSaving ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
                  {t(lang, "verifyCode")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setMfaStep("idle"); setQrUri(null); setTotpSecret(null); setTotpCode(""); setMfaError(null); }}
                >
                  {t(lang, "cancel")}
                </Button>
              </div>
            </div>
          </div>
        ) : mfaStep === "disabling" ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <p className="text-xs text-destructive">{t(lang, "disable2FAConfirm")}</p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => void handleDisable2FA()}
                disabled={mfaSaving}
              >
                {mfaSaving ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
                {t(lang, "disable2FA")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setMfaStep("idle"); setMfaError(null); }}
                disabled={mfaSaving}
              >
                {t(lang, "cancel")}
              </Button>
            </div>
          </div>
        ) : null}

        {mfaError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {mfaError}
          </div>
        )}
      </Surface>

      {/* Login history */}
      <Surface variant="outline">
        <div className="flex items-center gap-2 border-b border-[var(--p-hair)] px-5 py-3">
          <History className="size-4 text-muted-foreground" />
          <h3 className="text-h5">{t(lang, "loginHistory")}</h3>
        </div>

        {loadingSessions ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-5 py-6 text-center text-sm text-muted-foreground">
            {t(lang, "noLoginHistory")}
          </div>
        ) : (
          <div className="divide-y divide-[var(--p-hair)]">
            {sessions.map((s) => {
              const device = parseDevice(s.userAgent);
              return (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    {device.isMobile ? (
                      <Smartphone className="size-4 text-muted-foreground" />
                    ) : (
                      <Monitor className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{device.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {t(lang, methodLabelKey(s.method))}
                      </Badge>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-meta">
                      {s.ipAddress && <span>{s.ipAddress}</span>}
                      <span>
                        {new Date(s.createdAt).toLocaleDateString(
                          getLocale(lang),
                          { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Surface>
    </div>
  );
}
