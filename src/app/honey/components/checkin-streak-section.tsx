"use client";

import { CheckCircle2, Flame, Gift, Loader2, Ticket, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const FREE_TICKET_THRESHOLD = 7;
const MAX_DAY = 30;

const STREAK_TIERS = [
  { min: 1, max: 6, pts: 10 },
  { min: 7, max: 29, pts: 20 },
  { min: 30, max: Infinity, pts: 30 },
] as const;

function getStreakTierIdx(streak: number): number {
  if (streak >= 30) return 2;
  if (streak >= 7) return 1;
  return 0;
}

function dayLabel(lang: Language, n: number): string {
  if (lang === "TH") return `${n} วัน`;
  if (lang === "JP") return `${n}日`;
  return n === 1 ? `${n} day` : `${n} days`;
}

function perDayUnit(lang: Language): string {
  if (lang === "TH") return "/วัน";
  if (lang === "JP") return "/日";
  return "/day";
}

function nextTierHint(streak: number, lang: Language): string | null {
  if (streak >= 30) return null;
  const target = streak >= 7 ? 30 : 7;
  const nextPts = streak >= 7 ? 30 : 20;
  const remaining = target - streak;
  if (lang === "TH") return `เช็คอินอีก ${remaining} วัน เพิ่มเป็น +${nextPts} 🍯${perDayUnit(lang)}`;
  if (lang === "JP") return `あと${remaining}日チェックインで +${nextPts} 🍯${perDayUnit(lang)}にアップ`;
  const dayWord = remaining === 1 ? "day" : "days";
  return `${remaining} more ${dayWord} to upgrade to +${nextPts} 🍯${perDayUnit(lang)}`;
}

function currentEarningLabel(lang: Language): string {
  if (lang === "TH") return "ได้รับวันละ";
  if (lang === "JP") return "現在の獲得";
  return "You earn";
}

/**
 * Map streak count → percentage along the progress bar (0–100%).
 * Two-segment scale so Day 1→7 (the part most users live in) gets equal
 * visual weight to the longer Day 7→30 stretch.
 *   streak ≤ 1  → 0%
 *   streak = 7  → 50% (free-ticket milestone — visual midpoint)
 *   streak ≥ 30 → 100%
 */
function streakToPct(streak: number): number {
  if (streak <= 1) return 0;
  if (streak >= MAX_DAY) return 100;
  if (streak >= FREE_TICKET_THRESHOLD) {
    return 50 + ((streak - FREE_TICKET_THRESHOLD) / (MAX_DAY - FREE_TICKET_THRESHOLD)) * 50;
  }
  return ((streak - 1) / (FREE_TICKET_THRESHOLD - 1)) * 50;
}

type Milestone = {
  day: number;
  pts: number;
  hasTicket: boolean;
  isFinal: boolean;
};

const MILESTONES: Milestone[] = [
  { day: 1, pts: 10, hasTicket: false, isFinal: false },
  { day: 7, pts: 20, hasTicket: true, isFinal: false },
  { day: 30, pts: 30, hasTicket: false, isFinal: true },
];

export function CheckinStreakSection({
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
  const tierIdx = getStreakTierIdx(streak);
  const currentTier = STREAK_TIERS[tierIdx];
  const hint = nextTierHint(streak, lang);
  const ticketUnlocked = streak >= FREE_TICKET_THRESHOLD;
  const fillPct = streakToPct(streak);
  const isAtMilestone = MILESTONES.some((m) => m.day === streak);
  const showYouMarker = streak >= 1 && streak <= MAX_DAY && !isAtMilestone;
  const journeyTitle =
    lang === "TH" ? "เส้นทางสตรีค" : lang === "JP" ? "ストリークの道のり" : "Streak journey";
  const dayUnit = lang === "TH" ? "วัน" : lang === "JP" ? "日" : "days";

  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-baseline justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="text-eyebrow text-orange-500/80">
            {lang === "TH" ? "เช็คอินรายวัน" : lang === "JP" ? "毎日チェックイン" : "Daily check-in"}
          </p>
          <h2 className="mt-0.5 text-h3">
            {lang === "TH"
              ? "สตรีคเช็คอิน"
              : lang === "JP"
                ? "チェックインストリーク"
                : "Check-in Streak"}
          </h2>
        </div>
        <div
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold",
            tierIdx >= 1
              ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
              : "bg-muted/50 text-muted-foreground",
          )}
        >
          <Flame className="size-3.5" />
          <span className="tabular-nums">{dayLabel(lang, streak)}</span>
        </div>
      </div>

      {/* Single unified panel */}
      <div className="overflow-hidden rounded-xl border bg-card">
        {/* Earning summary + check-in CTA */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              tierIdx >= 2
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : tierIdx >= 1
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground",
            )}
          >
            <Flame className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-meta leading-tight">{currentEarningLabel(lang)}</p>
            <p className="text-sm font-bold tabular-nums leading-tight">
              +{currentTier.pts} 🍯
              <span className="ml-0.5 text-xs font-medium text-muted-foreground">
                {perDayUnit(lang)}
              </span>
            </p>
            {hint && <p className="mt-0.5 text-meta">{hint}</p>}
          </div>
          <Button
            size="sm"
            onClick={onCheckin}
            disabled={!canCheckin || checkinLoading}
            className="h-8 shrink-0 gap-1 text-xs"
          >
            {checkinLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : canCheckin ? (
              <>
                <Flame className="size-3.5" />
                {lang === "TH" ? "เช็คอิน" : lang === "JP" ? "チェックイン" : "Check in"}
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3.5" />
                {lang === "TH" ? "เช็คแล้ว" : lang === "JP" ? "完了" : "Done"}
              </>
            )}
          </Button>
        </div>

        {/* Progress Journey — visual timeline of streak milestones */}
        <div className="border-t border-border/40 bg-muted/20 px-4 pb-5 pt-4">
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <p className="text-eyebrow">{journeyTitle}</p>
            <p className="text-sm font-bold tabular-nums text-foreground">
              {Math.min(streak, MAX_DAY)} / {MAX_DAY} {dayUnit}
            </p>
          </div>

          <div className="relative">
            {/* Track + fill — inset so endpoints align with milestone dot centers (16.66% / 50% / 83.33% in a 3-col grid). */}
            <div
              className="absolute top-[18px] h-2.5 overflow-hidden rounded-full bg-muted"
              style={{ left: "16.66%", right: "16.66%" }}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 transition-all duration-500"
                style={{ width: `${fillPct}%` }}
              />
            </div>

            {/* "You are here" indicator — sits on top of the fill at the current % */}
            {showYouMarker && (
              <div
                className="pointer-events-none absolute top-[10px] z-20 -translate-x-1/2 transition-all duration-500"
                style={{ left: `calc(16.66% + ${fillPct} * 0.6666%)` }}
              >
                <div className="size-5 rounded-full border-[3px] border-background bg-foreground shadow-lg ring-2 ring-foreground/30" />
              </div>
            )}

            {/* Milestone columns — dots above, labels below */}
            <div className="relative grid grid-cols-3 gap-1">
              {MILESTONES.map((m) => {
                const reached = streak >= m.day;
                const isActive = streak >= m.day && (m.isFinal || streak < (MILESTONES.find((x) => x.day > m.day)?.day ?? Infinity));
                return (
                  <div key={m.day} className="flex flex-col items-center gap-2.5">
                    {/* Dot */}
                    <div
                      className={cn(
                        "z-10 flex size-10 items-center justify-center rounded-full border-[3px] border-background shadow-md transition-colors",
                        reached
                          ? m.isFinal
                            ? "bg-amber-500 text-white"
                            : m.hasTicket
                              ? "bg-rose-500 text-white"
                              : "bg-orange-500 text-white"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {m.isFinal ? (
                        <Trophy className="size-5" />
                      ) : (
                        <span className="text-base font-black tabular-nums">{m.day}</span>
                      )}
                    </div>

                    {/* Label */}
                    <div className="text-center">
                      <p
                        className={cn(
                          "text-sm leading-tight",
                          isActive
                            ? "font-bold text-foreground"
                            : reached
                              ? "font-semibold text-foreground/80"
                              : "font-semibold text-muted-foreground",
                        )}
                      >
                        {m.day === 1
                          ? lang === "TH"
                            ? "วันที่ 1"
                            : lang === "JP"
                              ? "1日目"
                              : "Day 1"
                          : m.day === 7
                            ? lang === "TH"
                              ? "7 วัน"
                              : lang === "JP"
                                ? "7日"
                                : "Day 7"
                            : lang === "TH"
                              ? "30 วัน"
                              : lang === "JP"
                                ? "30日"
                                : "Day 30"}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-xs font-semibold tabular-nums leading-tight",
                          reached ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        +{m.pts} 🍯
                        <span className="ml-0.5 font-medium text-muted-foreground">
                          {perDayUnit(lang)}
                        </span>
                      </p>
                      {m.hasTicket && (
                        <span
                          className={cn(
                            "mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
                            reached
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                              : "bg-rose-500/10 text-rose-500/80 dark:text-rose-400/80",
                          )}
                        >
                          <Ticket className="size-3" />
                          {lang === "TH" ? "ตั๋วฟรี" : lang === "JP" ? "無料券" : "Free ticket"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Free ticket claim — only visible when Day 7 reached */}
        {ticketUnlocked && (
          <div className="flex items-center gap-3 border-t border-border/40 bg-rose-500/[0.04] px-4 py-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              {canClaimFree ? <Gift className="size-5" /> : <CheckCircle2 className="size-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground">
                {lang === "TH"
                  ? "ตั๋วลุ้นรางวัลฟรี 1 ใบ/เดือน"
                  : lang === "JP"
                    ? "月1回の無料抽選チケット"
                    : "Free raffle ticket — 1/month"}
              </p>
              <p className="mt-0.5 text-meta">
                {canClaimFree
                  ? lang === "TH"
                    ? "ปลดล็อกแล้ว — กดรับเลย!"
                    : lang === "JP"
                      ? "ロック解除済み — 受け取りましょう!"
                      : "Unlocked — claim it now!"
                  : lang === "TH"
                    ? "รับแล้วเดือนนี้ พบกันเดือนหน้า"
                    : lang === "JP"
                      ? "今月は受取済み — 来月またどうぞ"
                      : "Claimed this month — back next month"}
              </p>
            </div>
            {canClaimFree ? (
              <Button
                size="sm"
                onClick={onClaimFreeTicket}
                disabled={claimFreeLoading}
                className="h-8 shrink-0 gap-1 bg-rose-500 text-xs hover:bg-rose-500/90"
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
              <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md bg-muted px-2.5 text-xs font-semibold text-muted-foreground">
                <CheckCircle2 className="size-3.5" />
                {lang === "TH" ? "รับแล้ว" : lang === "JP" ? "受取済み" : "Claimed"}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
