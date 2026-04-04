"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Flame,
  Shield,
  Sparkles,
  Star,
  Crown,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { HoneyLevel, ActiveEvent } from "../types";
import { RankInfoPopover } from "./rank-info-popover";

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
];

function getStreakTier(streak: number) {
  if (streak >= 30) return 2;
  if (streak >= 7) return 1;
  return 0;
}

export type StatusProps = {
  lang: Language;
  points: number;
  streak: number;
  level: HoneyLevel | null;
  lifetimeEarned: number;
  activeEvent: ActiveEvent | null;
  canCheckin: boolean;
  checkinLoading: boolean;
  onCheckin: () => void;
};

function useStatusData(props: StatusProps) {
  const { level, lifetimeEarned, lang, streak } = props;
  const currentLevel = level?.level ?? 0;
  const nextThreshold = level?.nextThreshold ?? null;
  const currentMin = level?.currentMin ?? 0;
  const isMaxRank = nextThreshold === null;
  const progress = isMaxRank ? 100 : nextThreshold > currentMin
    ? Math.min(100, Math.round(((lifetimeEarned - currentMin) / (nextThreshold - currentMin)) * 100))
    : 100;
  const rankLabels = RANK_LABELS[lang] ?? RANK_LABELS.EN;
  const RankIcon = RANK_ICONS[currentLevel] ?? Shield;
  const tierIdx = getStreakTier(streak);
  const mult = STREAK_TIERS[tierIdx].mult;
  const nextTier = tierIdx < 2 ? STREAK_TIERS[tierIdx + 1] : null;
  const daysToNext = nextTier ? nextTier.min - streak : 0;

  return { currentLevel, nextThreshold, currentMin, isMaxRank, progress, rankLabels, RankIcon, tierIdx, mult, nextTier, daysToNext };
}

function CheckinButton({ lang, streak, canCheckin, checkinLoading, onCheckin }: {
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
        className="relative h-8 shrink-0 gap-1 bg-primary px-3 text-[11px] font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
      >
        {showPing && (
          <span className="absolute -right-1 -top-1 flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
          </span>
        )}
        <Calendar className="size-3.5" />
        <span className="hidden sm:inline">{t(lang, "dailyCheckin")}</span>
        <span className="rounded bg-white/20 px-1 py-px text-[9px] font-bold">
          +{streak >= 30 ? 30 : streak >= 7 ? 20 : 10} 🍯
        </span>
      </Button>
    );
  }
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-lg bg-price-up/10 px-2.5 py-1.5 text-[11px] font-medium text-price-up">
      <CheckCircle2 className="size-3.5" />
      {t(lang, "checkinDone")}
    </div>
  );
}

export function HoneyStatusBar(props: StatusProps) {
  const {
    lang, points, streak, level, lifetimeEarned, activeEvent,
    canCheckin, checkinLoading, onCheckin,
  } = props;
  const {
    currentLevel, nextThreshold, isMaxRank, progress,
    rankLabels, RankIcon, mult, nextTier, daysToNext,
  } = useStatusData(props);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {/* Left: Honey + Rank */}
      <div className="panel space-y-3 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <span className="text-base leading-none">🍯</span>
          </div>
          <p className="text-lg font-extrabold tabular-nums leading-tight text-primary">
            {points.toLocaleString()} <span className="text-[11px] font-bold">pt</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <RankIcon className="size-4 shrink-0 text-primary" />
          <span className="text-sm font-extrabold text-primary">{rankLabels[currentLevel]}</span>
          {!isMaxRank ? (
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                {lifetimeEarned.toLocaleString()}/{nextThreshold!.toLocaleString()}
              </span>
            </div>
          ) : (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              <Trophy className="size-3" /> MAX
            </span>
          )}
          <RankInfoPopover lang={lang} level={level} lifetimeEarned={lifetimeEarned} />
        </div>
      </div>

      {/* Right: Streak + Check-in (inline) */}
      <div className="panel space-y-2 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            streak >= 7 ? "bg-orange-500/10" : "bg-muted",
          )}>
            <Flame className={cn("size-5", streak >= 7 ? "text-orange-500" : "text-muted-foreground")} />
          </div>
          <p className="min-w-0 text-lg font-extrabold tabular-nums leading-tight">
            {streak} <span className="text-[11px] font-bold text-muted-foreground">{lang === "TH" ? "วัน" : lang === "JP" ? "日" : streak === 1 ? "day" : "days"}</span>
            <span className={cn(
              "ml-1.5 rounded px-1.5 py-0.5 text-[11px] font-black tabular-nums",
              mult >= 3 ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : mult >= 2 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
            )}>
              {mult}x
            </span>
          </p>
          <div className="ml-auto">
            <CheckinButton lang={lang} streak={streak} canCheckin={canCheckin} checkinLoading={checkinLoading} onCheckin={onCheckin} />
          </div>
        </div>

        <div className="pl-[46px]">
          {nextTier && daysToNext > 0 && (
            <p className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <ChevronRight className="size-3" />
              {lang === "TH"
                ? `อีก ${daysToNext} วันถึง ${nextTier.mult}x`
                : lang === "JP"
                  ? `あと${daysToNext}日で${nextTier.mult}x`
                  : `${daysToNext}d to ${nextTier.mult}x`}
              {activeEvent && (
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5">
                  <Sparkles className="size-3 text-primary" />
                  <span className="text-[10px] font-bold text-primary">{activeEvent.honeyMultiplier}x</span>
                </span>
              )}
            </p>
          )}
          {(!nextTier || daysToNext <= 0) && activeEvent && (
            <p className="flex items-center gap-1 text-[10px]">
              <Sparkles className="size-3 text-primary" />
              <span className="font-bold text-primary">{activeEvent.honeyMultiplier}x</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
