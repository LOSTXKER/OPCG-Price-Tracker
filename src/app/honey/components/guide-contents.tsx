"use client";

import { ClipboardList, Coins, Flame, Ticket } from "lucide-react";

import { cn } from "@/lib/utils";
import { t, type Language } from "@/lib/i18n";
import { STREAK_TIERS } from "@/lib/honey/streak";

function dayLabel(lang: Language, n: number) {
  if (lang === "TH") return `${n} วัน`;
  if (lang === "JP") return `${n}日`;
  return n === 1 ? `${n} day` : `${n} days`;
}

/** Popover body for the Ticket stat card — how to earn + how to spend tickets. */
export function TicketGuideContent({ lang }: { lang: Language }) {
  const earnMethods = [
    { icon: Coins, label: t(lang, "ticketMethodBuy") },
    { icon: Flame, label: t(lang, "ticketMethodFree") },
    { icon: ClipboardList, label: t(lang, "ticketMethodMission") },
  ];

  return (
    <>
      <p className="mb-2 text-xs font-semibold text-foreground">
        {t(lang, "raffleHowToGet")}
      </p>
      <div className="space-y-1.5">
        {earnMethods.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 rounded-md px-2 py-1 text-meta">
            <Icon className="size-3.5 shrink-0" />
            <span className="flex-1">{label}</span>
          </div>
        ))}
      </div>

      <p className="mb-2 mt-3 border-t pt-2 text-xs font-semibold text-foreground">
        {t(lang, "howToUseTicket")}
      </p>
      <div className="flex items-center gap-2 rounded-md px-2 py-1 text-meta">
        <Ticket className="size-3.5 shrink-0" />
        <span className="flex-1">{t(lang, "ticketUseRaffle")}</span>
      </div>
    </>
  );
}

/** Popover body for the Streak stat card — the multiplier tiers + reward per day. */
export function StreakGuideContent({ lang }: { lang: Language }) {
  return (
    <>
      <p className="mb-2 text-xs font-semibold text-foreground">
        {t(lang, "streakInfoTitle")}
      </p>
      <div className="space-y-1.5">
        {STREAK_TIERS.map((tier, i) => (
          <div key={i} className="flex items-center gap-2 rounded-md px-2 py-1 text-xs">
            <span className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-black",
              i === 0 ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
            )}>
              {tier.mult}x
            </span>
            <span className="flex-1 text-muted-foreground">
              {i === 0 ? t(lang, "streakInfoStart") : `${dayLabel(lang, tier.min)}+`}
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              +{tier.reward} 🍯
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 border-t pt-2 text-meta">
        {t(lang, "streakInfoDesc")}
      </p>
    </>
  );
}
