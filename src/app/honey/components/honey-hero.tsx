"use client";

import { Calendar, CheckCircle2, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { HoneyLevel, ActiveEvent } from "../types";

export function HoneyHero({
  lang,
  points,
  streak,
  level,
  activeEvent,
  canCheckin,
  checkinLoading,
  onCheckin,
}: {
  lang: Language;
  points: number;
  streak: number;
  level: HoneyLevel | null;
  activeEvent: ActiveEvent | null;
  canCheckin: boolean;
  checkinLoading: boolean;
  onCheckin: () => void;
}) {
  const levelProgress = level?.nextThreshold
    ? Math.min((points / level.nextThreshold) * 100, 100)
    : 100;

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 sm:px-6">
        {/* Balance */}
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
            <span className="text-base leading-none">🍯</span>
          </div>
          <div>
            <p className="text-eyebrow">Honey</p>
            <p className="text-2xl font-extrabold tabular-nums leading-tight text-primary">
              🍯 {points.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Streak */}
        <div className={cn(
          "flex items-center gap-1.5 rounded-full px-2.5 py-1",
          streak >= 7 ? "bg-primary/10" : "bg-muted/60",
        )}>
          <Flame className={cn("size-4", streak >= 7 ? "text-primary" : "text-muted-foreground")} />
          <span className={cn("text-sm font-bold tabular-nums", streak >= 7 ? "text-primary" : "text-foreground")}>
            {streak}
          </span>
          <span className="text-meta">{t(lang, "honeyStreakDays")}</span>
        </div>

        {/* Level badge */}
        {level && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-eyebrow text-primary">
            {level.label}
          </span>
        )}

        {/* Event multiplier */}
        {activeEvent && (
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
            <Sparkles className="size-3 text-primary" />
            <span className="text-xs font-bold text-primary">{activeEvent.honeyMultiplier}x</span>
          </div>
        )}

        {/* Check-in (pushed right) */}
        <div className="ml-auto shrink-0">
          {canCheckin ? (
            <Button
              onClick={onCheckin}
              disabled={checkinLoading}
              size="sm"
              className="h-8 gap-1.5 border border-primary/20 bg-primary/10 px-3 text-xs font-semibold text-primary shadow-sm hover:bg-primary/15"
            >
              <Calendar className="size-3.5" />
              {t(lang, "dailyCheckin")}
            </Button>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-price-up/10 px-3 py-1.5 text-xs font-medium text-price-up">
              <CheckCircle2 className="size-3.5" />
              {t(lang, "checkinDone")}
            </span>
          )}
        </div>
      </div>

      {/* Thin progress strip */}
      {level?.nextThreshold && (
        <div className="h-1 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${levelProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}
