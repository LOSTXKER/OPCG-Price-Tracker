"use client";

import { useMemo, useState } from "react";
import { Flame, Trophy } from "lucide-react";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { LeaderboardUser } from "../types";
import { EmptyState } from "./empty-state";

type RankSort = "HONEY" | "STREAK";

const SORT_LABELS: Record<RankSort, Record<string, string>> = {
  HONEY:  { TH: "Honey สูงสุด",  EN: "Most Honey",     JP: "Honey順" },
  STREAK: { TH: "Streak ยาวสุด", EN: "Longest Streak", JP: "ストリーク順" },
};

export function RankingsTab({
  lang,
  leaderboard,
}: {
  lang: Language;
  leaderboard: LeaderboardUser[];
}) {
  const [sort, setSort] = useState<RankSort>("HONEY");

  const sorted = useMemo(() => {
    const copy = [...leaderboard];
    if (sort === "STREAK") copy.sort((a, b) => b.checkinStreak - a.checkinStreak);
    return copy;
  }, [leaderboard, sort]);

  return (
    <div className="panel overflow-hidden">
      <div className="border-b px-4 py-3.5">
        <h2 className="text-sm font-bold">{t(lang, "honeyLeaderboard")}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {lang === "TH" ? "ดูอันดับผู้ใช้ที่สะสม Honey มากที่สุด" : lang === "JP" ? "最もHoneyを獲得したユーザーランキング" : "See who has earned the most Honey"}
        </p>
      </div>
      {leaderboard.length === 0 ? (
        <EmptyState icon={Trophy} label={t(lang, "honeyLeaderboard")} />
      ) : (
        <>
          <div className="flex gap-1 overflow-x-auto bg-muted/20 px-4 py-1.5 scrollbar-none">
            {(["HONEY", "STREAK"] as RankSort[]).map((key) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  sort === key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
                )}
              >
                {SORT_LABELS[key][lang] ?? SORT_LABELS[key].EN}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/30">
                <tr className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                  <th className="w-12 px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">{t(lang, "anonymous")}</th>
                  <th className="px-4 py-2.5 text-right">Honey</th>
                  <th className="hidden px-4 py-2.5 text-right sm:table-cell">{t(lang, "days")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {sorted.map((user, i) => (
                  <tr key={user.id} className="transition-colors hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <div className={cn(
                        "flex size-7 items-center justify-center rounded-lg text-xs font-bold",
                        i === 0 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : i === 1 ? "bg-slate-300/15 text-slate-500 dark:text-slate-400" : i === 2 ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" : "text-muted-foreground"
                      )}>
                        {i < 3 ? <Trophy className="size-3.5" /> : i + 1}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="truncate font-medium">{user.displayName ?? t(lang, "anonymous")}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={cn("font-bold tabular-nums", sort === "HONEY" ? "text-primary" : "text-foreground")}>{user.honeyPoints.toLocaleString()} <span className="text-xs font-semibold">🍯</span></span>
                    </td>
                    <td className="hidden px-4 py-2.5 text-right sm:table-cell">
                      <div className={cn("flex items-center justify-end gap-1", sort === "STREAK" ? "text-primary" : "text-muted-foreground")}>
                        <Flame className="size-3" />
                        <span className="tabular-nums">{user.checkinStreak}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
