"use client";

import { useEffect, useState } from "react";
import { Flame, Gift, Package, Ticket, Timer, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { RaffleData } from "../types";
import { localizedTitle } from "../types";

function useRaffleCountdown(targetDate: Date) {
  const [remaining, setRemaining] = useState(() => Math.max(0, targetDate.getTime() - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, targetDate.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

function endOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
}

export function RaffleTab({
  lang,
  raffle,
  myTickets,
  canClaimFree,
  points,
  onBuyTicket,
  onClaimFreeTicket,
}: {
  lang: Language;
  raffle: RaffleData | null;
  myTickets: number;
  canClaimFree: boolean;
  points: number;
  onBuyTicket: () => void;
  onClaimFreeTicket: () => void;
}) {
  const countdown = useRaffleCountdown(endOfMonth());

  if (!raffle) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
          <Ticket className="size-7 text-muted-foreground/30" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{t(lang, "raffleNone")}</p>
        <p className="text-xs text-muted-foreground/60">{t(lang, "raffleCheckBack")}</p>
      </div>
    );
  }

  const rankColors = [
    "from-amber-500/20 to-amber-600/5 border-amber-500/30",
    "from-slate-300/20 to-slate-400/5 border-slate-400/30",
    "from-orange-400/20 to-orange-500/5 border-orange-400/30",
  ];

  const rankIcons = [
    <Trophy key={0} className="size-7 text-amber-500" />,
    <Package key={1} className="size-6 text-slate-400" />,
    <Gift key={2} className="size-5 text-orange-400" />,
  ];

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="panel overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5">
        <div className="px-5 py-6 text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <Trophy className="size-7 text-primary" />
          </div>
          <h2 className="text-lg font-bold">{localizedTitle(raffle, lang)}</h2>
          {raffle.description && (
            <p className="mt-1 text-xs text-muted-foreground">{raffle.description}</p>
          )}

          {/* Countdown */}
          <div className="mt-4 flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Timer className="size-3.5" />
            <span>{t(lang, "raffleEndsIn")}:</span>
            <span className="ml-1 font-mono font-semibold tabular-nums text-foreground">
              {countdown.days}d {String(countdown.hours).padStart(2, "0")}:{String(countdown.minutes).padStart(2, "0")}:{String(countdown.seconds).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* Prizes */}
      <div className="grid gap-3 sm:grid-cols-3">
        {raffle.prizes.map((prize, i) => (
          <div
            key={i}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border bg-gradient-to-b p-4 text-center",
              rankColors[i] ?? "border-border bg-card",
            )}
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-card/80">
              {rankIcons[i] ?? <Gift className="size-5 text-muted-foreground" />}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {t(lang, i === 0 ? "raffleRank1" : i === 1 ? "raffleRank2" : "raffleRank3")}
            </span>
            <p className={cn("text-sm font-semibold", i === 0 && "text-base")}>{prize.name}</p>
            {prize.honeyBonus != null && prize.honeyBonus > 0 && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                +{prize.honeyBonus} Honey
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Stats + Actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="panel p-3 text-center">
              <p className="text-lg font-bold tabular-nums text-primary">{myTickets}</p>
              <p className="text-[10px] text-muted-foreground">{t(lang, "raffleMyTickets")}</p>
            </div>
            <div className="panel p-3 text-center">
              <p className="text-lg font-bold tabular-nums">{raffle.totalParticipants}</p>
              <p className="text-[10px] text-muted-foreground">{t(lang, "raffleParticipants")}</p>
            </div>
            <div className="panel p-3 text-center">
              <p className="text-lg font-bold tabular-nums">{raffle.totalTickets}</p>
              <p className="text-[10px] text-muted-foreground">{t(lang, "raffleTotalTickets")}</p>
            </div>
          </div>

          {/* Buy / Claim buttons */}
          <div className="panel p-4">
            <div className="flex gap-2">
              <Button
                onClick={onBuyTicket}
                disabled={points < raffle.ticketCost || myTickets >= raffle.maxTickets}
                className="flex-1 gap-1.5 border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15"
              >
                <Ticket className="size-4" />
                {t(lang, "raffleTicketCost")}: {raffle.ticketCost} pts
              </Button>
              {canClaimFree && (
                <Button
                  variant="outline"
                  onClick={onClaimFreeTicket}
                  className="flex-1 gap-1.5 border-primary/20 text-primary"
                >
                  <Gift className="size-4" /> {t(lang, "raffleFreeTicket")}
                </Button>
              )}
            </div>

            {!canClaimFree && (
              <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                <Flame className="size-3 text-primary/40" />
                {t(lang, "raffleStreakRequired")} ({raffle.freeThreshold} {t(lang, "days")})
              </div>
            )}
          </div>

          {/* How to Get Tickets */}
          <div className="panel p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t(lang, "raffleHowToGet")}
            </h3>
            <div className="space-y-2">
              {[
                { icon: Ticket, text: t(lang, "raffleBuyHint").replace("{cost}", String(raffle.ticketCost)).replace("{max}", String(raffle.maxTickets)) },
                { icon: Flame, text: t(lang, "raffleStreakHint").replace("{days}", String(raffle.freeThreshold)) },
                { icon: Gift, text: t(lang, "rafflePassHint") },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
                  <item.icon className="size-4 shrink-0 text-primary/60" />
                  <span className="text-xs">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* My Tickets Visual + Last Winner */}
        <div className="space-y-4">
          <div className="panel">
            <div className="border-b px-4 py-3">
              <h3 className="text-sm font-semibold">{t(lang, "raffleMyTickets")}</h3>
            </div>
            <div className="p-4">
              {myTickets > 0 ? (
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: myTickets }).map((_, i) => (
                    <div key={i} className="flex aspect-square items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Ticket className="size-4" />
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, raffle.maxTickets - myTickets) }).map((_, i) => (
                    <div key={`e${i}`} className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border/40 text-muted-foreground/20">
                      <Ticket className="size-4" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Ticket className="size-5 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">{t(lang, "raffleNoTickets")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Last Winner */}
          {raffle.lastWinner && (
            <div className="panel overflow-hidden">
              <div className="border-b px-4 py-3">
                <h3 className="text-sm font-semibold">{t(lang, "raffleWinner")}</h3>
              </div>
              <div className="flex items-center gap-3 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                  <Trophy className="size-5 text-amber-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {raffle.lastWinner.displayName ?? t(lang, "anonymous")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {raffle.lastWinner.month} — {raffle.lastWinner.prizeName}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
