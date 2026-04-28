"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Lock, Medal, Trophy } from "lucide-react";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { AchievementItem } from "../types";
import { localizedName } from "../types";
import { EmptyState } from "./empty-state";
import { FilterTabs } from "./_shared/filter-tabs";

type AchFilter = "ALL" | "EARNED" | "LOCKED";

const FILTER_LABELS: Record<AchFilter, Record<string, string>> = {
  ALL:    { TH: "ทั้งหมด",         EN: "All",    JP: "すべて" },
  EARNED: { TH: "ได้รับแล้ว",      EN: "Earned",  JP: "獲得済み" },
  LOCKED: { TH: "ยังไม่ปลดล็อค",   EN: "Locked",  JP: "未達成" },
};

function formatProgressNumber(n: number): string {
  return n.toLocaleString();
}

export function AchievementsTab({
  lang,
  achievements,
}: {
  lang: Language;
  achievements: AchievementItem[];
}) {
  const [filter, setFilter] = useState<AchFilter>("ALL");

  const filtered = useMemo(() => {
    if (filter === "EARNED") return achievements.filter((a) => a.earned);
    if (filter === "LOCKED") return achievements.filter((a) => !a.earned);
    return achievements;
  }, [achievements, filter]);

  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3.5">
        <h2 className="text-h3">{t(lang, "achievements")}</h2>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold tabular-nums text-primary">
          {earnedCount}/{achievements.length}
        </span>
      </div>

      {achievements.length > 0 && (
        <FilterTabs<AchFilter>
          value={filter}
          onChange={setFilter}
          options={(["ALL", "EARNED", "LOCKED"] as AchFilter[]).map((key) => ({
            key,
            label: FILTER_LABELS[key][lang] ?? FILTER_LABELS[key].EN,
          }))}
          ariaLabel={t(lang, "achievements")}
        />
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Medal} label={t(lang, "achievements")} />
      ) : (
        <div className="divide-y divide-border/40">
          {filtered.map((ach) => {
            const showBar = !ach.earned && ach.target > 1;
            const pct = ach.target > 0
              ? Math.max(0, Math.min(100, Math.round((ach.progress / ach.target) * 100)))
              : 0;
            return (
              <div key={ach.id} className="flex items-center gap-3 px-4 py-3.5">
                {ach.badgeImageUrl ? (
                  <div
                    className={cn(
                      "relative size-9 shrink-0 overflow-hidden rounded-full border border-border/40",
                      !ach.earned && "opacity-40 grayscale",
                    )}
                  >
                    <img src={ach.badgeImageUrl} alt="" className="size-full object-cover" />
                  </div>
                ) : (
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full bg-muted/50 text-muted-foreground",
                      ach.earned && "bg-primary/10 text-primary",
                    )}
                  >
                    {ach.earned ? <Trophy className="size-4" /> : <Lock className="size-4" />}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className={cn("text-xs font-semibold", !ach.earned && "text-muted-foreground")}>
                    {localizedName(ach, lang)}
                  </p>
                  {ach.description && <p className="text-meta">{ach.description}</p>}
                  {ach.earned && ach.earnedAt && (
                    <p className="text-meta tabular-nums text-price-up">
                      {new Date(ach.earnedAt).toLocaleDateString()}
                    </p>
                  )}
                  {!ach.earned && ach.target > 0 && (
                    <div className="mt-1.5 flex items-center gap-2">
                      {showBar && (
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary/80 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                      <span className={cn(
                        "shrink-0 text-xs font-semibold tabular-nums",
                        showBar ? "text-foreground" : "text-muted-foreground",
                      )}>
                        {formatProgressNumber(ach.progress)} / {formatProgressNumber(ach.target)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-xs font-bold tabular-nums text-primary">
                    +{ach.honeyReward} <span className="text-xs">🍯</span>
                  </span>
                  {ach.earned ? (
                    <CheckCircle2 className="ml-auto mt-0.5 size-3.5 text-price-up" />
                  ) : (
                    <span className="block text-meta">{t(lang, "achievementLocked")}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
