"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  Coins,
  Flame,
  HelpCircle,
  Info,
  Shield,
  Sparkles,
  Star,
  Crown,
  Ticket,
  Trophy,
} from "lucide-react";
import { Popover } from "@base-ui/react/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { t, type Language } from "@/lib/i18n";
import type { HoneyLevel, ActiveEvent, ShopItem } from "../types";
import { RankGuideContent } from "./rank-info-popover";
import { HowToEarnGuideContent } from "./how-to-earn-popover";
import { NextGoalHint } from "./next-goal-hint";

const RANK_LABELS: Record<string, Record<number, string>> = {
  TH: { 0: "มือใหม่", 1: "บรอนซ์", 2: "ซิลเวอร์", 3: "โกลด์", 4: "ไดมอนด์" },
  EN: { 0: "Newbie", 1: "Bronze", 2: "Silver", 3: "Gold", 4: "Diamond" },
  JP: { 0: "ニュービー", 1: "ブロンズ", 2: "シルバー", 3: "ゴールド", 4: "ダイヤモンド" },
};

const RANK_ICONS = [Shield, Shield, Star, Crown, Trophy] as const;

const STREAK_TIERS = [
  { min: 1, max: 6, mult: 1, pts: 10 },
  { min: 7, max: 29, mult: 2, pts: 20 },
  { min: 30, max: Infinity, mult: 3, pts: 30 },
] as const;

function getStreakReward(streak: number) {
  if (streak >= 30) return 30;
  if (streak >= 7) return 20;
  return 10;
}

function getStreakTierIdx(streak: number) {
  if (streak >= 30) return 2;
  if (streak >= 7) return 1;
  return 0;
}

function streakDayText(lang: Language, n: number) {
  if (lang === "TH") return `${n} วัน`;
  if (lang === "JP") return `${n}日`;
  return n === 1 ? `${n} day` : `${n} days`;
}

function dayLabel(lang: Language, n: number) {
  if (lang === "TH") return `${n} วัน`;
  if (lang === "JP") return `${n}日`;
  return n === 1 ? `${n} day` : `${n} days`;
}

function perDayUnit(lang: Language) {
  if (lang === "TH") return "/วัน";
  if (lang === "JP") return "/日";
  return "/day";
}

/**
 * Localized "X more days unlocks +Y honey" hint. Phrased as a complete clause
 * (with a verb instead of an arrow) so it reads naturally next to the current
 * per-day reward — "Earn +10 🍯/day  [5 more days for +20 🍯/day]". The `/day`
 * unit is preserved on both pieces to make the comparison unambiguous.
 */
function nextTierHint(streak: number, lang: Language): string | null {
  if (streak >= 30) return null;
  const target = streak >= 7 ? 30 : 7;
  const nextPts = streak >= 7 ? 30 : 20;
  const remaining = target - streak;
  if (lang === "TH") return `อีก ${remaining} วัน +${nextPts} 🍯${perDayUnit(lang)}`;
  if (lang === "JP") return `あと${remaining}日で +${nextPts} 🍯${perDayUnit(lang)}`;
  const dayWord = remaining === 1 ? "day" : "days";
  return `${remaining} more ${dayWord} for +${nextPts} 🍯${perDayUnit(lang)}`;
}

function currentEarnLabel(lang: Language): string {
  if (lang === "TH") return "รับ";
  if (lang === "JP") return "獲得";
  return "Earn";
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
  shopItems?: ShopItem[];
  canCheckin: boolean;
  checkinLoading: boolean;
  onCheckin: () => void;
};

function useStatusData(props: StatusProps) {
  const { level, lang } = props;
  const currentLevel = level?.level ?? 0;
  const nextThreshold = level?.nextThreshold ?? null;
  const currentMin = level?.currentMin ?? 0;
  const isMaxRank = nextThreshold === null;
  const rankLabels = RANK_LABELS[lang] ?? RANK_LABELS.EN;
  const RankIcon = RANK_ICONS[currentLevel] ?? Shield;

  return { currentLevel, nextThreshold, currentMin, isMaxRank, rankLabels, RankIcon };
}

/* ------------------------------------------------------------------ */
/*  Shared popover styles                                              */
/* ------------------------------------------------------------------ */

const POPOVER_POPUP_CLASS =
  "w-56 rounded-lg border bg-background p-3 shadow-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95";

const POPOVER_ARROW_CLASS =
  "size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] border bg-background data-[side=bottom]:top-1 data-[side=top]:-bottom-2.5";

/* ------------------------------------------------------------------ */
/*  Guide content for Ticket and Streak                                */
/* ------------------------------------------------------------------ */

/** Popup body for the Ticket card. Trigger + chrome are owned by the stat card. */
function TicketGuideContent({ lang }: { lang: Language }) {
  const earnMethods = [
    { icon: Coins, label: t(lang, "ticketMethodBuy") },
    { icon: Flame, label: t(lang, "ticketMethodFree") },
    { icon: ClipboardList, label: t(lang, "ticketMethodMission") },
  ];

  return (
    <>
      <p className="mb-2 text-xs font-semibold text-foreground">
        {t(lang, "raffleHowToGet")}
      </p>
      <div className="space-y-1.5">
        {earnMethods.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 rounded-md px-2 py-1 text-meta">
            <Icon className="size-3.5 shrink-0" />
            <span className="flex-1">{label}</span>
          </div>
        ))}
      </div>

      <p className="mb-2 mt-3 border-t pt-2 text-xs font-semibold text-foreground">
        {t(lang, "howToUseTicket")}
      </p>
      <div className="flex items-center gap-2 rounded-md px-2 py-1 text-meta">
        <Ticket className="size-3.5 shrink-0" />
        <span className="flex-1">{t(lang, "ticketUseRaffle")}</span>
      </div>
    </>
  );
}

/** Popup body for the Streak card — multiplier tier table. */
function StreakGuideContent({ lang }: { lang: Language }) {
  return (
    <>
      <p className="mb-2 text-xs font-semibold text-foreground">
        {t(lang, "streakInfoTitle")}
      </p>
      <div className="space-y-1.5">
        {STREAK_TIERS.map((tier, i) => (
          <div key={i} className="flex items-center gap-2 rounded-md px-2 py-1 text-xs">
            <span className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-black",
              i === 0 ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
            )}>
              {tier.mult}x
            </span>
            <span className="flex-1 text-muted-foreground">
              {i === 0 ? t(lang, "streakInfoStart") : `${dayLabel(lang, tier.min)}+`}
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              +{tier.pts} 🍯
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 border-t pt-2 text-meta">
        {t(lang, "streakInfoDesc")}
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Compact Stat Card                                                   */
/* ------------------------------------------------------------------ */

/**
 * Single shared layout for every stat tile. The whole card is the Popover trigger
 * (a real <button>) — clicking anywhere opens its detailed guide. The corner icon
 * is a decorative affordance only. Cards stay equal-width within the grid and use
 * the same 3-zone vertical layout (header → value → footer info).
 */
function HoneyStatCard({
  icon,
  iconClassName,
  tintClassName,
  label,
  labelClassName,
  value,
  valueClassName,
  detail,
  ariaLabel,
  guideContent,
  guideIcon,
}: {
  icon: React.ReactNode;
  iconClassName: string;
  tintClassName?: string;
  label: string;
  labelClassName?: string;
  value: React.ReactNode;
  valueClassName?: string;
  detail?: React.ReactNode;
  ariaLabel: string;
  guideContent: React.ReactNode;
  guideIcon?: React.ReactNode;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger
        render={(triggerProps) => <button type="button" {...triggerProps} aria-label={ariaLabel} />}
        className={cn(
          "group relative flex h-full w-full flex-col overflow-hidden rounded-xl border p-4 text-left",
          "cursor-pointer transition-colors hover:border-foreground/25 hover:bg-foreground/[0.02]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          tintClassName ?? "panel",
        )}
      >
        {/* Header: icon + eyebrow label */}
        <div className="flex items-center gap-2.5 pr-5">
          <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", iconClassName)}>
            {icon}
          </div>
          <p className={cn("text-eyebrow", labelClassName)}>{label}</p>
        </div>

        {/* Value: vertically centered in remaining space */}
        <div className="flex flex-1 items-center py-2.5">
          <p className={cn("text-h2 tabular-nums leading-none", valueClassName)}>{value}</p>
        </div>

        {/* Footer: secondary info — always pinned to card bottom */}
        {detail && <div className="mt-auto">{detail}</div>}

        {/* Decorative affordance — signals "tap for guide" without stealing the click */}
        {guideIcon && (
          <span
            aria-hidden
            className="pointer-events-none absolute right-2.5 top-2.5 inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors group-hover:text-foreground"
          >
            {guideIcon}
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" sideOffset={6} align="center" className="z-50">
          <Popover.Popup className={POPOVER_POPUP_CLASS}>
            {guideContent}
            <Popover.Arrow className={POPOVER_ARROW_CLASS} />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

/* ------------------------------------------------------------------ */
/*  Rank progress bar                                                   */
/* ------------------------------------------------------------------ */

function RankProgress({
  lang,
  lifetimeEarned,
  currentMin,
  nextThreshold,
  nextLabel,
}: {
  lang: Language;
  lifetimeEarned: number;
  currentMin: number;
  nextThreshold: number | null;
  nextLabel: string | undefined;
}) {
  if (nextThreshold === null) {
    return (
      <p className="text-meta tabular-nums">
        {lang === "TH" ? "ระดับสูงสุด" : lang === "JP" ? "最高ランク" : "Max rank"}
      </p>
    );
  }
  const span = Math.max(1, nextThreshold - currentMin);
  const filled = Math.min(span, Math.max(0, lifetimeEarned - currentMin));
  const pct = Math.round((filled / span) * 100);
  const remaining = Math.max(0, nextThreshold - lifetimeEarned);
  return (
    <div className="space-y-1.5">
      {/* Bar + numeric %: the % anchors the visual fill with a precise number */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
          {pct}%
        </span>
      </div>
      <p className="text-meta tabular-nums">
        {lang === "TH"
          ? `อีก ${remaining.toLocaleString()} pt → ${nextLabel ?? ""}`
          : lang === "JP"
            ? `あと ${remaining.toLocaleString()} ptで${nextLabel ?? ""}`
            : `${remaining.toLocaleString()} pt to ${nextLabel ?? "next rank"}`}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Header CTA: Check-in button                                         */
/* ------------------------------------------------------------------ */

/**
 * Compact check-in pill placed in the page header. When `canCheckin` is true the
 * button is filled primary with a one-shot ping ring to attract attention; otherwise
 * a soft "checked in" status pill is rendered to confirm completion.
 */
function HeaderCheckinButton({ lang, streak, canCheckin, checkinLoading, onCheckin }: {
  lang: Language; streak: number; canCheckin: boolean; checkinLoading: boolean; onCheckin: () => void;
}) {
  const [showPing, setShowPing] = useState(true);

  useEffect(() => {
    if (!canCheckin) return;
    const timer = setTimeout(() => setShowPing(false), 4000);
    return () => clearTimeout(timer);
  }, [canCheckin]);

  if (canCheckin) {
    return (
      <Button
        onClick={onCheckin}
        disabled={checkinLoading}
        size="sm"
        className="relative h-9 gap-1.5 bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
      >
        {showPing && (
          <span className="absolute -right-1 -top-1 flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
          </span>
        )}
        <Calendar className="size-3.5" />
        {t(lang, "dailyCheckin")}
        <span className="rounded bg-white/20 px-1.5 py-px text-xs font-bold tabular-nums">
          +{getStreakReward(streak)} 🍯
        </span>
      </Button>
    );
  }
  return (
    <div className="inline-flex h-9 items-center gap-1.5 rounded-md bg-price-up/10 px-3 text-xs font-medium text-price-up">
      <CheckCircle2 className="size-3.5" />
      {t(lang, "checkinDone")}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Banner                                                        */
/* ------------------------------------------------------------------ */

export function HoneyStatusBar(props: StatusProps) {
  const {
    lang, points, ticketBalance, ticketsUsedThisMonth, streak, level, lifetimeEarned, activeEvent,
    shopItems,
    canCheckin, checkinLoading, onCheckin,
  } = props;
  const {
    currentLevel, nextThreshold, currentMin,
    rankLabels, RankIcon,
  } = useStatusData(props);

  const tierIdx = getStreakTierIdx(streak);
  const streakReward = getStreakReward(streak);
  const tierHint = nextTierHint(streak, lang);
  const nextRankLabel = currentLevel + 1 < 5 ? rankLabels[currentLevel + 1] : undefined;

  return (
    <div className="space-y-4">
      {/* Action row: event badge + check-in CTA. Title/subtitle live in the
          page-level <PageHeader /> at app/honey/page.tsx. */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {activeEvent && (
          <div className="inline-flex h-9 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 text-xs font-bold text-primary">
            <Sparkles className="size-3.5" />
            <span>
              {activeEvent.honeyMultiplier}x{" "}
              {lang === "TH" ? "อีเวนต์โบนัส" : lang === "JP" ? "イベントボーナス" : "Event bonus"}
            </span>
          </div>
        )}
        <HeaderCheckinButton
          lang={lang}
          streak={streak}
          canCheckin={canCheckin}
          checkinLoading={checkinLoading}
          onCheckin={onCheckin}
        />
      </div>

      {/* Honey rebalance v2: tiny "next goal" hint that nudges the user
          toward the cheapest still-unaffordable shop item they're eligible
          for. Hidden when nothing is available (max-rank, empty shop, etc). */}
      {shopItems && shopItems.length > 0 && (
        <div className="-mt-2 flex flex-wrap">
          <NextGoalHint
            lang={lang}
            shopItems={shopItems}
            points={points}
            level={level}
          />
        </div>
      )}

      {/* 4 equal-width stat cards. Honey is differentiated by larger value, not by tint. */}
      <div className="grid grid-cols-2 items-stretch gap-3 lg:grid-cols-4">
        <HoneyStatCard
          icon={<span className="text-xl leading-none">🍯</span>}
          iconClassName="bg-primary/10"
          label={t(lang, "honeyLabel")}
          value={points.toLocaleString()}
          valueClassName="text-h1"
          detail={
            <p className="text-meta tabular-nums">
              {lifetimeEarned > 0 ? (
                <>
                  {t(lang, "honeyLifetimeEarned")}:{" "}
                  <span className="font-semibold text-foreground">{lifetimeEarned.toLocaleString()}</span>
                </>
              ) : (
                <span>{lang === "TH" ? "เริ่มเก็บ Honey วันนี้" : lang === "JP" ? "Honeyを集めよう" : "Start earning today"}</span>
              )}
            </p>
          }
          ariaLabel={t(lang, "honeyBalanceTooltip")}
          guideIcon={<HelpCircle className="size-3.5" />}
          guideContent={<HowToEarnGuideContent lang={lang} />}
        />

        <HoneyStatCard
          icon={<Ticket className="size-5" />}
          iconClassName="bg-muted text-muted-foreground"
          label={t(lang, "ticketLabel")}
          value={ticketBalance.toLocaleString()}
          detail={
            <p className="text-meta tabular-nums">
              {t(lang, "ticketUsedThisMonth")}: {ticketsUsedThisMonth}
            </p>
          }
          ariaLabel={t(lang, "ticketTooltip")}
          guideIcon={<Info className="size-3.5" />}
          guideContent={<TicketGuideContent lang={lang} />}
        />

        <HoneyStatCard
          icon={<Flame className="size-5" />}
          iconClassName={cn(
            tierIdx >= 1
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
          )}
          label={t(lang, "streakLabel")}
          value={streakDayText(lang, streak)}
          detail={
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-meta tabular-nums">
                <span className="mr-0.5">{currentEarnLabel(lang)}</span>
                <span className="font-semibold text-foreground">
                  +{streakReward} 🍯{perDayUnit(lang)}
                </span>
              </span>
              {tierHint && (
                <span className="rounded bg-primary/10 px-1.5 py-px text-xs font-bold tabular-nums text-primary">
                  {tierHint}
                </span>
              )}
            </div>
          }
          ariaLabel={t(lang, "streakTooltip")}
          guideIcon={<HelpCircle className="size-3.5" />}
          guideContent={<StreakGuideContent lang={lang} />}
        />

        <HoneyStatCard
          icon={<RankIcon className="size-5" />}
          iconClassName="bg-primary/10 text-primary"
          label={t(lang, "rankLabel")}
          value={rankLabels[currentLevel]}
          detail={
            <RankProgress
              lang={lang}
              lifetimeEarned={lifetimeEarned}
              currentMin={currentMin}
              nextThreshold={nextThreshold}
              nextLabel={nextRankLabel}
            />
          }
          ariaLabel={t(lang, "rankTooltip")}
          guideIcon={<Info className="size-3.5" />}
          guideContent={<RankGuideContent lang={lang} level={level} lifetimeEarned={lifetimeEarned} />}
        />
      </div>
    </div>
  );
}
