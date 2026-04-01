"use client";

import {
  Calendar,
  Flame,
  History,
  ShoppingBag,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { t, type Language, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { HoneyTx } from "../types";
import { EmptyState } from "./empty-state";

const EARN_RULES = [
  { labelKey: "honeyEarnCheckin", pts: "+10", icon: Calendar },
  { labelKey: "honeyEarnMissions", pts: "+60/day", icon: Sparkles },
  { labelKey: "honeyEarnSell", pts: "+20", icon: ShoppingBag },
  { labelKey: "honeyEarnReview", pts: "+5", icon: Star },
  { labelKey: "honeyEarnRefer", pts: "+100", icon: Users },
  { labelKey: "honeyEarnStreak7", pts: "×2", icon: Flame, mult: true },
  { labelKey: "honeyEarnStreak30", pts: "×3", icon: Trophy, mult: true },
] as const;

export function ActivityTab({
  lang,
  transactions,
}: {
  lang: Language;
  transactions: HoneyTx[];
}) {
  return (
    <div className="space-y-4">
      {/* Full-width transaction history */}
      <div className="panel">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">{t(lang, "honeyHistory")}</h2>
        </div>
        {transactions.length === 0 ? (
          <EmptyState icon={History} label={t(lang, "noTransactions")} />
        ) : (
          <div className="divide-y divide-border/40">
            {transactions.map((tx) => <TxRow key={tx.id} tx={tx} />)}
          </div>
        )}
      </div>

      {/* How to Earn -- always visible */}
      <div className="panel">
        <div className="px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t(lang, "howToEarn")}</span>
        </div>
        <div className="grid gap-px border-t bg-border/40 sm:grid-cols-2">
          {EARN_RULES.map((rule) => {
            const Icon = rule.icon;
            const isMult = "mult" in rule && rule.mult;
            return (
              <div key={rule.labelKey} className="flex items-center gap-2 bg-background px-4 py-2">
                <Icon className={cn("size-3.5 shrink-0", isMult ? "text-primary" : "text-muted-foreground/60")} />
                <span className="flex-1 truncate text-[11px]">{t(lang, rule.labelKey as TranslationKey)}</span>
                <span className="shrink-0 text-[11px] font-bold tabular-nums text-primary">{rule.pts}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TxRow({ tx }: { tx: HoneyTx }) {
  const positive = tx.amount > 0;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", positive ? "bg-price-up/10 text-price-up" : "bg-destructive/10 text-destructive")}>
        {positive ? <Zap className="size-3" /> : <ShoppingBag className="size-3" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{tx.reason}</p>
        <p className="text-[10px] text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
      </div>
      <span className={cn("shrink-0 text-xs font-bold tabular-nums", positive ? "text-price-up" : "text-destructive")}>
        {positive ? "+" : ""}{tx.amount}
      </span>
    </div>
  );
}

