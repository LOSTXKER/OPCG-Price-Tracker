"use client";

import { useCallback, useRef, useState } from "react";
import {
  CircleAlert,
  CircleCheck,
  Globe,
  Hexagon,
  Mail,
  MessageCircle,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { clientEnv } from "@/lib/env";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useTierLimits } from "@/hooks/use-tier-limits";
import { UpgradeBadge } from "@/components/shared/upgrade-badge";
import type { TranslationKey } from "@/lib/i18n";
import type { SettingsData } from "./profile-types";

// ---------------------------------------------------------------------------
// Toggle switch
// ---------------------------------------------------------------------------
function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
        checked ? "bg-primary" : "bg-muted",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <span
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-background shadow ring-1 ring-border/10 transition-transform",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Channel toggle row (icon + label + toggle)
// ---------------------------------------------------------------------------
function ChannelToggle({
  icon: Icon,
  label,
  checked,
  onChange,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("size-3.5", checked ? "text-foreground" : "text-muted-foreground/50")} />
      <span className={cn("text-xs", checked ? "text-foreground" : "text-muted-foreground/50")}>{label}</span>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
type Props = {
  settings: SettingsData;
  onReload: () => void;
};

type NotifType = {
  id: string;
  labelKey: TranslationKey;
  descKey: TranslationKey;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  emailField: keyof SettingsData;
  webField: keyof SettingsData;
  lineField: keyof SettingsData;
};

const NOTIF_TYPES: NotifType[] = [
  {
    id: "price",
    labelKey: "notifyPriceAlerts",
    descKey: "notifyPriceAlertsDesc",
    icon: TrendingUp,
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/10",
    emailField: "notifyPriceEmail",
    webField: "notifyPriceWeb",
    lineField: "notifyPriceLine",
  },
  {
    id: "market",
    labelKey: "notifyMarketplace",
    descKey: "notifyMarketplaceDesc",
    icon: ShoppingBag,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10",
    emailField: "notifyMarketEmail",
    webField: "notifyMarketWeb",
    lineField: "notifyMarketLine",
  },
  {
    id: "honey",
    labelKey: "notifyHoneyRaffle",
    descKey: "notifyHoneyRaffleDesc",
    icon: Hexagon,
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/10",
    emailField: "notifyHoneyEmail",
    webField: "notifyHoneyWeb",
    lineField: "notifyHoneyLine",
  },
  {
    id: "digest",
    labelKey: "notifyDigest",
    descKey: "notifyDigestDesc",
    icon: Mail,
    iconColor: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-500/10",
    emailField: "notifyDigestEmail",
    webField: "notifyDigestWeb",
    lineField: "notifyDigestLine",
  },
];

export function SectionNotifications({ settings, onReload }: Props) {
  const lang = useUIStore((s) => s.language);
  const { limits } = useTierLimits();
  const lineLockedByTier = !limits.lineAlerts;
  const digestLockedByTier = !limits.weeklyDigest;

  const [state, setState] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const nt of NOTIF_TYPES) {
      init[nt.emailField] = settings[nt.emailField] as boolean;
      init[nt.webField] = settings[nt.webField] as boolean;
      init[nt.lineField] = settings[nt.lineField] as boolean;
    }
    return init;
  });

  const [savingField, setSavingField] = useState<string | null>(null);
  const [savedField, setSavedField] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const patchField = useCallback(async (field: string, value: boolean) => {
    const prev = state[field];
    setState((s) => ({ ...s, [field]: value }));
    setSavingField(field);
    setSavedField(null);
    setErrorField(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        setSavedField(field);
      } else {
        setState((s) => ({ ...s, [field]: prev }));
        setErrorField(field);
      }
    } catch {
      setState((s) => ({ ...s, [field]: prev }));
      setErrorField(field);
    } finally {
      setSavingField(null);
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(() => { setSavedField(null); setErrorField(null); }, 2000);
    }
  }, [state]);

  const handleConnectLine = () => {
    const s = crypto.randomUUID();
    sessionStorage.setItem("line_state", s);
    const clientId = clientEnv().NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID;
    const redirectUri = `${window.location.origin}/api/line/callback`;
    window.location.href = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${s}&scope=profile%20openid&bot_prompt=aggressive`;
  };

  const handleDisconnectLine = async () => {
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineAlerts: false }),
      });
      onReload();
    } catch { /* ignore */ }
  };

  function Feedback({ field }: { field: string }) {
    if (errorField === field) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive animate-in fade-in zoom-in-95">
          <CircleAlert className="size-3" />
          {t(lang, "saveFailed")}
        </span>
      );
    }
    if (savedField === field) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in zoom-in-95">
          <CircleCheck className="size-3" />
          {t(lang, "saved")}
        </span>
      );
    }
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">{t(lang, "notifications")}</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">{t(lang, "notificationsSubtitle")}</p>
      </div>

      {/* LINE connection banner */}
      {!settings.lineConnected && (
        <div className="flex items-center justify-between rounded-xl border border-green-500/20 bg-green-500/5 px-5 py-3">
          <div className="flex items-center gap-3">
            <MessageCircle className="size-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-muted-foreground">{t(lang, "lineNotConnected")}</span>
          </div>
          <Button size="sm" variant="outline" onClick={handleConnectLine} className="gap-1.5 shrink-0">
            <MessageCircle className="size-3" />
            {t(lang, "connectLine")}
          </Button>
        </div>
      )}

      {settings.lineConnected && (
        <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card px-5 py-3">
          <div className="flex items-center gap-3">
            <MessageCircle className="size-4 text-green-600 dark:text-green-400" />
            <Badge variant="secondary" className="text-xs text-green-600 dark:text-green-400">
              {t(lang, "lineConnected")}
            </Badge>
          </div>
          <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-destructive" onClick={() => void handleDisconnectLine()}>
            {t(lang, "disconnectLine")}
          </Button>
        </div>
      )}

      {/* Notification type cards */}
      <div className="space-y-3">
        {NOTIF_TYPES.map((nt) => {
          const isDigest = nt.id === "digest";
          const cardLocked = isDigest && digestLockedByTier;
          return (
            <div key={nt.id} className={cn("rounded-xl bg-card p-5", cardLocked && "opacity-50")}>
              <div className="flex items-start gap-3">
                <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg mt-0.5", nt.iconBg)}>
                  <nt.icon className={cn("size-4", nt.iconColor)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{t(lang, nt.labelKey)}</h3>
                    {cardLocked && <UpgradeBadge />}
                    <Feedback field={nt.emailField} />
                    <Feedback field={nt.webField} />
                    <Feedback field={nt.lineField} />
                  </div>
                  <p className="text-xs text-muted-foreground leading-tight mt-0.5">{t(lang, nt.descKey)}</p>

                  <div className="flex items-center gap-5 mt-3">
                    <ChannelToggle
                      icon={Mail}
                      label={t(lang, "channelEmail")}
                      checked={!!state[nt.emailField]}
                      disabled={cardLocked || savingField === nt.emailField}
                      onChange={(v) => void patchField(nt.emailField, v)}
                    />
                    <ChannelToggle
                      icon={Globe}
                      label={t(lang, "channelWeb")}
                      checked={!!state[nt.webField]}
                      disabled={cardLocked || savingField === nt.webField}
                      onChange={(v) => void patchField(nt.webField, v)}
                    />
                    <div className="flex items-center gap-1">
                      <ChannelToggle
                        icon={MessageCircle}
                        label={t(lang, "channelLine")}
                        checked={!!state[nt.lineField]}
                        disabled={lineLockedByTier || cardLocked || !settings.lineConnected || savingField === nt.lineField}
                        onChange={(v) => void patchField(nt.lineField, v)}
                      />
                      {lineLockedByTier && !cardLocked && <UpgradeBadge />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
