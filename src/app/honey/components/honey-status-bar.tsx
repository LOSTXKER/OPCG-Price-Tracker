"use client";

import { Flame, Sparkles, Ticket } from "lucide-react";

import { t, type Language } from "@/lib/i18n";
import {
  findTierByLevel,
  getTierLabel,
  type RankTier,
} from "@/lib/honey/rank-tiers";
import { RankTierIcon } from "@/components/shared/rank-icon";
import { useRankTiers } from "@/hooks/use-rank-tiers";
import { getStreakReward } from "@/lib/honey/streak";
import type { HoneyLevel, ActiveEvent, ShopItem } from "../types";
import { RankGuideContent } from "./rank-info-popover";
import { HowToEarnGuideContent } from "./how-to-earn-popover";
import { HoneyStatCard, HoneyCardDetail } from "./stat-card";
import { RankProgress } from "./rank-progress";
import { TicketGuideContent, StreakGuideContent } from "./guide-contents";

function streakDayText(lang: Language, n: number) {
  if (lang === "TH") return `${n} วัน`;
  if (lang === "JP") return `${n}日`;
  return n === 1 ? `${n} day` : `${n} days`;
}

export type StatusProps = {
  lang: Language;
  points: number;
  ticketBalance: number;
  ticketsUsedThisMonth: number;
  streak: number;
  level: HoneyLevel | null;
  lifetimeEarned: number;
  activeEvent: ActiveEvent | null;
  /**
   * Honey multiplier granted by the user's subscription tier (e.g. PRO=2,
   * PRO_PLUS=3). Defaults to 1 (FREE / lapsed). Used to render a separate
   * "Plan Nx" pill alongside the seasonal-event pill so users see what their
   * plan contributes to earnings.
   */
  tierMultiplier?: number;
  shopItems?: ShopItem[];
};

function useStatusData(props: StatusProps, tiers: RankTier[]) {
  const { level, lang } = props;
  const currentLevel = level?.level ?? 0;
  const nextThreshold = level?.nextThreshold ?? null;
  const currentMin = level?.currentMin ?? 0;
  const isMaxRank = nextThreshold === null;

  const currentTier = findTierByLevel(tiers, currentLevel);
  const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold);
  const currentIdx = sorted.findIndex((t) => t.level === currentTier.level);
  const nextTier = currentIdx >= 0 ? sorted[currentIdx + 1] : undefined;

  const currentLabel = getTierLabel(currentTier, lang);
  const nextLabel = nextTier ? getTierLabel(nextTier, lang) : undefined;
  const nextBonus = nextTier?.levelUpBonus ?? 0;
  const iconName = currentTier.iconName;
  const accent = currentTier.color ?? null;
  const iconImage = currentTier.imageUrl ?? null;

  return {
    currentLevel,
    nextThreshold,
    currentMin,
    isMaxRank,
    currentLabel,
    nextLabel,
    nextBonus,
    iconName,
    accent,
    iconImage,
  };
}

export function HoneyStatusBar(props: StatusProps) {
  const {
    lang, points, ticketBalance, ticketsUsedThisMonth, streak, level, lifetimeEarned,
    activeEvent, tierMultiplier = 1,
  } = props;
  const { tiers } = useRankTiers();
  const {
    nextThreshold, currentMin,
    currentLabel, nextLabel, nextBonus,
    iconName, accent, iconImage,
  } = useStatusData(props, tiers);

  const streakReward = getStreakReward(streak);

  return (
    <div className="space-y-3">
      {/* Multiplier pills — render plan and event multipliers separately so
          users can see exactly what their subscription contributes vs. the
          time-bound seasonal event. Both stack at earn time. */}
      {(tierMultiplier > 1 || activeEvent) && (
        <div className="flex flex-wrap items-center gap-2">
          {tierMultiplier > 1 && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/5 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Sparkles className="size-3.5" />
              <span>
                {tierMultiplier}x{" "}
                {t(lang, "honeyPlanBonus")}
              </span>
            </div>
          )}
          {activeEvent && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles className="size-3.5" />
              <span>
                {activeEvent.honeyMultiplier}x{" "}
                {t(lang, "eventBonusBadge")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 4 equal-width stat cards. Honey is differentiated by larger value, not by color tint. */}
      <div className="grid grid-cols-2 items-stretch gap-3 lg:grid-cols-4">
        <HoneyStatCard
          icon={<span className="text-base leading-none">🍯</span>}
          label={t(lang, "honeyLabel")}
          value={points.toLocaleString()}
          emphasis="honey"
          detail={
            <HoneyCardDetail
              lang={lang}
              lifetimeEarned={lifetimeEarned}
            />
          }
          ariaLabel={t(lang, "honeyBalanceTooltip")}
          guideContent={<HowToEarnGuideContent lang={lang} />}
        />

        <HoneyStatCard
          icon={<Ticket className="size-4" />}
          label={t(lang, "ticketLabel")}
          value={ticketBalance.toLocaleString()}
          detail={
            <p className="text-meta tabular-nums">
              {t(lang, "ticketUsedThisMonth")}: {ticketsUsedThisMonth}
            </p>
          }
          ariaLabel={t(lang, "ticketTooltip")}
          guideContent={<TicketGuideContent lang={lang} />}
        />

        <HoneyStatCard
          icon={<Flame className="size-4" />}
          label={t(lang, "streakLabel")}
          value={streakDayText(lang, streak)}
          detail={
            <p className="text-meta tabular-nums">
              <span className="mr-0.5">{t(lang, "streakCurrentEarnLabel")}</span>
              <span className="font-semibold text-foreground">
                +{streakReward} 🍯{t(lang, "streakPerDaySuffix")}
              </span>
            </p>
          }
          ariaLabel={t(lang, "streakTooltip")}
          guideContent={<StreakGuideContent lang={lang} />}
        />

        <HoneyStatCard
          icon={
            iconImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={iconImage} alt="" className="size-5 rounded object-contain" />
            ) : (
              <RankTierIcon
                name={iconName}
                className="size-4"
                style={accent ? { color: accent } : undefined}
              />
            )
          }
          label={t(lang, "rankLabel")}
          value={currentLabel}
          detail={
            <RankProgress
              lang={lang}
              lifetimeEarned={lifetimeEarned}
              currentMin={currentMin}
              nextThreshold={nextThreshold}
              nextLabel={nextLabel}
              nextBonus={nextBonus}
              accent={accent}
            />
          }
          ariaLabel={t(lang, "rankTooltip")}
          guideContent={<RankGuideContent lang={lang} level={level} lifetimeEarned={lifetimeEarned} />}
        />
      </div>

      {/* Mobile-only rank progress. The stat cards drop their detail below sm,
          which would otherwise hide the single most motivating signal — how
          close the user is to the next rank and the honey bonus they unlock.
          Surface a compact bar here (sm:hidden) so it survives the declutter. */}
      {nextThreshold !== null && (
        <div className="sm:hidden">
          <RankProgress
            lang={lang}
            lifetimeEarned={lifetimeEarned}
            currentMin={currentMin}
            nextThreshold={nextThreshold}
            nextLabel={nextLabel}
            nextBonus={nextBonus}
            accent={accent}
          />
        </div>
      )}
    </div>
  );
}
