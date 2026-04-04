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
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{t(lang, "honeyLeaderboard")}</h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {lang === "TH" ? "ดูอันดับผู้ใช้ที่สะสม Honey มากที่สุด" : lang === "JP" ? "最もHoneyを獲得したユーザーランキング" : "See who has earned the most Honey"}
        </p>
      </div>
      {leaderboard.length === 0 ? (
        <EmptyState icon={Trophy} label={t(lang, "honeyLeaderboard")} />
      ) : (
        <>
          <div className="flex gap-0.5 overflow-x-auto px-4 scrollbar-none">
            {(["HONEY", "STREAK"] as RankSort[]).map((key) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={cn(
                  "shrink-0 border-b-2 px-3 py-2 text-[11px] font-medium transition-colors",
                  sort === key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {SORT_LABELS[key][lang] ?? SORT_LABELS[key].EN}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/30">
                <tr className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
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
                        "flex size-6 items-center justify-center rounded-md text-[10px] font-bold",
                        i === 0 ? "bg-primary/10 text-primary" : i === 1 ? "bg-muted text-muted-foreground" : i === 2 ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                      )}>
                        {i < 3 ? <Trophy className="size-3" /> : i + 1}
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
