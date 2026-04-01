"use client";

import {
  Award,
  CheckCircle2,
  Clock,
  Flame,
  Gift,
  Lock,
  Search,
  Share2,
  ShoppingBag,
  Sparkles,
  Ticket,
  TrendingUp,
  Zap,
} from "lucide-react";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { HONEY_TABS } from "../types";

export function HoneyMockPreview({ lang }: { lang: Language }) {
  return (
    <div className="space-y-5">
      <div className="panel overflow-hidden">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Award className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Honey</p>
              <p className="text-2xl font-extrabold tabular-nums text-primary sm:text-3xl">1,250</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1">
              <Flame className="size-3.5 text-primary" />
              <span className="text-xs font-bold tabular-nums text-primary">7</span>
              <span className="text-[10px] text-primary/60">{t(lang, "days")}</span>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">GOLD</span>
          </div>
          <div className="shrink-0">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-price-up" />
              {t(lang, "checkinDone")}
            </span>
          </div>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">{t(lang, "dailyMissions")}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-3" />
              <span className="font-mono text-[11px] tabular-nums">18:30:00</span>
            </div>
            <span className="text-[11px] font-bold tabular-nums text-primary">10/60</span>
          </div>
        </div>
        <div className="divide-y divide-border/40">
          {([
            { done: true, claimed: true, label: t(lang, "missionCheckPrice"), hint: t(lang, "missionCheckPriceHint"), icon: Search, bonus: false },
            { done: true, claimed: false, label: t(lang, "missionBrowseTrending"), hint: t(lang, "missionBrowseTrendingHint"), icon: TrendingUp, bonus: false },
            { done: false, claimed: false, label: t(lang, "missionVisitMarketplace"), hint: t(lang, "missionVisitMarketplaceHint"), icon: ShoppingBag, bonus: false },
            { done: false, claimed: false, label: t(lang, "missionShareCard"), hint: t(lang, "missionShareCardHint"), icon: Share2, bonus: true },
          ]).map((task, i) => {
            const Icon = task.icon;
            return (
              <div key={i} className={cn("flex items-center gap-3 px-4 py-3", task.claimed && "bg-price-up/5")}>
                <div className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full border-2",
                  task.claimed ? "border-price-up bg-price-up/10 text-price-up" : task.done ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted text-muted-foreground",
                )}>
                  {task.claimed ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {task.bonus && <span className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">{t(lang, "missionBonusLabel")}</span>}
                    <p className="text-[12px] font-medium leading-tight">{task.label}</p>
                  </div>
                  <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{task.hint}</p>
                </div>
                <div className="shrink-0">
                  {task.claimed ? (
                    <span className="flex items-center gap-1 rounded-full bg-price-up/10 px-2.5 py-1 text-[11px] font-semibold text-price-up"><CheckCircle2 className="size-3" /> +10</span>
                  ) : task.done ? (
                    <span className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary"><Gift className="size-3" /> +10</span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"><Lock className="size-3" /> +10</span>
                  )}
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-border bg-muted text-muted-foreground">
              <Sparkles className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium leading-tight">{t(lang, "missionPerfectDay")}</p>
              <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{t(lang, "missionPerfectDayHint")}</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"><Lock className="size-3" /> +20</span>
          </div>
        </div>
        <div className="border-t px-4 py-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground/60">{t(lang, "missionAutoHint")}</p>
            <span className="text-[11px] font-bold tabular-nums text-muted-foreground">10/60 Honey</span>
          </div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted/50 p-1 scrollbar-none">
        {HONEY_TABS.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium",
                i === 0 ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {t(lang, item.labelKey)}
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="panel lg:col-span-2">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">{t(lang, "honeyHistory")}</h2>
          </div>
          <div className="divide-y divide-border/40">
            {[
              { reason: t(lang, "dailyCheckin"), amount: "+10", date: "3/28/2026" },
              { reason: t(lang, "dailyMissions"), amount: "+10", date: "3/27/2026" },
              { reason: t(lang, "dailyCheckin"), amount: "+10", date: "3/27/2026" },
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-price-up/10 text-price-up">
                  <Zap className="size-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{row.reason}</p>
                  <p className="text-[10px] text-muted-foreground">{row.date}</p>
                </div>
                <span className="shrink-0 text-xs font-bold tabular-nums text-price-up">{row.amount}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-4">
          <div className="mb-3 flex items-center gap-2">
            <Ticket className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">{t(lang, "monthlyRaffle")}</h3>
          </div>
          <p className="text-xs text-muted-foreground">{t(lang, "raffleNone")}</p>
        </div>
      </div>
    </div>
  );
}
