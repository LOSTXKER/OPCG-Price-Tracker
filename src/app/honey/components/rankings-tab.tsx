"use client";

import { useState } from "react";
import { Flame, History, Trophy } from "lucide-react";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { HoneyTx, LeaderboardUser } from "../types";
import { EmptyState } from "./empty-state";

export function RankingsTab({
  lang,
  leaderboard,
  transactions,
}: {
  lang: Language;
  leaderboard: LeaderboardUser[];
  transactions: HoneyTx[];
}) {
  const [subTab, setSubTab] = useState<"leaderboard" | "history">("leaderboard");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
        {(["leaderboard", "history"] as const).map((st) => (
          <button
            key={st}
            onClick={() => setSubTab(st)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              subTab === st ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {st === "leaderboard" ? t(lang, "honeyLeaderboard") : t(lang, "honeyHistory")}
          </button>
        ))}
      </div>

      {subTab === "leaderboard" && (
        <div className="panel overflow-hidden">
          {leaderboard.length === 0 ? (
            <EmptyState icon={Trophy} label={t(lang, "honeyLeaderboard")} />
          ) : (
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
                  {leaderboard.map((user, i) => (
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
                        <span className="font-bold tabular-nums text-primary">{user.honeyPoints.toLocaleString()}</span>
                      </td>
                      <td className="hidden px-4 py-2.5 text-right sm:table-cell">
                        <div className="flex items-center justify-end gap-1">
                          <Flame className="size-3 text-primary" />
                          <span className="tabular-nums text-primary">{user.checkinStreak}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {subTab === "history" && (
        <div className="panel overflow-hidden">
          {transactions.length === 0 ? (
            <EmptyState icon={History} label={t(lang, "noTransactions")} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/30">
                  <tr className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                    <th className="px-4 py-2.5">{t(lang, "honeyHistory")}</th>
                    <th className="hidden px-4 py-2.5 sm:table-cell">Type</th>
                    <th className="px-4 py-2.5 text-right">{t(lang, "amount")}</th>
                    <th className="hidden px-4 py-2.5 text-right sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {transactions.map((tx) => {
                    const positive = tx.amount > 0;
                    return (
                      <tr key={tx.id} className="transition-colors hover:bg-muted/20">
                        <td className="max-w-[200px] truncate px-4 py-2.5 text-xs font-medium">{tx.reason}</td>
                        <td className="hidden px-4 py-2.5 sm:table-cell">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{tx.type}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={cn("font-bold tabular-nums", positive ? "text-price-up" : "text-destructive")}>
                            {positive ? "+" : ""}{tx.amount}
                          </span>
                        </td>
                        <td className="hidden px-4 py-2.5 text-right text-xs text-muted-foreground sm:table-cell">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
