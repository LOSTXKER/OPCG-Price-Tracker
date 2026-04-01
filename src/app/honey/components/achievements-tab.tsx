"use client";

import { CheckCircle2, Crosshair, Lock, Medal, Trophy } from "lucide-react";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Prediction, AchievementItem } from "../types";
import { localizedName } from "../types";
import { EmptyState } from "./empty-state";

export function AchievementsTab({
  lang,
  predictions,
  achievements,
}: {
  lang: Language;
  predictions: Prediction[];
  achievements: AchievementItem[];
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="panel">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">{t(lang, "predictions")}</h2>
        </div>
        {predictions.length === 0 ? (
          <EmptyState icon={Crosshair} label={t(lang, "predictionPending")} />
        ) : (
          <div className="divide-y divide-border/40">
            {predictions.map((pred) => (
              <div key={pred.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                  pred.resolved ? pred.correct ? "bg-price-up/10 text-price-up" : "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                )}>
                  {pred.direction === "UP" ? "↑" : "↓"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{pred.card.nameEn ?? pred.card.nameJp}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {pred.card.cardCode} &middot; ¥{pred.priceAtPrediction.toLocaleString()} → {pred.card.latestPriceJpy ? `¥${pred.card.latestPriceJpy.toLocaleString()}` : "?"}
                  </p>
                </div>
                <span className={cn("text-[10px] font-bold", pred.resolved ? (pred.correct ? "text-price-up" : "text-destructive") : "text-muted-foreground")}>
                  {pred.resolved ? (pred.correct ? t(lang, "predictionCorrect") : t(lang, "predictionWrong")) : t(lang, "predictionPending")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">{t(lang, "achievements")}</h2>
        </div>
        {achievements.length === 0 ? (
          <EmptyState icon={Medal} label={t(lang, "achievements")} />
        ) : (
          <div className="divide-y divide-border/40">
            {achievements.map((ach) => (
              <div key={ach.id} className="flex items-center gap-3 px-4 py-3">
                <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", ach.earned ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                  {ach.earned ? <Trophy className="size-4" /> : <Lock className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-xs font-medium", !ach.earned && "text-muted-foreground")}>{localizedName(ach, lang)}</p>
                  {ach.description && <p className="text-[10px] text-muted-foreground">{ach.description}</p>}
                  {ach.earned && ach.earnedAt && <p className="text-[10px] text-price-up">{new Date(ach.earnedAt).toLocaleDateString()}</p>}
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-[11px] font-bold tabular-nums text-primary">+{ach.honeyReward}</span>
                  {ach.earned ? <CheckCircle2 className="ml-auto mt-0.5 size-3.5 text-price-up" /> : <span className="block text-[9px] text-muted-foreground">{t(lang, "achievementLocked")}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
