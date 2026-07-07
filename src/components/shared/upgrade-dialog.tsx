"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { Check, Crown, Sparkles } from "lucide-react";

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
import { t, type TranslationKey } from "@/lib/i18n";
import {
  TIER_FEATURES,
  type RequiredTier,
  type TierFeatureKey,
} from "@/lib/tier-features";
import { cn } from "@/lib/utils";

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
  const lang = useUIStore((s) => s.language);
  const { settings } = useSettings();
  const currentTier = settings?.tier ?? "FREE";
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

  const isProPlus = state.requiredTier === "PRO_PLUS";
  const titleText = isProPlus
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
          className="sm:max-w-md"
          aria-label={t(lang, "upgradeDialogProTitle")}
        >
          <DialogHeader className="items-center text-center">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-full",
                state.requiredTier === "PRO_PLUS"
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
              {t(lang, "upgradeDialogDescription")}
            </DialogDescription>
          </DialogHeader>

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
                      state.requiredTier === "PRO_PLUS"
                        ? "text-primary"
                        : "text-amber-600 dark:text-amber-400",
                    )}
                  />
                  <span>{t(lang, bKey)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-body-sm">
            <span className="text-meta">
              {t(lang, "upgradeDialogCurrentPlan")}
            </span>
            <span className="font-semibold">{currentTierLabel}</span>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={closeUpgradeDialog}
            >
              {t(lang, "upgradeDialogLater")}
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={closeUpgradeDialog}
            >
              <Link href="/pricing" className="flex items-center gap-1.5">
                {isProPlus ? (
                  <Sparkles className="size-3.5" />
                ) : (
                  <Crown className="size-3.5" />
                )}
                {t(lang, "upgradeDialogCta")}
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UpgradeDialogContext.Provider>
  );
}
