"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Gift,
  Info,
  Loader2,
  Share2,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Language, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useCountdown } from "../hooks/use-countdown";
import type { MissionData } from "../types";
import { ICON_MAP } from "./missions-types";
import { ClaimButton, MissionCard } from "./mission-card";
import { BonusRow } from "./_shared/bonus-row";
import { HeaderPill, SectionHeader } from "./_shared/section-header";

const FREE_TICKET_THRESHOLD = 7;
const STREAK_MILESTONE = 30;

function getStreakReward(streak: number): number {
  if (streak >= 30) return 30;
  if (streak >= 7) return 20;
  return 10;
}

function dayUnit(lang: Language): string {
  if (lang === "TH") return "วัน";
  if (lang === "JP") return "日";
  return "days";
}

function checkinTitle(lang: Language): string {
  if (lang === "TH") return "เช็คอินรายวัน";
  if (lang === "JP") return "毎日チェックイン";
  return "Daily check-in";
}

function checkinDescription(lang: Language): string {
  if (lang === "TH") return "เช็คอินทุกวันเพื่อรักษาสตรีคและสะสม Honey";
  if (lang === "JP") return "毎日チェックインでストリークを伸ばしHoneyを獲得";
  return "Check in every day to keep your streak and earn Honey";
}

function todayMissionsTitle(lang: Language): string {
  if (lang === "TH") return "ภารกิจวันนี้";
  if (lang === "JP") return "今日のミッション";
  return "Today's missions";
}

function todayMissionsDescription(lang: Language): string {
  if (lang === "TH") return "ทำภารกิจเพื่อรับ Honey และโบนัสรายวัน — รีเซ็ตทุกเที่ยงคืน";
  if (lang === "JP") return "ミッション達成で毎日Honeyとボーナスを獲得 — 深夜にリセット";
  return "Complete missions to earn Honey and a daily bonus — resets at midnight";
}

type StreakGoal = {
  target: number;
  label: React.ReactNode;
};

/**
 * Returns the next active streak goal: the target day, the per-day reward
 * earned at the target, and a free-ticket flag. We progress through two
 * goals — 7 days (raffle ticket + bumped reward), then 30 days (peak
 * reward). Beyond 30 the user is at max and we render a trophy state
 * instead of a goal bar.
 */
function getStreakGoal(lang: Language, streak: number): StreakGoal | null {
  if (streak >= STREAK_MILESTONE) return null;

  if (streak < FREE_TICKET_THRESHOLD) {
    return {
      target: FREE_TICKET_THRESHOLD,
      label: (
        <>
          <span className="font-bold tabular-nums">+20</span>
          <span aria-hidden>🍯</span>
          <span className="text-meta">{lang === "JP" ? "/日" : lang === "EN" ? "/day" : "/วัน"}</span>
          <span className="text-meta">+</span>
          <span aria-hidden>🎟️</span>
          <span>
            {lang === "TH" ? "ตั๋วฟรี" : lang === "JP" ? "無料券" : "free ticket"}
          </span>
        </>
      ),
    };
  }

  return {
    target: STREAK_MILESTONE,
    label: (
      <>
        <span className="font-bold tabular-nums">+30</span>
        <span aria-hidden>🍯</span>
        <span className="text-meta">{lang === "JP" ? "/日" : lang === "EN" ? "/day" : "/วัน"}</span>
      </>
    ),
  };
}

function streakInfoTitle(lang: Language): string {
  if (lang === "TH") return "Honey ที่ได้จากการเช็คอิน";
  if (lang === "JP") return "チェックインで獲得するHoney";
  return "Honey earned per check-in";
}

type StreakNote = { icon: string; text: string };

function streakInfoNotes(lang: Language): StreakNote[] {
  if (lang === "TH") {
    return [
      { icon: "🎟️", text: "ครบ 7 วันรับตั๋วลุ้นฟรี (เดือนละ 1 ครั้ง)" },
      { icon: "⏸️", text: "หยุดเช็คอิน 1 วัน สตรีคจะรีเซ็ตเป็น 0" },
    ];
  }
  if (lang === "JP") {
    return [
      { icon: "🎟️", text: "7日達成で無料抽選券（月1回）" },
      { icon: "⏸️", text: "1日でも逃すとストリーク0にリセット" },
    ];
  }
  return [
    { icon: "🎟️", text: "Free raffle ticket at 7-day streak (once per month)" },
    { icon: "⏸️", text: "Miss a day and your streak resets to 0" },
  ];
}

type StreakTier = { range: string; reward: string };

function streakInfoTiers(lang: Language): StreakTier[] {
  if (lang === "TH") {
    return [
      { range: "วันที่ 1-6", reward: "+10" },
      { range: "วันที่ 7-29", reward: "+20" },
      { range: "วันที่ 30+", reward: "+30" },
    ];
  }
  if (lang === "JP") {
    return [
      { range: "1〜6日目", reward: "+10" },
      { range: "7〜29日目", reward: "+20" },
      { range: "30日目以降", reward: "+30" },
    ];
  }
  return [
    { range: "Days 1–6", reward: "+10" },
    { range: "Days 7–29", reward: "+20" },
    { range: "Day 30+", reward: "+30" },
  ];
}

/* ------------------------------------------------------------------ */
/*  StreakCard — daily check-in + streak progress + free-ticket row    */
/* ------------------------------------------------------------------ */

/**
 * Owns the daily login ritual: streak progression, today's check-in CTA,
 * and the once-per-month free ticket reward that unlocks at a 7-day streak.
 *
 * Split from `MissionsCard` because the two have different cadences
 * (check-in is a single click; missions are a checklist the user navigates
 * away to complete) and conflating them was hiding streak progression
 * behind mission noise.
 */
export function StreakCard({
  lang,
  streak,
  canCheckin,
  canClaimFree,
  checkinLoading,
  claimFreeLoading,
  onCheckin,
  onClaimFreeTicket,
}: {
  lang: Language;
  streak: number;
  canCheckin: boolean;
  canClaimFree: boolean;
  checkinLoading: boolean;
  claimFreeLoading: boolean;
  onCheckin: () => void;
  onClaimFreeTicket: () => void;
}) {
  const ticketUnlocked = streak >= FREE_TICKET_THRESHOLD;

  return (
    <section className="space-y-3">
      <SectionHeader
        title={checkinTitle(lang)}
        description={checkinDescription(lang)}
        pill={
          <HeaderPill icon={Flame} tone={canCheckin ? "primary" : "muted"}>
            {streak} {dayUnit(lang)}
          </HeaderPill>
        }
      />

      <div className="overflow-hidden rounded-xl border bg-card divide-y divide-border/40">
        <CheckinRow
          lang={lang}
          streak={streak}
          canCheckin={canCheckin}
          checkinLoading={checkinLoading}
          onCheckin={onCheckin}
        />
        {ticketUnlocked && (
          <FreeTicketRow
            lang={lang}
            canClaimFree={canClaimFree}
            claimFreeLoading={claimFreeLoading}
            onClaimFreeTicket={onClaimFreeTicket}
          />
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  MissionsCard — daily missions checklist + perfect-day bonus        */
/* ------------------------------------------------------------------ */

export function MissionsCard({
  lang,
  mission,
  onClaimTask,
  onClaimBonus,
  onShare,
}: {
  lang: Language;
  mission: MissionData | null;
  onClaimTask: (taskId: string) => void;
  onClaimBonus: () => void;
  onShare: (taskId: string) => void;
}) {
  const countdown = useCountdown();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimingBonus, setClaimingBonus] = useState(false);

  const handleClaimTask = async (taskId: string) => {
    setClaimingId(taskId);
    await onClaimTask(taskId);
    setClaimingId(null);
  };

  const handleClaimBonus = async () => {
    setClaimingBonus(true);
    await onClaimBonus();
    setClaimingBonus(false);
  };

  const header = (
    <SectionHeader
      title={todayMissionsTitle(lang)}
      description={todayMissionsDescription(lang)}
      pill={
        <HeaderPill icon={Clock} tone="primary">
          <span className="font-mono">{countdown}</span>
        </HeaderPill>
      }
    />
  );

  if (!mission) {
    return (
      <section className="space-y-3">
        {header}
        <div className="rounded-xl border bg-card px-4 py-6 text-center">
          <p className="text-meta">{t(lang, "missionAutoHint")}</p>
        </div>
      </section>
    );
  }

  const { tasks, bonusClaimed, perfectDayBonus } = mission;
  const completedCount = tasks.filter((tk) => tk.claimed).length;
  const allClaimed = tasks.every((tk) => tk.claimed);
  const allDone = tasks.every((tk) => tk.done);

  return (
    <section className="space-y-3">
      {header}

      <div className="overflow-hidden rounded-xl border bg-card">
        <BonusRow
          title={t(lang, "missionBonusDesc")}
          completed={completedCount}
          total={tasks.length}
          honey={perfectDayBonus}
          claimed={bonusClaimed}
          action={
            <ClaimButton
              lang={lang}
              claimed={bonusClaimed}
              canClaim={allDone && allClaimed && !bonusClaimed}
              isClaiming={claimingBonus}
              onClaim={handleClaimBonus}
            />
          }
        />
        <div className="grid grid-cols-1 gap-px bg-border/40 sm:grid-cols-2">
          {tasks.map((task) => {
            const Icon = ICON_MAP[task.icon] ?? Circle;
            return (
              <MissionCard
                key={task.id}
                lang={lang}
                icon={Icon}
                task={task}
                labelKey={task.labelKey}
                hintText={t(lang, task.hintKey as TranslationKey)}
                honey={task.reward}
                ticket={0}
                claimed={task.claimed}
                canClaim={task.done && !task.claimed}
                isClaiming={claimingId === task.id}
                onClaim={() => handleClaimTask(task.id)}
                ctaPath={task.ctaPath}
                shareButton={
                  task.trackType === "manual" && !task.claimed && !task.done ? (
                    <button
                      onClick={() => onShare(task.id)}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      <Share2 className="size-3" />
                      {lang === "TH" ? "แชร์" : lang === "JP" ? "シェア" : "Share"}
                    </button>
                  ) : undefined
                }
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Internal rows                                                      */
/* ------------------------------------------------------------------ */

/**
 * Single-row check-in panel. The progress bar is treated as a *goal bar*:
 * the denominator is the next milestone (7 → 30 days), and the reward
 * sitting at the right end of the bar previews exactly what the user
 * unlocks once they hit it. An info tooltip (rendered as a small button)
 * surfaces the full milestone schedule without bloating the row with
 * secondary copy.
 *
 * When the user reaches the 30-day cap we swap the goal bar for a trophy
 * "max streak" row so we don't render an empty bar with no goal.
 */
function CheckinRow({
  lang,
  streak,
  canCheckin,
  checkinLoading,
  onCheckin,
}: {
  lang: Language;
  streak: number;
  canCheckin: boolean;
  checkinLoading: boolean;
  onCheckin: () => void;
}) {
  const reward = getStreakReward(streak);
  const goal = getStreakGoal(lang, streak);
  const isMaxStreak = goal === null;
  const cappedStreak = goal ? Math.min(streak, goal.target) : streak;
  const pct = goal ? Math.round((cappedStreak / goal.target) * 100) : 100;
  const targetDays = goal?.target ?? STREAK_MILESTONE;

  const dayLabel = lang === "EN" ? "Day" : lang === "JP" ? "日目" : "วันที่";
  const checkinLabel = lang === "TH" ? "เช็คอิน" : lang === "JP" ? "チェックイン" : "Check in";

  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {lang !== "JP" && (
              <span className="text-meta">{dayLabel}</span>
            )}
            <span className="text-base font-bold tabular-nums">{cappedStreak}</span>
            {lang === "JP" && <span className="text-meta">{dayLabel}</span>}
            <span className="text-meta tabular-nums">
              / {targetDays} {dayUnit(lang)}
            </span>
            <StreakInfoPopover lang={lang} />
          </div>
        </div>
        <Button
          size="sm"
          onClick={onCheckin}
          disabled={!canCheckin || checkinLoading}
          className="h-9 shrink-0 gap-1.5 px-4 text-xs"
        >
          {checkinLoading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : canCheckin ? (
            <>
              <Flame className="size-3.5" />
              <span>{checkinLabel}</span>
              <span className="font-bold tabular-nums">+{reward}</span>
              <span aria-hidden>🍯</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="size-3.5" />
              {lang === "TH" ? "เช็คแล้ว" : lang === "JP" ? "完了" : "Done"}
            </>
          )}
        </Button>
      </div>

      {isMaxStreak ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs">
          <Trophy className="size-4 shrink-0 text-primary" />
          <span className="font-semibold text-foreground">
            {lang === "TH"
              ? "สตรีคสูงสุด — รับ +30 🍯/วัน ทุกวัน"
              : lang === "JP"
              ? "最高ストリーク — 毎日 +30 🍯"
              : "Max streak — earning +30 🍯/day"}
          </span>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2.5">
          <div
            className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={cappedStreak}
            aria-valuemin={0}
            aria-valuemax={targetDays}
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs">
            {goal.label}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Click-to-open info popover that explains the streak reward tiers as a
 * compact light-themed card. Uses local state + outside-click detection
 * instead of the shared Tooltip because:
 *   1. Tooltip's default surface is dark (bg-foreground), which fights the
 *      "soft card" page treatment when the popup is dense and reads more
 *      like a mini help card than a one-line tooltip.
 *   2. Tooltip ships a hard-coded arrow whose color can't be themed from
 *      the consumer side, leaving a dark arrow pointing at a light card.
 *
 * The popover is portaled to `document.body` because the parent streak
 * card uses `overflow-hidden` (so the inner divider doesn't bleed past
 * the rounded corners). Without the portal, the popover gets clipped by
 * the card's bounds. We measure the trigger's viewport rect on open and
 * keep it synced via scroll/resize listeners.
 */
function StreakInfoPopover({ lang }: { lang: Language }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function updatePos() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        left: rect.left + rect.width / 2,
        top: rect.bottom + 8,
      });
    }
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        popoverRef.current && !popoverRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const title = streakInfoTitle(lang);
  const tiers = streakInfoTiers(lang);
  const notes = streakInfoNotes(lang);
  const perDay = lang === "JP" ? "/日" : lang === "EN" ? "/day" : "/วัน";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={title}
        aria-expanded={open}
        className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Info className="size-3.5" />
      </button>
      {mounted && open && pos
        ? createPortal(
            <div
              ref={popoverRef}
              role="dialog"
              aria-label={title}
              className="fixed z-50 w-[280px] -translate-x-1/2 rounded-xl border bg-card p-4 shadow-lg"
              style={{ left: pos.left, top: pos.top }}
            >
              <p className="text-sm font-bold">{title}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {tiers.map((tier) => (
                  <li key={tier.range} className="flex items-center justify-between gap-3">
                    <span className="text-body-sm text-foreground">{tier.range}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-bold tabular-nums text-foreground">
                      {tier.reward}
                      <span aria-hidden>🍯</span>
                      <span className="text-meta font-normal">{perDay}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <ul className="mt-3 flex flex-col gap-1.5 border-t pt-3">
                {notes.map((note) => (
                  <li key={note.text} className="flex items-start gap-2 text-meta">
                    <span aria-hidden className="shrink-0 leading-5">{note.icon}</span>
                    <span className="leading-5">{note.text}</span>
                  </li>
                ))}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function FreeTicketRow({
  lang,
  canClaimFree,
  claimFreeLoading,
  onClaimFreeTicket,
}: {
  lang: Language;
  canClaimFree: boolean;
  claimFreeLoading: boolean;
  onClaimFreeTicket: () => void;
}) {
  const title = lang === "TH"
    ? "ตั๋วลุ้นรางวัลฟรี 1 ใบ/เดือน"
    : lang === "JP"
      ? "月1回の無料抽選チケット"
      : "Free raffle ticket — 1/month";

  const meta = canClaimFree
    ? lang === "TH"
      ? "ปลดล็อกแล้ว — กดรับเลย"
      : lang === "JP"
        ? "ロック解除済み — 受け取りましょう"
        : "Unlocked — claim it now"
    : lang === "TH"
      ? "รับแล้วเดือนนี้ พบกันเดือนหน้า"
      : lang === "JP"
        ? "今月は受取済み — 来月またどうぞ"
        : "Claimed this month — back next month";

  return (
    <div className="flex items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-semibold", !canClaimFree && "text-muted-foreground")}>
          {title}
        </p>
        <p className="mt-0.5 text-meta">{meta}</p>
      </div>

      {canClaimFree ? (
        <Button
          size="sm"
          onClick={onClaimFreeTicket}
          disabled={claimFreeLoading}
          className="h-9 shrink-0 gap-1.5 px-4 text-xs"
        >
          {claimFreeLoading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <>
              <Gift className="size-3.5" />
              {t(lang, "raffleClaimFreeTicket")}
            </>
          )}
        </Button>
      ) : (
        <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-muted px-3 text-xs font-semibold text-muted-foreground">
          <CheckCircle2 className="size-3.5" />
          {lang === "TH" ? "รับแล้ว" : lang === "JP" ? "受取済み" : "Claimed"}
        </span>
      )}
    </div>
  );
}
