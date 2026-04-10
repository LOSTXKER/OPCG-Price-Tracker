"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Crown,
  Flame,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { HONEY_TABS } from "../types";

function MockStatusBar({ lang }: { lang: Language }) {
  return (
    <div className="panel">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <span className="text-base leading-none">🍯</span>
          </div>
          <p className="text-lg font-extrabold tabular-nums leading-tight text-primary">
            🍯 1,250
          </p>
        </div>

        <div className="hidden h-8 w-px bg-border sm:block" />

        <div className="flex items-center gap-2">
          <Flame className="size-4 text-orange-500" />
          <span className="text-sm font-extrabold tabular-nums">7</span>
          <span className="text-xs text-muted-foreground">{lang === "TH" ? "วัน" : "days"}</span>
          <span className="rounded px-1.5 py-0.5 text-xs font-black tabular-nums bg-primary/10 text-primary">2x</span>
        </div>

        <div className="hidden h-8 w-px bg-border sm:block" />

        <div className="flex items-center gap-2">
          <Crown className="size-4 text-primary" />
          <span className="text-sm font-extrabold text-primary">{lang === "TH" ? "โกลด์" : "Gold"}</span>
          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted sm:w-16">
            <div className="h-full w-[60%] rounded-full bg-primary" />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">3,000/5,000</span>
        </div>

        <div className="ml-auto shrink-0">
          <div className="flex items-center gap-1.5 rounded-lg bg-price-up/10 px-3 py-2 text-xs font-medium text-price-up">
            <CheckCircle2 className="size-3.5" />
            {t(lang, "checkinDone")}
          </div>
        </div>
      </div>
    </div>
  );
}

const MOCK_MISSIONS = [
  { icon: Search, label: "missionCheckPrice" as const, reward: 10 },
  { icon: TrendingUp, label: "missionBrowseTrending" as const, reward: 10 },
  { icon: Star, label: "missionVisitMarketplace" as const, reward: 10 },
] as const;

function MockMissionsGrid({ lang }: { lang: Language }) {
  return (
    <div className="panel overflow-hidden">
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="flex-1 text-sm font-bold">{t(lang, "dailyMissions")}</h2>
          <span className="text-sm font-bold tabular-nums text-primary">0/60</span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3" />
            <span className="font-mono tabular-nums">23:59:59</span>
          </div>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-0 rounded-full bg-primary" />
        </div>
      </div>
      <div className="flex gap-2 p-3">
        {MOCK_MISSIONS.map((m, i) => (
          <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-2 rounded-xl border border-transparent bg-muted/40 p-3 text-center">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <m.icon className="size-4.5" />
            </div>
            <p className="line-clamp-2 text-xs font-semibold leading-tight">
              {t(lang, m.label)}
            </p>
            <div className="mt-auto flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              {lang === "TH" ? "ไปทำ" : "Go"} <ArrowRight className="size-3" />
            </div>
          </div>
        ))}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-3 text-center">
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Star className="size-4.5" />
          </div>
          <p className="text-xs font-semibold leading-tight">Perfect Day!</p>
          <div className="mt-auto">
            <span className="text-xs font-medium tabular-nums text-muted-foreground">+20 🍯</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockTabs({ lang }: { lang: Language }) {
  return (
    <div className="flex gap-0.5 overflow-x-auto border-b border-border scrollbar-none">
      {HONEY_TABS.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={item.key}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium sm:px-4",
              i === 0 ? "border-primary text-foreground" : "border-transparent text-muted-foreground",
            )}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{t(lang, item.labelKey)}</span>
          </div>
        );
      })}
    </div>
  );
}

function MockHistory({ lang }: { lang: Language }) {
  return (
    <div className="panel overflow-hidden">
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
              <p className="text-xs text-muted-foreground">{row.date}</p>
            </div>
            <span className="shrink-0 text-xs font-bold tabular-nums text-price-up">{row.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HoneyMockPreview({ lang }: { lang: Language }) {
  return (
    <div className="space-y-4">
      <MockStatusBar lang={lang} />
      <MockTabs lang={lang} />
      <MockMissionsGrid lang={lang} />
    </div>
  );
}
