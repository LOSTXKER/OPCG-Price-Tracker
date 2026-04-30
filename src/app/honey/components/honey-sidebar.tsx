"use client";

import {
  ClipboardList,
  Coins,
  Flame,
  Sparkles,
  Target,
  Ticket,
} from "lucide-react";
import { Popover } from "@base-ui/react/popover";
import { cn } from "@/lib/utils";
import { t, type Language } from "@/lib/i18n";
import {
  findTierByLevel,
  getTierLabel,
  type RankTier,
} from "@/lib/honey/rank-tiers";
import { RankTierIcon } from "@/components/shared/rank-icon";
import { useRankTiers } from "@/hooks/use-rank-tiers";
import type { HoneyLevel, ActiveEvent, ShopItem } from "../types";
import { localizedName } from "../types";
import { RankGuideContent } from "./rank-info-popover";
import { HowToEarnGuideContent } from "./how-to-earn-popover";

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

function currentEarnLabel(lang: Language): string {
  if (lang === "TH") return "ขณะนี้ได้";
  if (lang === "JP") return "現在";
  return "Currently";
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
    iconName,
    accent,
    iconImage,
  };
}

/* ------------------------------------------------------------------ */
/*  Shared popover styles                                              */
/* ------------------------------------------------------------------ */

const POPOVER_POPUP_CLASS =
  "w-56 rounded-lg bg-popover p-3 shadow-xl ring-1 ring-border/40 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95";

const POPOVER_ARROW_CLASS =
  "size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] bg-popover ring-1 ring-border/40 data-[side=bottom]:top-1 data-[side=top]:-bottom-2.5";

/* ------------------------------------------------------------------ */
/*  Guide content for Ticket and Streak                                */
/* ------------------------------------------------------------------ */

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
 * (a real <button>), so a separate "?" affordance is no longer needed — the card
 * is the affordance. Icons render inline at 20px without a tinted box; the four
 * cards intentionally share visual weight so they sit as a quiet status strip.
 */
function HoneyStatCard({
  icon,
  label,
  value,
  emphasis = "default",
  detail,
  ariaLabel,
  guideContent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  /** "honey" gets the largest value font to keep brand emphasis without color tint. */
  emphasis?: "honey" | "default";
  detail?: React.ReactNode;
  ariaLabel: string;
  guideContent: React.ReactNode;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger
        render={(triggerProps) => <button type="button" {...triggerProps} aria-label={ariaLabel} />}
        className={cn(
          "panel group relative flex h-full w-full flex-col p-4 text-left",
          "cursor-pointer transition-colors hover:bg-foreground/[0.02]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        <div className="flex items-center gap-2">
          <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
            {icon}
          </span>
          <p className="text-eyebrow">{label}</p>
        </div>

        <div className="flex flex-1 items-center py-2.5">
          <p
            className={cn(
              "tabular-nums leading-none",
              emphasis === "honey" ? "text-h1" : "text-h2",
            )}
          >
            {value}
          </p>
        </div>

        {detail && <div className="mt-auto">{detail}</div>}
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
/*  Honey card detail — balance footer with optional next-goal nudge  */
/* ------------------------------------------------------------------ */

function pickNextGoal(
  shopItems: ShopItem[] | undefined,
  points: number,
  userLevel: number,
): ShopItem | null {
  if (!shopItems) return null;
  const now = Date.now();
  const candidates = shopItems
    .filter((item) => item.isActive)
    .filter((item) => (item.requiredLevel ?? 0) <= userLevel)
    .filter((item) => item.cost > points)
    .filter((item) => !item.availableUntil || new Date(item.availableUntil).getTime() > now)
    .filter((item) => item.stock == null || item.stock > 0);

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.cost - b.cost);
  return candidates[0];
}

function HoneyCardDetail({
  lang,
  lifetimeEarned,
  shopItems,
  points,
  userLevel,
}: {
  lang: Language;
  lifetimeEarned: number;
  shopItems?: ShopItem[];
  points: number;
  userLevel: number;
}) {
  const goal = pickNextGoal(shopItems, points, userLevel);

  if (goal) {
    const remaining = Math.max(0, goal.cost - points);
    const goalName = localizedName(goal, lang);
    return (
      <div className="flex items-center gap-1.5 text-meta">
        <Target className="size-3 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate">
          <span className="text-muted-foreground">
            {lang === "TH" ? "เป้าหมาย: " : lang === "JP" ? "目標: " : "Goal: "}
          </span>
          <span className="font-semibold text-foreground">{goalName}</span>
        </span>
        <span className="shrink-0 font-semibold tabular-nums text-primary">
          {remaining.toLocaleString()} 🍯
        </span>
      </div>
    );
  }

  if (lifetimeEarned > 0) {
    return (
      <p className="text-meta tabular-nums">
        {t(lang, "honeyLifetimeEarned")}:{" "}
        <span className="font-semibold text-foreground">{lifetimeEarned.toLocaleString()}</span>
      </p>
    );
  }

  return (
    <p className="text-meta">
      {lang === "TH" ? "เริ่มเก็บ Honey วันนี้" : lang === "JP" ? "Honeyを集めよう" : "Start earning today"}
    </p>
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
  accent,
}: {
  lang: Language;
  lifetimeEarned: number;
  currentMin: number;
  nextThreshold: number | null;
  nextLabel: string | undefined;
  accent?: string | null;
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
      <div className="flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${pct}%`,
              backgroundColor: accent ?? undefined,
            }}
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
/*  Main Status Bar                                                     */
/* ------------------------------------------------------------------ */

export function HoneyStatusBar(props: StatusProps) {
  const {
    lang, points, ticketBalance, ticketsUsedThisMonth, streak, level, lifetimeEarned,
    activeEvent, tierMultiplier = 1, shopItems,
  } = props;
  const { tiers } = useRankTiers();
  const {
    currentLevel,
    nextThreshold, currentMin,
    currentLabel, nextLabel,
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
                {lang === "TH" ? "โบนัสแพ็กเกจ" : lang === "JP" ? "プランボーナス" : "Plan bonus"}
              </span>
            </div>
          )}
          {activeEvent && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles className="size-3.5" />
              <span>
                {activeEvent.honeyMultiplier}x{" "}
                {lang === "TH" ? "อีเวนต์โบนัส" : lang === "JP" ? "イベントボーナス" : "Event bonus"}
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
              shopItems={shopItems}
              points={points}
              userLevel={currentLevel}
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
              <span className="mr-0.5">{currentEarnLabel(lang)}</span>
              <span className="font-semibold text-foreground">
                +{streakReward} 🍯{perDayUnit(lang)}
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
              accent={accent}
            />
          }
          ariaLabel={t(lang, "rankTooltip")}
          guideContent={<RankGuideContent lang={lang} level={level} lifetimeEarned={lifetimeEarned} />}
        />
      </div>
    </div>
  );
}
