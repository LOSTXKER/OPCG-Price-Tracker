"use client";

import { useMemo, useState } from "react";
import { Flame, Trophy } from "lucide-react";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { LeaderboardUser } from "../types";
import { Surface } from "@/components/ui/surface";
import { EmptyState } from "./empty-state";
import { FilterTabs } from "./_shared/filter-tabs";

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
    <Surface variant="panel" className="overflow-hidden">
      <div className="border-b border-[var(--p-hair)] px-4 py-3.5">
        <h2 className="text-h3">{t(lang, "honeyLeaderboard")}</h2>
      </div>
      {leaderboard.length === 0 ? (
        <EmptyState icon={Trophy} label={t(lang, "honeyLeaderboard")} />
      ) : (
        <>
          <FilterTabs<RankSort>
            value={sort}
            onChange={setSort}
            options={(["HONEY", "STREAK"] as RankSort[]).map((key) => ({
              key,
              label: SORT_LABELS[key][lang] ?? SORT_LABELS[key].EN,
            }))}
            ariaLabel={t(lang, "honeyLeaderboard")}
          />
          {/* Mobile list */}
          <div className="divide-y divide-[var(--p-hair)] sm:hidden">
            {sorted.map((user, i) => (
              <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={cn(
                    "inline-flex size-6 shrink-0 items-center justify-center text-xs font-bold tabular-nums",
                    i === 0 ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {i === 0 ? <Trophy className="size-3.5" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {user.displayName ?? t(lang, "anonymous")}
                  </p>
                  <div
                    className={cn(
                      "mt-0.5 flex items-center gap-1 text-meta",
                      sort === "STREAK" ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <Flame className="size-3" />
                    <span className="tabular-nums">{user.checkinStreak}</span>
                    <span>{t(lang, "days")}</span>
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 font-bold tabular-nums",
                    sort === "HONEY" ? "text-primary" : "text-foreground",
                  )}
                >
                  {user.honeyPoints.toLocaleString()}{" "}
                  <span className="text-xs font-semibold">🍯</span>
                </span>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--p-hair)] bg-muted/30">
                <tr className="text-eyebrow text-muted-foreground/70">
                  <th className="w-12 px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">{t(lang, "anonymous")}</th>
                  <th className="px-4 py-2.5 text-right">Honey</th>
                  <th className="hidden px-4 py-2.5 text-right sm:table-cell">{t(lang, "days")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--p-hair)]">
                {sorted.map((user, i) => (
                  <tr key={user.id} className="ease-chrome hover:bg-muted/70">
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          "inline-flex size-6 items-center justify-center text-xs font-bold tabular-nums",
                          i === 0 ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {i === 0 ? <Trophy className="size-3.5" /> : i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="truncate font-medium">{user.displayName ?? t(lang, "anonymous")}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={cn(
                        "font-bold tabular-nums",
                        sort === "HONEY" ? "text-primary" : "text-foreground",
                      )}>
                        {user.honeyPoints.toLocaleString()} <span className="text-xs font-semibold">🍯</span>
                      </span>
                    </td>
                    <td className="hidden px-4 py-2.5 text-right sm:table-cell">
                      <div className={cn(
                        "flex items-center justify-end gap-1",
                        sort === "STREAK" ? "text-primary" : "text-muted-foreground",
                      )}>
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
    </Surface>
  );
}
