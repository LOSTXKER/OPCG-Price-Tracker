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
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { t, type Language } from "@/lib/i18n";
import type { HoneyLevel, ActiveEvent } from "../types";
import { RankInfoPopover } from "./rank-info-popover";
import { HowToEarnPopover } from "./how-to-earn-popover";

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

export type StatusProps = {
  lang: Language;
  points: number;
  ticketBalance: number;
  ticketsUsedThisMonth: number;
  streak: number;
  level: HoneyLevel | null;
  lifetimeEarned: number;
  activeEvent: ActiveEvent | null;
  canCheckin: boolean;
  checkinLoading: boolean;
  onCheckin: () => void;
};

function useStatusData(props: StatusProps) {
  const { level, lang } = props;
  const currentLevel = level?.level ?? 0;
  const nextThreshold = level?.nextThreshold ?? null;
  const isMaxRank = nextThreshold === null;
  const rankLabels = RANK_LABELS[lang] ?? RANK_LABELS.EN;
  const RankIcon = RANK_ICONS[currentLevel] ?? Shield;

  return { currentLevel, nextThreshold, isMaxRank, rankLabels, RankIcon };
}

/* ------------------------------------------------------------------ */
/*  Shared popover styles                                              */
/* ------------------------------------------------------------------ */

const POPOVER_POPUP_CLASS =
  "w-56 rounded-lg border bg-background p-3 shadow-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95";

const POPOVER_ARROW_CLASS =
  "size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] border bg-background data-[side=bottom]:top-1 data-[side=top]:-bottom-2.5";

const INFO_TRIGGER_CLASS =
  "inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

/* ------------------------------------------------------------------ */
/*  Ticket Info Popover                                                */
/* ------------------------------------------------------------------ */

function TicketInfoPopover({ lang }: { lang: Language }) {
  const earnMethods = [
    { icon: Coins, label: t(lang, "ticketMethodBuy") },
    { icon: Flame, label: t(lang, "ticketMethodFree") },
    { icon: ClipboardList, label: t(lang, "ticketMethodMission") },
  ];

  return (
    <Popover.Root>
      <Popover.Trigger className={INFO_TRIGGER_CLASS}>
        <Info className="size-3.5" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" sideOffset={6} align="center" className="z-50">
          <Popover.Popup className={POPOVER_POPUP_CLASS}>
            <p className="mb-2 text-xs font-semibold text-foreground">
              {t(lang, "raffleHowToGet")}
            </p>
            <div className="space-y-1.5">
              {earnMethods.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground">
                  <Icon className="size-3.5 shrink-0" />
                  <span className="flex-1">{label}</span>
                </div>
              ))}
            </div>

            <p className="mb-2 mt-3 border-t pt-2 text-xs font-semibold text-foreground">
              {t(lang, "howToUseTicket")}
            </p>
            <div className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground">
              <Ticket className="size-3.5 shrink-0" />
              <span className="flex-1">{t(lang, "ticketUseRaffle")}</span>
            </div>

            <Popover.Arrow className={POPOVER_ARROW_CLASS} />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

/* ------------------------------------------------------------------ */
/*  Streak Info Popover                                                */
/* ------------------------------------------------------------------ */

function StreakInfoPopover({ lang }: { lang: Language }) {
  return (
    <Popover.Root>
      <Popover.Trigger className={INFO_TRIGGER_CLASS}>
        <HelpCircle className="size-3.5" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" sideOffset={6} align="center" className="z-50">
          <Popover.Popup className={POPOVER_POPUP_CLASS}>
            <p className="mb-2 text-xs font-semibold text-foreground">
              {t(lang, "streakInfoTitle")}
            </p>
            <div className="space-y-1.5">
              {STREAK_TIERS.map((tier, i) => (
                <div key={i} className="flex items-center gap-2 rounded-md px-2 py-1 text-xs">
                  <span className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-black",
                    i === 0 ? "bg-muted text-muted-foreground"
                      : i === 1 ? "bg-primary/10 text-primary"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
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
            <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">
              {t(lang, "streakInfoDesc")}
            </p>
            <Popover.Arrow className={POPOVER_ARROW_CLASS} />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */

function HoneyStatCard({
  icon,
  iconClassName,
  tintClassName,
  label,
  value,
  subValue,
  tooltipText,
  popover,
}: {
  icon: React.ReactNode;
  iconClassName: string;
  tintClassName?: string;
  label: string;
  value: React.ReactNode;
  subValue?: React.ReactNode;
  tooltipText: string;
  popover?: React.ReactNode;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl border p-4", tintClassName ?? "panel")}>
      {popover && (
        <div className="absolute right-2.5 top-2.5">{popover}</div>
      )}
      <Tooltip>
        <TooltipTrigger className="flex w-full items-center gap-3 text-left">
          <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", iconClassName)}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-lg font-bold tabular-nums leading-tight">{value}</p>
            {subValue && (
              <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{subValue}</p>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Check-in Button                                                    */
/* ------------------------------------------------------------------ */

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
        className="relative shrink-0 gap-1.5 bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
      >
        {showPing && (
          <span className="absolute -right-1 -top-1 flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
          </span>
        )}
        <Calendar className="size-3.5" />
        {t(lang, "dailyCheckin")}
        <span className="rounded bg-white/20 px-1 py-px text-xs font-bold">
          +{getStreakReward(streak)} 🍯
        </span>
      </Button>
    );
  }
  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-price-up/10 px-3 py-2 text-xs font-medium text-price-up">
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
    canCheckin, checkinLoading, onCheckin,
  } = props;
  const {
    currentLevel, nextThreshold, isMaxRank,
    rankLabels, RankIcon,
  } = useStatusData(props);

  const tierIdx = getStreakTierIdx(streak);
  const streakReward = getStreakReward(streak);

  return (
    <TooltipProvider delay={300}>
      <div className="space-y-4">
        {/* Header row */}
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold">{t(lang, "honeyPageTitle")}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{t(lang, "honeySubtitle")}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {activeEvent && (
              <p className="hidden items-center gap-1 text-xs sm:flex">
                <Sparkles className="size-3 text-primary" />
                <span className="font-bold text-primary">
                  {activeEvent.honeyMultiplier}x{" "}
                  {lang === "TH" ? "อีเวนต์โบนัส" : lang === "JP" ? "イベントボーナス" : "Event bonus"}
                </span>
              </p>
            )}
            <CheckinButton
              lang={lang}
              streak={streak}
              canCheckin={canCheckin}
              checkinLoading={checkinLoading}
              onCheckin={onCheckin}
            />
          </div>
        </div>

        {/* Stat cards grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <HoneyStatCard
            icon={<span className="text-xl leading-none">🍯</span>}
            iconClassName="bg-amber-500/15"
            tintClassName="border-amber-500/20 bg-amber-500/[0.03] dark:bg-amber-500/[0.04]"
            label={t(lang, "honeyLabel")}
            value={points.toLocaleString()}
            subValue={`${t(lang, "honeyLifetimeEarned")} ${lifetimeEarned.toLocaleString()}`}
            tooltipText={t(lang, "honeyBalanceTooltip")}
            popover={<HowToEarnPopover lang={lang} />}
          />

          <HoneyStatCard
            icon={<Ticket className="size-5" />}
            iconClassName="bg-blue-500/15 text-blue-600 dark:text-blue-400"
            tintClassName="border-blue-500/20 bg-blue-500/[0.03] dark:bg-blue-500/[0.04]"
            label={t(lang, "ticketLabel")}
            value={ticketBalance.toLocaleString()}
            subValue={`${t(lang, "ticketUsedThisMonth")} ${ticketsUsedThisMonth}`}
            tooltipText={t(lang, "ticketTooltip")}
            popover={<TicketInfoPopover lang={lang} />}
          />

          <HoneyStatCard
            icon={<Flame className="size-5" />}
            iconClassName={cn(
              tierIdx >= 2
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : tierIdx >= 1
                  ? "bg-orange-500/15 text-orange-500"
                  : "bg-muted text-muted-foreground",
            )}
            tintClassName="border-orange-500/20 bg-orange-500/[0.03] dark:bg-orange-500/[0.04]"
            label={t(lang, "streakLabel")}
            value={streakDayText(lang, streak)}
            subValue={`+${streakReward} 🍯${perDayUnit(lang)}`}
            tooltipText={t(lang, "streakTooltip")}
            popover={<StreakInfoPopover lang={lang} />}
          />

          <HoneyStatCard
            icon={<RankIcon className="size-5" />}
            iconClassName="bg-purple-500/15 text-purple-600 dark:text-purple-400"
            tintClassName="border-purple-500/20 bg-purple-500/[0.03] dark:bg-purple-500/[0.04]"
            label={t(lang, "rankLabel")}
            value={rankLabels[currentLevel]}
            subValue={
              !isMaxRank
                ? `${lifetimeEarned.toLocaleString()} / ${nextThreshold!.toLocaleString()}`
                : "MAX"
            }
            tooltipText={t(lang, "rankTooltip")}
            popover={<RankInfoPopover lang={lang} level={level} lifetimeEarned={lifetimeEarned} />}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
