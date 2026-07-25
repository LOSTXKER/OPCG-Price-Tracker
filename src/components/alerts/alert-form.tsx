"use client";

import { Check, Globe, Lock, Mail, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/stores/ui-store";
import { useTierLimits } from "@/hooks/use-tier-limits";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  currencySymbol,
  formatJpyAmount,
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
  /** Market price in JPY (formatted to the user's display currency in the hint) */
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
  const { limits } = useTierLimits();
  const canUseLineAlerts = limits.lineAlerts;
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
    if (!canUseLineAlerts) {
      openUpgradeDialog({ featureKey: "lineAlerts" });
      return;
    }
    toggleChannel("LINE");
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-label">{t(lang, "whenPriceGoes")}</p>
        <div
          role="radiogroup"
          aria-label={t(lang, "whenPriceGoes")}
          className="grid grid-cols-2 gap-1.5"
        >
          <DirectionPill
            value="BELOW"
            selectedValue={value.direction}
            tone="down"
            label={t(lang, "whenBelow")}
            onSelect={setDirection}
          />
          <DirectionPill
            value="ABOVE"
            selectedValue={value.direction}
            tone="up"
            label={t(lang, "whenAbove")}
            onSelect={setDirection}
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
            {t(lang, "marketPrice")}: {formatJpyAmount(currentPriceJpy, currency)}
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
            locked={!canUseLineAlerts}
            onClick={onPickLine}
            title={!canUseLineAlerts ? t(lang, "requiresPro") : undefined}
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
  value,
  selectedValue,
  tone,
  label,
  onSelect,
}: {
  value: AlertDirection;
  selectedValue: AlertDirection;
  tone: "up" | "down";
  label: string;
  onSelect: (value: AlertDirection) => void;
}) {
  const active = value === selectedValue;
  const activeCls =
    tone === "up"
      ? "border-price-up/40 bg-price-up/10 text-price-up-on-soft"
      : "border-price-down/40 bg-price-down/10 text-price-down-on-soft";
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      tabIndex={active ? 0 : -1}
      data-direction={value}
      onClick={() => onSelect(value)}
      onKeyDown={(event) => {
        if (
          event.key !== "ArrowLeft" &&
          event.key !== "ArrowRight" &&
          event.key !== "ArrowUp" &&
          event.key !== "ArrowDown" &&
          event.key !== "Home" &&
          event.key !== "End"
        ) {
          return;
        }

        event.preventDefault();
        const nextValue: AlertDirection =
          event.key === "ArrowLeft" ||
          event.key === "ArrowUp" ||
          event.key === "Home"
            ? "BELOW"
            : "ABOVE";
        const nextButton = event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(
          `[data-direction="${nextValue}"]`,
        );
        onSelect(nextValue);
        nextButton?.focus();
      }}
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
