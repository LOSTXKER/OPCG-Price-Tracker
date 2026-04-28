"use client";

import { cn } from "@/lib/utils";
import type { Language } from "@/lib/i18n";
import {
  getTierLabel,
  type RankTier,
} from "@/lib/honey/rank-tiers";
import { RankTierIcon } from "@/components/shared/rank-icon";
import { useRankTiers } from "@/hooks/use-rank-tiers";
import type { HoneyLevel } from "../types";

/**
 * Popup body for the Rank card guide — list of tier thresholds + lifetime total.
 * The trigger and Popover chrome live in the parent stat card.
 *
 * Tiers are admin-editable (see /admin/honey/ranks); the list is loaded
 * on demand via `useRankTiers` and falls back to defaults during the
 * first render so the UI never flashes empty.
 */
export function RankGuideContent({
  lang,
  level,
  lifetimeEarned,
}: {
  lang: Language;
  level: HoneyLevel | null;
  lifetimeEarned: number;
}) {
  const { tiers } = useRankTiers();
  const currentLevel = level?.level ?? 0;
  const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold);

  return (
    <>
      <p className="mb-2 text-xs font-semibold text-foreground">
        {lang === "TH" ? "ระดับแรงค์" : lang === "JP" ? "ランク一覧" : "Rank Tiers"}
      </p>
      <div className="space-y-1.5">
        {sorted.map((tier) => (
          <TierRow
            key={tier.level}
            tier={tier}
            lang={lang}
            active={tier.level === currentLevel}
            reached={tier.level <= currentLevel}
          />
        ))}
      </div>
      <div className="mt-2 border-t pt-2 text-meta">
        {lang === "TH"
          ? `สะสมทั้งหมด: ${lifetimeEarned.toLocaleString()} pt`
          : lang === "JP"
            ? `累計: ${lifetimeEarned.toLocaleString()} pt`
            : `Lifetime: ${lifetimeEarned.toLocaleString()} pt`}
      </div>
    </>
  );
}

function TierRow({
  tier,
  lang,
  active,
  reached,
}: {
  tier: RankTier;
  lang: Language;
  active: boolean;
  reached: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1 text-xs",
        active && "bg-primary/10 font-semibold text-primary",
        !active && reached && "text-foreground",
        !reached && "text-muted-foreground",
      )}
    >
      {tier.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tier.imageUrl}
          alt=""
          className="size-3.5 shrink-0 rounded object-contain"
        />
      ) : (
        <RankTierIcon
          name={tier.iconName}
          className="size-3.5 shrink-0"
          style={!active && reached && tier.color ? { color: tier.color } : undefined}
        />
      )}
      <span className="flex-1">{getTierLabel(tier, lang)}</span>
      <span className="tabular-nums">{tier.threshold.toLocaleString()} pt</span>
    </div>
  );
}
