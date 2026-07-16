"use client";

import { Check, Globe, Lock, Mail, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/stores/ui-store";
import { useSettings } from "@/hooks/use-settings";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  currencySymbol,
  formatJpy,
  jpyToDisplayValue,
} from "@/lib/utils/currency";

export type AlertDirection = "ABOVE" | "BELOW";
export type AlertChannel = "EMAIL" | "PUSH" | "LINE";

export type AlertFormValue = {
  direction: AlertDirection;
  /** One or more channels — multi-select. Must contain at least one entry. */
  channels: AlertChannel[];
  /** Display-currency string (already converted from JPY when editing) */
  target: string;
};

export type AlertFormBodyProps = {
  value: AlertFormValue;
  onChange: (value: AlertFormValue) => void;
  /** Market price in JPY (shown as a hint under the input) */
  currentPriceJpy?: number | null;
  error?: string | null;
  submitting: boolean;
  onSubmit: () => void;
  submitLabel: string;
};

export function AlertFormBody({
  value,
  onChange,
  currentPriceJpy,
  error,
  submitting,
  onSubmit,
  submitLabel,
}: AlertFormBodyProps) {
  const lang = useUIStore((s) => s.language);
  const currency = useUIStore((s) => s.currency);
  const { settings } = useSettings();
  const tier = settings?.tier ?? "FREE";
  const isPro =
    tier === "PRO" ||
    tier === "PRO_PLUS" ||
    tier === "LIFETIME_PRO" ||
    tier === "LIFETIME_PRO_PLUS";
  const { openUpgradeDialog } = useUpgradeDialog();

  const symbol = currencySymbol(currency);
  const placeholder =
    currentPriceJpy != null
      ? Math.round(jpyToDisplayValue(currentPriceJpy, currency)).toString()
      : "";

  const setDirection = (direction: AlertDirection) => onChange({ ...value, direction });
  const setTarget = (target: string) => onChange({ ...value, target });

  const toggleChannel = (channel: AlertChannel) => {
    const has = value.channels.includes(channel);
    let next: AlertChannel[];
    if (has) {
      next = value.channels.filter((c) => c !== channel);
      // Don't let the user end up with zero channels — they need at least one.
      if (next.length === 0) return;
    } else {
      next = [...value.channels, channel];
    }
    onChange({ ...value, channels: next });
  };

  const onPickLine = () => {
    if (!isPro) {
      openUpgradeDialog({ featureKey: "lineAlerts" });
      return;
    }
    toggleChannel("LINE");
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-label">{t(lang, "whenPriceGoes")}</p>
        <div className="grid grid-cols-2 gap-1.5">
          <DirectionPill
            active={value.direction === "BELOW"}
            tone="down"
            label={t(lang, "whenBelow")}
            onClick={() => setDirection("BELOW")}
          />
          <DirectionPill
            active={value.direction === "ABOVE"}
            tone="up"
            label={t(lang, "whenAbove")}
            onClick={() => setDirection("ABOVE")}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-label">{t(lang, "targetPrice")}</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {symbol}
          </span>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            placeholder={placeholder}
            value={value.target}
            onChange={(e) => setTarget(e.target.value)}
            className="h-9 pl-7"
          />
        </div>
        {currentPriceJpy != null && (
          <p className="mt-1 text-meta text-muted-foreground/70">
            {t(lang, "marketPrice")}: {formatJpy(currentPriceJpy)}
          </p>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <p className="text-label">{t(lang, "notifyVia")}</p>
          <span className="text-meta text-muted-foreground/70">
            {t(lang, "selectMultiple")}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <ChannelPill
            icon={Mail}
            label={t(lang, "alertChannelEmail")}
            active={value.channels.includes("EMAIL")}
            onClick={() => toggleChannel("EMAIL")}
          />
          <ChannelPill
            icon={Globe}
            label={t(lang, "alertChannelWeb")}
            active={value.channels.includes("PUSH")}
            onClick={() => toggleChannel("PUSH")}
          />
          <ChannelPill
            icon={MessageCircle}
            label={t(lang, "alertChannelLine")}
            active={value.channels.includes("LINE")}
            locked={!isPro}
            onClick={onPickLine}
            title={!isPro ? t(lang, "requiresPro") : undefined}
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button className="mt-1 w-full" disabled={submitting} onClick={onSubmit}>
        {submitting ? t(lang, "saving") : submitLabel}
      </Button>
    </div>
  );
}

function DirectionPill({
  active,
  tone,
  label,
  onClick,
}: {
  active: boolean;
  tone: "up" | "down";
  label: string;
  onClick: () => void;
}) {
  const activeCls =
    tone === "up"
      ? "border-price-up/40 bg-price-up/10 text-price-up-on-soft"
      : "border-price-down/40 bg-price-down/10 text-price-down-on-soft";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 rounded-md border px-2 text-xs font-medium transition-all md:h-8",
        active
          ? activeCls
          : "border-border text-muted-foreground hover:border-hair",
      )}
    >
      {label}
    </button>
  );
}

function ChannelPill({
  icon: Icon,
  label,
  active,
  locked = false,
  onClick,
  title,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  locked?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        "relative inline-flex h-11 items-center justify-center gap-1 rounded-md border px-2 text-xs font-medium transition-all md:h-8",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-hair",
        locked && !active && "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10",
      )}
    >
      {locked && !active ? (
        <Lock className="size-3 text-amber-600 dark:text-amber-400" />
      ) : active ? (
        <Check className="size-3" />
      ) : (
        <Icon className="size-3" />
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}
