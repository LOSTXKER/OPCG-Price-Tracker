"use client";

import { Award, Calendar, CheckCircle2, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Language } from "@/lib/i18n";
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
  const levelProgress = level?.nextThreshold ? Math.min((points / level.nextThreshold) * 100, 100) : 100;

  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      <div className="flex flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5 lg:flex-col lg:items-start lg:gap-4 lg:p-4">
        {/* Balance */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 lg:size-11">
            <Award className="size-5 text-primary lg:size-6" />
          </div>
          <div>
            <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Honey</p>
            <p className="text-2xl font-extrabold tabular-nums text-primary">
              {points.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5">
            <Flame className="size-3 text-primary" />
            <span className="text-[11px] font-bold tabular-nums text-primary">{streak}</span>
            <span className="text-[9px] text-primary/60">{t(lang, "days")}</span>
          </div>

          {level && (
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                {level.label}
              </span>
              {level.nextThreshold && (
                <div className="hidden items-center gap-1.5 sm:flex lg:hidden">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${levelProgress}%` }} />
                  </div>
                  <span className="text-[9px] tabular-nums text-muted-foreground">
                    {points}/{level.nextThreshold.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {activeEvent && (
            <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5">
              <Sparkles className="size-2.5 text-primary" />
              <span className="text-[9px] font-bold text-primary">
                {activeEvent.honeyMultiplier}x
              </span>
            </div>
          )}
        </div>

        {/* Level progress bar -- visible on lg */}
        {level?.nextThreshold && (
          <div className="hidden w-full items-center gap-2 lg:flex">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${levelProgress}%` }} />
            </div>
            <span className="text-[9px] tabular-nums text-muted-foreground">
              {points}/{level.nextThreshold.toLocaleString()}
            </span>
          </div>
        )}

        {/* Checkin */}
        <div className="shrink-0">
          {canCheckin ? (
            <Button onClick={onCheckin} disabled={checkinLoading} size="sm" className="h-8 gap-1.5 border border-primary/20 bg-primary/10 text-xs text-primary shadow-sm hover:bg-primary/15 lg:w-full">
              <Calendar className="size-3.5" />
              {t(lang, "dailyCheckin")}
            </Button>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-price-up" />
              {t(lang, "checkinDone")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
