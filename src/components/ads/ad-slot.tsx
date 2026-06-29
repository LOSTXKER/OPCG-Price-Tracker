"use client";

import { usePathname } from "next/navigation";

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

  // House ad replaced by a neutral ad-space placeholder (เบส) — represents where
  // a network ad renders; the AdSense path lights up once ADSENSE_CLIENT is set.
  return (
    <div
      data-ad-placement={placement}
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-lg border border-dashed border-[var(--p-hair)] bg-muted/20 p-4 text-center",
        className
      )}
    >
      <span className="text-meta">{t(lang, "adSpace")}</span>
    </div>
  );
}
