"use client";

import type { ReactNode } from "react";
import { CheckCircle2, Flame, Gift, Loader2, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getStreakReward, STREAK_TIERS } from "@/lib/honey/streak";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { HeaderPill, SectionHeader } from "./_shared/section-header";
import { StreakInfoPopover } from "./streak-info-popover";

const FREE_TICKET_THRESHOLD = 7;
const STREAK_MILESTONE = 30;

type StreakGoal = {
  target: number;
  label: ReactNode;
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
          <span className="font-bold tabular-nums">+{STREAK_TIERS[1].reward}</span>
          <span aria-hidden>🍯</span>
          <span className="text-meta">{t(lang, "streakPerDaySuffix")}</span>
          <span className="text-meta">+</span>
          <span aria-hidden>🎟️</span>
          <span>
            {t(lang, "streakGoalFreeTicket")}
          </span>
        </>
      ),
    };
  }

  return {
    target: STREAK_MILESTONE,
    label: (
      <>
        <span className="font-bold tabular-nums">+{STREAK_TIERS[2].reward}</span>
        <span aria-hidden>🍯</span>
        <span className="text-meta">{t(lang, "streakPerDaySuffix")}</span>
      </>
    ),
  };
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
        title={t(lang, "streakCheckinTitle")}
        description={t(lang, "streakCheckinDescription")}
        pill={
          <HeaderPill icon={Flame} tone={canCheckin ? "primary" : "muted"}>
            {streak} {t(lang, "streakDayUnit")}
          </HeaderPill>
        }
      />

      <div className="overflow-hidden rounded-xl border bg-card divide-y divide-[var(--p-hair)]">
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

  const dayLabel = t(lang, "streakDayLabel");
  const checkinLabel = t(lang, "streakCheckinButton");

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
              / {targetDays} {t(lang, "streakDayUnit")}
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
              {t(lang, "streakCheckinDone")}
            </>
          )}
        </Button>
      </div>

      {isMaxStreak ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs">
          <Trophy className="size-4 shrink-0 text-primary" />
          <span className="font-semibold text-foreground">
            {t(lang, "streakMaxStreak")}
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
              className="h-full rounded-full bg-primary motion-base"
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
  const title = t(lang, "streakFreeTicketTitle");

  const meta = canClaimFree
    ? t(lang, "streakFreeTicketMetaUnlocked")
    : t(lang, "streakFreeTicketMetaClaimed");

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
          {t(lang, "streakFreeTicketClaimedPill")}
        </span>
      )}
    </div>
  );
}
