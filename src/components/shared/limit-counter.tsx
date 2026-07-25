"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTierLimits } from "@/hooks/use-tier-limits";
import {
  getLimits,
  getTierFeature,
  isLifetime,
  resolveUpgradeTier,
  type TierFeatureKey,
  type TierKey,
} from "@/lib/billing";
import { getLocale, t, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

import { useUpgradeDialog } from "./upgrade-dialog";

type BaseProps = {
  current: number;
  max: number;
  className?: string;
};

type LimitCounterProps =
  | (BaseProps & {
      variant?: "badge";
      /** Visually hidden context for ratio-only badges. */
      label?: string;
      featureKey?: never;
    })
  | (BaseProps & {
      variant: "inline";
      label: string;
      featureKey?: never;
    })
  | (BaseProps & {
      variant: "meter";
      label: string;
      featureKey: TierFeatureKey;
    });

export type LimitPresentation = {
  percent: number;
  isUnlimited: boolean;
  isFull: boolean;
  isHigh: boolean;
};

export function getLimitPresentation(
  current: number,
  max: number,
): LimitPresentation {
  const isUnlimited = !Number.isFinite(max);
  const rawPercent =
    isUnlimited ? 0 : max === 0 ? 100 : (current / max) * 100;
  const percent = isUnlimited
    ? 0
    : Math.max(0, Math.min(100, rawPercent));
  const isFull = !isUnlimited && current >= max;
  const isHigh = !isUnlimited && !isFull && percent >= 80;
  return { percent, isUnlimited, isFull, isHigh };
}

export type LimitMeterTreatment = {
  showProgress: boolean;
  showUpgradePrompt: boolean;
  tone: "neutral" | "warning";
};

export function getLimitMeterTreatment(
  presentation: LimitPresentation,
): LimitMeterTreatment {
  const nearLimit = presentation.isHigh || presentation.isFull;

  return {
    showProgress: nearLimit,
    showUpgradePrompt: nearLimit,
    tone: nearLimit ? "warning" : "neutral",
  };
}

export function LimitCounter(props: LimitCounterProps) {
  const { current, max, className } = props;

  if (props.variant === "meter") {
    const { label, featureKey } = props;

    return (
      <LimitMeter
        current={current}
        max={max}
        className={className}
        label={label}
        featureKey={featureKey}
      />
    );
  }

  if (props.variant === "inline") {
    return (
      <InlineLimit
        current={current}
        max={max}
        label={props.label}
        className={className}
      />
    );
  }

  const { isUnlimited, isFull, isHigh } = getLimitPresentation(current, max);
  const ratioText = `${current}/${isUnlimited ? "∞" : max}`;
  const state = isUnlimited
    ? "unlimited"
    : isFull
      ? "full"
      : isHigh
        ? "high"
        : "normal";

  return (
    <span
      data-slot="limit-badge"
      data-limit-state={state}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        isFull || isHigh
          ? "bg-warning/10 text-warning"
          : "bg-muted text-muted-foreground",
        className,
      )}
    >
      {props.label ? (
        <>
          <span className="sr-only">
            {props.label} {ratioText}
          </span>
          <span aria-hidden>{ratioText}</span>
        </>
      ) : (
        ratioText
      )}
    </span>
  );
}

function InlineLimit({
  current,
  max,
  label,
  className,
}: BaseProps & { label: string }) {
  const lang = useUIStore((s) => s.language);
  const presentation = getLimitPresentation(current, max);
  const locale = getLocale(lang);

  return (
    <span
      data-slot="limit-inline"
      data-limit-state={
        presentation.isUnlimited
          ? "unlimited"
          : presentation.isFull
            ? "full"
            : presentation.isHigh
              ? "high"
              : "normal"
      }
      className={cn(
        "inline-flex flex-wrap items-baseline gap-x-1.5 text-meta",
        className,
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "tabular-nums",
          (presentation.isHigh || presentation.isFull) && "!text-warning",
        )}
      >
        {current.toLocaleString(locale)}/
        {presentation.isUnlimited ? "∞" : max.toLocaleString(locale)}
      </span>
    </span>
  );
}

const PLAN_LABEL_KEYS: Record<TierKey, TranslationKey> = {
  FREE: "freePlan",
  PRO: "proPlan",
  PRO_PLUS: "proPlusPlan",
};

function LimitMeter({
  current,
  max,
  label,
  featureKey,
  className,
}: BaseProps & {
  label: string;
  featureKey: TierFeatureKey;
}) {
  const lang = useUIStore((s) => s.language);
  const { tier, rawTier, loaded } = useTierLimits();
  const { openUpgradeDialog } = useUpgradeDialog();
  const presentation = getLimitPresentation(current, max);
  const treatment = getLimitMeterTreatment(presentation);
  const locale = getLocale(lang);
  const currentText = current.toLocaleString(locale);
  const maxText = presentation.isUnlimited
    ? t(lang, "usageUnlimited")
    : max.toLocaleString(locale);

  const feature = getTierFeature(featureKey);
  const targetTier = resolveUpgradeTier(tier, feature.requiredTier);
  const targetLimit = feature.limitKey
    ? getLimits(targetTier)[feature.limitKey]
    : max;
  const targetPlanName = t(lang, PLAN_LABEL_KEYS[targetTier]);
  const targetLimitText = Number.isFinite(targetLimit)
    ? targetLimit.toLocaleString(locale)
    : t(lang, "usageUnlimited");
  const canUpgrade =
    loaded &&
    !isLifetime(rawTier) &&
    Number.isFinite(max) &&
    targetLimit > max;
  const showUpgrade = canUpgrade && treatment.showUpgradePrompt;

  if (!loaded) {
    return (
      <div
        aria-hidden
        className={cn("flex min-h-8 items-center gap-2", className)}
      >
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3.5 w-12" />
      </div>
    );
  }

  return (
    <div
      data-slot="limit-meter"
      data-limit-feature={featureKey}
      data-limit-state={
        presentation.isUnlimited
          ? "unlimited"
          : presentation.isFull
            ? "full"
            : presentation.isHigh
              ? "high"
              : "normal"
      }
      className={cn(
        "flex min-h-8 flex-wrap items-center gap-x-2 gap-y-1",
        className,
      )}
    >
      <span className="text-meta text-foreground/75">{label}</span>
      <span
        className={cn(
          "text-meta tabular-nums",
          treatment.tone === "warning" && "!text-warning",
        )}
      >
        {presentation.isUnlimited
          ? `${currentText} · ${maxText}`
          : `${currentText}/${maxText}`}
      </span>

      {treatment.showProgress && (
        <div
          className="h-1 w-16 overflow-hidden rounded-full bg-secondary sm:w-20"
          aria-hidden
        >
          <div
            className="h-full rounded-full bg-warning motion-base"
            style={{ width: `${presentation.percent}%` }}
          />
        </div>
      )}

      {showUpgrade && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto min-h-11 shrink-0 px-2 text-muted-foreground hover:text-foreground sm:min-h-9"
          onClick={() => openUpgradeDialog({ featureKey })}
          aria-label={t(lang, "quotaUpgradeAria")
            .replace("{plan}", targetPlanName)
            .replace("{max}", targetLimitText)}
        >
          {t(
            lang,
            presentation.isFull ? "quotaIncreaseLimit" : "viewPlans",
          )}
        </Button>
      )}
    </div>
  );
}
