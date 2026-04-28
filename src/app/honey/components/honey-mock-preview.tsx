"use client";

import {
  ArrowRight,
  Calendar,
  ClipboardList,
  Clock,
  Crown,
  Flame,
  HelpCircle,
  History,
  Info,
  Link2,
  Medal,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Ticket,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { t, type Language, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const MOCK_NAV_GROUPS: { id: string; labelKey: TranslationKey; items: { key: string; icon: typeof Trophy; labelKey: TranslationKey }[] }[] = [
  {
    id: "earn",
    labelKey: "tabGroupEarn",
    items: [
      { key: "missions", icon: ClipboardList, labelKey: "dailyMissions" },
      { key: "achievements", icon: Medal, labelKey: "achievements" },
    ],
  },
  {
    id: "rewards",
    labelKey: "tabGroupRewards",
    items: [
      { key: "shop", icon: ShoppingBag, labelKey: "honeyShop" },
      { key: "raffle", icon: Ticket, labelKey: "monthlyRaffle" },
    ],
  },
  {
    id: "community",
    labelKey: "tabGroupCommunity",
    items: [
      { key: "rankings", icon: Trophy, labelKey: "honeyLeaderboard" },
      { key: "referral", icon: Link2, labelKey: "referralLink" },
      { key: "activity", icon: History, labelKey: "activity" },
    ],
  },
];

const MOCK_GUIDE_HINT_CLASS =
  "pointer-events-none absolute right-2.5 top-2.5 inline-flex size-5 items-center justify-center rounded-full text-muted-foreground";

function MockHero({ lang }: { lang: Language }) {
  return (
    <div className="grid grid-cols-2 items-stretch gap-3 lg:grid-cols-4">
      {/* Honey card — distinguished by amber tint + larger value, but same width as siblings */}
      <div className="relative flex flex-col rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-4 dark:bg-amber-500/[0.06]">
        <div className="flex items-center gap-2.5 pr-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
            <span className="text-xl leading-none">🍯</span>
          </div>
          <p className="text-eyebrow text-amber-700 dark:text-amber-400">{t(lang, "honeyLabel")}</p>
        </div>
        <div className="flex flex-1 items-center py-2.5">
          <p className="text-h1 tabular-nums leading-none">1,250</p>
        </div>
        <p className="mt-auto text-meta tabular-nums">
          {t(lang, "honeyLifetimeEarned")}:{" "}
          <span className="font-semibold text-foreground">2,840</span>
        </p>
        <span aria-hidden className={MOCK_GUIDE_HINT_CLASS}>
          <HelpCircle className="size-3.5" />
        </span>
      </div>

      {/* Ticket */}
      <div className="relative flex flex-col rounded-xl border border-blue-500/20 bg-blue-500/[0.03] p-4 dark:bg-blue-500/[0.04]">
        <div className="flex items-center gap-2.5 pr-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
            <Ticket className="size-5" />
          </div>
          <p className="text-eyebrow">{t(lang, "ticketLabel")}</p>
        </div>
        <div className="flex flex-1 items-center py-2.5">
          <p className="text-h2 tabular-nums leading-none">3</p>
        </div>
        <p className="mt-auto text-meta tabular-nums">{t(lang, "ticketUseRaffle")}</p>
        <span aria-hidden className={MOCK_GUIDE_HINT_CLASS}>
          <Info className="size-3.5" />
        </span>
      </div>

      {/* Streak */}
      <div className="relative flex flex-col rounded-xl border border-orange-500/20 bg-orange-500/[0.03] p-4 dark:bg-orange-500/[0.04]">
        <div className="flex items-center gap-2.5 pr-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Flame className="size-5" />
          </div>
          <p className="text-eyebrow">{t(lang, "streakLabel")}</p>
        </div>
        <div className="flex flex-1 items-center py-2.5">
          <p className="text-h2 tabular-nums leading-none">
            {lang === "TH" ? "7 วัน" : lang === "JP" ? "7日" : "7 days"}
          </p>
        </div>
        <div className="mt-auto flex items-center gap-2">
          <span className="text-meta tabular-nums">+20 🍯{lang === "TH" ? "/วัน" : lang === "JP" ? "/日" : "/day"}</span>
          <span className="rounded bg-amber-500/15 px-1.5 py-px text-xs font-bold tabular-nums text-amber-600 dark:text-amber-400">2x</span>
        </div>
        <span aria-hidden className={MOCK_GUIDE_HINT_CLASS}>
          <HelpCircle className="size-3.5" />
        </span>
      </div>

      {/* Rank */}
      <div className="relative flex flex-col rounded-xl border border-purple-500/20 bg-purple-500/[0.03] p-4 dark:bg-purple-500/[0.04]">
        <div className="flex items-center gap-2.5 pr-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400">
            <Crown className="size-5" />
          </div>
          <p className="text-eyebrow">{t(lang, "rankLabel")}</p>
        </div>
        <div className="flex flex-1 items-center py-2.5">
          <p className="text-h2 leading-none">{lang === "TH" ? "โกลด์" : "Gold"}</p>
        </div>
        <div className="mt-auto space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[60%] rounded-full bg-purple-500 dark:bg-purple-400" />
            </div>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">60%</span>
          </div>
          <p className="text-meta tabular-nums">
            {lang === "TH" ? "อีก 2,000 pt → ไดมอนด์" : lang === "JP" ? "あと 2,000 ptで ダイヤモンド" : "2,000 pt to Diamond"}
          </p>
        </div>
        <span aria-hidden className={MOCK_GUIDE_HINT_CLASS}>
          <Info className="size-3.5" />
        </span>
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
    <div className="overflow-hidden rounded-xl border border-amber-500/25 bg-amber-500/[0.02] dark:bg-amber-500/[0.03]">
      <div className="border-b px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-eyebrow">
              {lang === "TH" ? "รายวัน" : lang === "JP" ? "デイリー" : "Daily"}
            </p>
            <h2 className="mt-0.5 text-h3">{t(lang, "dailyMissions")}</h2>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1 text-sm font-semibold text-muted-foreground">
            <Clock className="size-3.5" />
            <span className="font-mono tabular-nums">23:59:59</span>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[33%] rounded-full bg-primary" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-px bg-border/40 sm:grid-cols-2">
        {MOCK_MISSIONS.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="flex items-center gap-3.5 bg-background p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Icon className="size-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">{t(lang, m.label)}</p>
                <p className="mt-0.5 text-meta">+{m.reward} 🍯</p>
              </div>
              <div className="inline-flex h-8 items-center gap-1 rounded-lg border bg-background px-3 text-xs font-semibold">
                {lang === "TH" ? "ไปทำ" : lang === "JP" ? "進む" : "Go"}
                <ArrowRight className="size-3" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MockSidebarNav({ lang }: { lang: Language }) {
  return (
    <nav className="hidden lg:block lg:space-y-5">
      {MOCK_NAV_GROUPS.map((group, gi) => (
        <div key={group.id} className="space-y-1">
          <p className="px-2 text-eyebrow">{t(lang, group.labelKey)}</p>
          <div className="space-y-0.5">
            {group.items.map((item, i) => {
              const Icon = item.icon;
              const active = gi === 0 && i === 0;
              return (
                <div
                  key={item.key}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
                  <span>{t(lang, item.labelKey)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function MockMobileTabs({ lang }: { lang: Language }) {
  const allItems = MOCK_NAV_GROUPS.flatMap((g) => g.items);
  return (
    <div className="flex gap-0.5 overflow-x-auto rounded-lg bg-muted/30 p-1 scrollbar-none lg:hidden">
      {allItems.map((item, i) => {
        const Icon = item.icon;
        const active = i === 0;
        return (
          <div
            key={item.key}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3.5 py-2.5 text-xs font-medium sm:px-4",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground",
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

export function HoneyMockPreview({ lang }: { lang: Language }) {
  return (
    <div className="space-y-6">
      {/* Title/subtitle live in the page-level <PageHeader />.
          Action row only — event badge + check-in CTA preview. */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="inline-flex h-9 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 text-xs font-bold text-primary">
          <Sparkles className="size-3.5" />
          <span>2x {lang === "TH" ? "อีเวนต์โบนัส" : lang === "JP" ? "イベントボーナス" : "Event bonus"}</span>
        </div>
        <div className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm">
          <Calendar className="size-3.5" />
          {t(lang, "dailyCheckin")}
          <span className="rounded bg-white/20 px-1.5 py-px text-xs font-bold tabular-nums">+20 🍯</span>
        </div>
      </div>

      <MockHero lang={lang} />

      <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-8">
        <MockSidebarNav lang={lang} />
        <MockMobileTabs lang={lang} />
        <div className="mt-4 min-w-0 lg:mt-0">
          <MockMissionsGrid lang={lang} />
        </div>
      </div>
    </div>
  );
}

