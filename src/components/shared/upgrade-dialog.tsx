"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { ArrowRight, Check, Crown, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUIStore } from "@/stores/ui-store";
import { useSettings } from "@/hooks/use-settings";
import { getLocale, t, type TranslationKey } from "@/lib/i18n";
import {
  effectiveTier,
  getLimits,
  resolveUpgradeTier,
  TIER_FEATURES,
  type RequiredTier,
  type TierFeatureKey,
} from "@/lib/billing";
import { cn } from "@/lib/utils";
import type { UserTier } from "@/generated/prisma/client";

export type OpenUpgradeDialogOptions = {
  /** Required: which feature triggered the dialog. */
  featureKey: TierFeatureKey;
  /**
   * Optional override of the required tier. Falls back to the tier defined
   * in `TIER_FEATURES` if omitted.
   */
  requiredTier?: RequiredTier;
  /** Override the default benefit list. */
  benefitKeys?: TranslationKey[];
  /** Override the auto-derived feature title. */
  titleKey?: TranslationKey;
};

type ResolvedDialogState = {
  open: boolean;
  featureKey: TierFeatureKey | null;
  requiredTier: RequiredTier;
  benefitKeys: TranslationKey[];
  titleKey: TranslationKey | null;
};

type UpgradeDialogContextValue = {
  openUpgradeDialog: (opts: OpenUpgradeDialogOptions) => void;
  closeUpgradeDialog: () => void;
};

const UpgradeDialogContext = createContext<UpgradeDialogContextValue | null>(
  null,
);

export function useUpgradeDialog(): UpgradeDialogContextValue {
  const ctx = useContext(UpgradeDialogContext);
  if (!ctx) {
    return {
      openUpgradeDialog: () => {
        if (typeof window !== "undefined") {
          window.location.href = "/pricing";
        }
      },
      closeUpgradeDialog: () => undefined,
    };
  }
  return ctx;
}

const INITIAL_STATE: ResolvedDialogState = {
  open: false,
  featureKey: null,
  requiredTier: "PRO",
  benefitKeys: [],
  titleKey: null,
};

function getTierLabel(tier: string): string {
  if (tier === "PRO_PLUS" || tier === "LIFETIME_PRO_PLUS") return "Pro+";
  if (tier === "PRO" || tier === "LIFETIME_PRO") return "Pro";
  return "Free";
}

export function UpgradeDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<ResolvedDialogState>(INITIAL_STATE);
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const lang = useUIStore((s) => s.language);
  const { settings } = useSettings();
  const rawTier = (settings?.tier ?? "FREE") as UserTier;
  const currentTier = effectiveTier(
    rawTier,
    settings?.tierExpiresAt ? new Date(settings.tierExpiresAt) : null,
  );
  const lifetimeUpgradeUnavailable =
    currentTier === "LIFETIME_PRO" ||
    currentTier === "LIFETIME_PRO_PLUS";
  const currentTierLabel = getTierLabel(currentTier);

  const openUpgradeDialog = useCallback((opts: OpenUpgradeDialogOptions) => {
    const def = TIER_FEATURES[opts.featureKey];
    setState({
      open: true,
      featureKey: opts.featureKey,
      requiredTier: opts.requiredTier ?? def.requiredTier,
      benefitKeys: opts.benefitKeys ?? def.benefitKeys,
      titleKey: opts.titleKey ?? def.titleKey,
    });
  }, []);

  const closeUpgradeDialog = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  const value = useMemo(
    () => ({ openUpgradeDialog, closeUpgradeDialog }),
    [openUpgradeDialog, closeUpgradeDialog],
  );

  const featureDef = state.featureKey
    ? TIER_FEATURES[state.featureKey]
    : null;
  const targetTier = featureDef?.limitKey
    ? resolveUpgradeTier(currentTier, state.requiredTier)
    : state.requiredTier;
  const targetTierLabel = getTierLabel(targetTier);
  const isProPlus = targetTier === "PRO_PLUS";
  const currentLimit = featureDef?.limitKey
    ? getLimits(currentTier)[featureDef.limitKey]
    : null;
  const targetLimit = featureDef?.limitKey
    ? getLimits(targetTier)[featureDef.limitKey]
    : null;
  const hasLimitDelta =
    !lifetimeUpgradeUnavailable &&
    typeof currentLimit === "number" &&
    typeof targetLimit === "number" &&
    currentLimit !== targetLimit;
  const formatLimit = (value: number) => {
    if (!Number.isFinite(value)) return t(lang, "upgradeDialogUnlimited");
    const localizedValue = value.toLocaleString(getLocale(lang));
    return featureDef?.limitFormatKey
      ? t(lang, featureDef.limitFormatKey).replace("{n}", localizedValue)
      : localizedValue;
  };
  const titleText = lifetimeUpgradeUnavailable
    ? t(lang, "upgradeDialogLifetimeTitle")
    : hasLimitDelta
      ? isProPlus
        ? t(lang, "upgradeDialogProPlusLimitTitle")
        : t(lang, "upgradeDialogProLimitTitle")
      : isProPlus
        ? t(lang, "upgradeDialogProPlusTitle")
        : t(lang, "upgradeDialogProTitle");

  return (
    <UpgradeDialogContext.Provider value={value}>
      {children}
      <Dialog
        open={state.open}
        onOpenChange={(open) => {
          if (!open) closeUpgradeDialog();
        }}
      >
        <DialogContent
          ref={dialogContentRef}
          initialFocus={dialogContentRef}
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md"
          aria-label={titleText}
        >
          <DialogHeader className="items-center text-center">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-full",
                targetTier === "PRO_PLUS"
                  ? "bg-primary/15 text-primary"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
              )}
            >
              {isProPlus ? (
                <Sparkles className="size-6" />
              ) : (
                <Crown className="size-6" />
              )}
            </div>
            <DialogTitle className="text-h4">{titleText}</DialogTitle>
            {state.titleKey && (
              <p className="text-meta">
                <span className="font-medium text-foreground">
                  {t(lang, "upgradeDialogFeatureLabel")}:
                </span>{" "}
                {t(lang, state.titleKey)}
              </p>
            )}
            <DialogDescription className="text-center">
              {t(
                lang,
                lifetimeUpgradeUnavailable
                  ? "upgradeDialogLifetimeDescription"
                  : hasLimitDelta
                    ? "upgradeDialogLimitDescription"
                    : "upgradeDialogDescription",
              )}
            </DialogDescription>
          </DialogHeader>

          {hasLimitDelta && currentLimit !== null && targetLimit !== null && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
              <p className="text-label text-center">
                {t(lang, "upgradeDialogLimitHeading")}
              </p>
              <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="min-w-0 rounded-lg bg-background/70 px-3 py-2.5 text-center">
                  <p className="text-meta truncate">{currentTierLabel}</p>
                  <p className="text-h4 tabular-nums">
                    {formatLimit(currentLimit)}
                  </p>
                  <p className="text-micro text-muted-foreground">
                    {t(lang, "upgradeDialogLimitCurrent")}
                  </p>
                </div>
                <ArrowRight className="size-5 shrink-0 text-primary" />
                <div className="min-w-0 rounded-lg bg-primary/10 px-3 py-2.5 text-center">
                  <p className="text-meta truncate text-primary">
                    {targetTierLabel}
                  </p>
                  <p className="text-h4 tabular-nums text-primary">
                    {formatLimit(targetLimit)}
                  </p>
                  <p className="text-micro text-primary">
                    {t(lang, "upgradeDialogLimitAfter")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {state.benefitKeys.length > 0 && (
            <ul className="space-y-1.5 rounded-lg border border-transparent dark:border-hair bg-muted/30 p-3">
              {state.benefitKeys.map((bKey) => (
                <li
                  key={bKey}
                  className="flex items-start gap-2 text-body-sm"
                >
                  <Check
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      targetTier === "PRO_PLUS"
                        ? "text-primary"
                        : "text-amber-600 dark:text-amber-400",
                    )}
                  />
                  <span>{t(lang, bKey)}</span>
                </li>
              ))}
            </ul>
          )}

          {!hasLimitDelta && (
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-body-sm">
              <span className="text-meta">
                {t(lang, "upgradeDialogCurrentPlan")}
              </span>
              <span className="font-semibold">{currentTierLabel}</span>
            </div>
          )}

          <DialogFooter className="sm:justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={closeUpgradeDialog}
            >
              {t(lang, "upgradeDialogLater")}
            </Button>
            {!lifetimeUpgradeUnavailable && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={closeUpgradeDialog}
                render={<Link href="/pricing" />}
              >
                {isProPlus ? (
                  <Sparkles className="size-3.5" />
                ) : (
                  <Crown className="size-3.5" />
                )}
                {t(lang, "upgradeDialogCta")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UpgradeDialogContext.Provider>
  );
}
