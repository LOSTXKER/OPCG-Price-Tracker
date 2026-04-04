"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Lock, Medal, Trophy } from "lucide-react";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { AchievementItem } from "../types";
import { localizedName } from "../types";
import { EmptyState } from "./empty-state";

type AchFilter = "ALL" | "EARNED" | "LOCKED";

const FILTER_LABELS: Record<AchFilter, Record<string, string>> = {
  ALL:    { TH: "ทั้งหมด",         EN: "All",    JP: "すべて" },
  EARNED: { TH: "ได้รับแล้ว",      EN: "Earned",  JP: "獲得済み" },
  LOCKED: { TH: "ยังไม่ปลดล็อค",   EN: "Locked",  JP: "未達成" },
};

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
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t(lang, "achievements")}</h2>
          <span className="text-xs font-medium tabular-nums text-muted-foreground">{earnedCount}/{achievements.length}</span>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {lang === "TH" ? "ปลดล็อคความสำเร็จเพื่อรับ Honey โบนัส" : lang === "JP" ? "実績を達成してボーナスHoneyを獲得" : "Unlock achievements to earn bonus Honey"}
        </p>
      </div>

      {achievements.length > 0 && (
        <div className="flex items-center gap-0.5 overflow-x-auto px-4 scrollbar-none">
          {(["ALL", "EARNED", "LOCKED"] as AchFilter[]).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "shrink-0 border-b-2 px-3 py-2 text-[11px] font-medium transition-colors",
                filter === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {FILTER_LABELS[key][lang] ?? FILTER_LABELS[key].EN}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Medal} label={t(lang, "achievements")} />
      ) : (
        <div className="divide-y divide-border/40">
          {filtered.map((ach) => (
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
                <span className="text-[11px] font-bold tabular-nums text-primary">+{ach.honeyReward} <span className="text-[9px]">🍯</span></span>
                {ach.earned ? <CheckCircle2 className="ml-auto mt-0.5 size-3.5 text-price-up" /> : <span className="block text-[9px] text-muted-foreground">{t(lang, "achievementLocked")}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
