"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Crown } from "lucide-react";

import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { useTierLimits } from "@/hooks/use-tier-limits";
import { isAdExcludedRoute, ADSENSE_CLIENT, type AdPlacement } from "./placements";

/**
 * Tier + consent + route-gated ad container. See REDESIGN.md §3.6 / §5.6.
 *
 * - Renders ONLY for FREE users (PRO / PRO+ / Lifetime are ad-free).
 * - Never renders on commerce-critical / auth / admin routes.
 * - Returns `null` entirely when hidden (no reserved empty space).
 * - Today it renders a first-party **house ad** (Upgrade-to-Pro), which needs
 *   no consent. The AdSense network path is gated behind ADSENSE_CLIENT (env)
 *   + granted consent and stays dormant until configured.
 */
export function AdSlot({
  placement,
  className,
}: {
  placement: AdPlacement;
  className?: string;
}) {
  const pathname = usePathname() ?? "/";
  const { tier, loaded } = useTierLimits();
  const lang = useUIStore((s) => s.language);
  const consent = useUIStore((s) => s.adConsent);

  if (isAdExcludedRoute(pathname)) return null;
  // Avoid a flash before tier is known; only FREE users see ads.
  if (!loaded || tier !== "FREE") return null;

  // Network ads (AdSense) require both configuration and explicit consent.
  // Until then, every slot falls back to the house ad below.
  const canServeNetworkAds = Boolean(ADSENSE_CLIENT) && consent === "granted";
  void canServeNetworkAds; // network slot wiring lands when ADSENSE_CLIENT is set

  return (
    <Link
      href="/pricing"
      data-ad-placement={placement}
      className={cn(
        "group relative flex flex-col justify-center gap-1 overflow-hidden rounded-lg border border-[var(--p-hair)] bg-gradient-to-br from-secondary to-accent p-4 transition-colors hover:border-primary/40",
        className
      )}
    >
      <span className="absolute right-2 top-1.5 text-eyebrow text-muted-foreground/60">
        {t(lang, "adLabel")}
      </span>
      <span className="flex items-center gap-1.5 text-h5 text-foreground">
        <Crown className="size-4 text-primary" aria-hidden />
        {t(lang, "adUpgradeTitle")}
      </span>
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
        {t(lang, "upgradePlan")}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}
