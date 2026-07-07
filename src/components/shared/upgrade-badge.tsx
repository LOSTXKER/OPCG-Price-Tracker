"use client";

import { Crown, Lock, Sparkles } from "lucide-react";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import type {
  RequiredTier,
  TierFeatureKey,
} from "@/lib/tier-features";
import { cn } from "@/lib/utils";

type CommonProps = {
  /** Which feature triggered the lock — used to fill the upgrade dialog. */
  featureKey?: TierFeatureKey;
  /** Override required tier (defaults to the one in `TIER_FEATURES`). */
  tier?: RequiredTier;
  className?: string;
};

function TierIcon({
  tier,
  className,
}: {
  tier: RequiredTier;
  className?: string;
}) {
  return tier === "PRO_PLUS" ? (
    <Sparkles className={className} />
  ) : (
    <Crown className={className} />
  );
}

function getLabel(tier: RequiredTier) {
  return tier === "PRO_PLUS" ? "Pro+" : "Pro";
}

/**
 * Compact badge that opens the shared upgrade dialog when clicked.
 * Suitable for inline placement next to labels, table headers, etc.
 */
export function UpgradeBadge({
  featureKey,
  tier = "PRO",
  className,
}: CommonProps) {
  const { openUpgradeDialog } = useUpgradeDialog();
  const label = getLabel(tier);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openUpgradeDialog({
          featureKey: featureKey ?? "priceHistoryExtended",
          requiredTier: tier,
        });
      }}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary motion-base hover:bg-primary/20",
        className,
      )}
    >
      <TierIcon tier={tier} className="size-2.5" />
      {label}
    </button>
  );
}

/**
 * Wraps content with a dimmed overlay and a centered upgrade CTA.
 * Use for entire panels/cards that are locked.
 */
export function LockOverlay({
  children,
  locked,
  featureKey,
  tier = "PRO",
  className,
}: CommonProps & {
  children: React.ReactNode;
  locked: boolean;
}) {
  const { openUpgradeDialog } = useUpgradeDialog();
  const label = getLabel(tier);

  if (!locked) return <>{children}</>;
  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none select-none opacity-40">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openUpgradeDialog({
              featureKey: featureKey ?? "priceHistoryExtended",
              requiredTier: tier,
            });
          }}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm ring-1 ring-border/50 backdrop-blur-sm motion-base hover:bg-background"
        >
          <Lock className="size-3" />
          <TierIcon tier={tier} className="size-3" />
          {label}
        </button>
      </div>
    </div>
  );
}

/**
 * Inline pill with a lock icon. Use as a tag next to disabled toggles or
 * channel buttons (e.g. "LINE" channel) where space is tight.
 */
export function LockChip({
  featureKey,
  tier = "PRO",
  className,
}: CommonProps) {
  const { openUpgradeDialog } = useUpgradeDialog();
  const lang = useUIStore((s) => s.language);
  const label = getLabel(tier);
  const requiresKey = tier === "PRO_PLUS" ? "requiresProPlus" : "requiresPro";

  return (
    <button
      type="button"
      title={t(lang, requiresKey)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openUpgradeDialog({
          featureKey: featureKey ?? "priceHistoryExtended",
          requiredTier: tier,
        });
      }}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary motion-base hover:bg-primary/20",
        tier === "PRO_PLUS" &&
          "bg-primary/10 text-primary hover:bg-primary/20",
        className,
      )}
    >
      <Lock className="size-2.5" />
      <TierIcon tier={tier} className="size-2.5" />
      {label}
    </button>
  );
}

/**
 * Lock pill suitable for tab/period buttons (e.g. price chart period switcher).
 * Renders a styled `button` that opens the upgrade dialog while still
 * resembling a tab item in a horizontal group.
 */
export function LockTab({
  featureKey,
  tier = "PRO",
  className,
  children,
}: CommonProps & { children: React.ReactNode }) {
  const { openUpgradeDialog } = useUpgradeDialog();
  const lang = useUIStore((s) => s.language);

  return (
    <button
      type="button"
      title={t(lang, "upgradeToUnlock")}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openUpgradeDialog({
          featureKey: featureKey ?? "priceHistoryExtended",
          requiredTier: tier,
        });
      }}
      className={cn(
        "inline-flex cursor-pointer items-center gap-0.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums text-muted-foreground/60 motion-base hover:bg-primary/10 hover:text-primary",
        className,
      )}
    >
      {children}
      <Lock className="size-2.5" />
      <TierIcon tier={tier} className="size-2.5" />
    </button>
  );
}
