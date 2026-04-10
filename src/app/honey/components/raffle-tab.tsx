"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  ChevronRight,
  Clock,
  Flame,
  Gift,
  Package,
  ShoppingBag,
  Ticket,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { RaffleData, RaffleWinner } from "../types";
import { localizedTitle } from "../types";

function useMonthCountdown() {
  const [label, setLabel] = useState("");
  useEffect(() => {
    function calc() {
      const now = new Date();
      const eom = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const diff = Math.max(0, eom.getTime() - now.getTime());
      const d = Math.floor(diff / 86_400_000);
      const h = String(Math.floor((diff % 86_400_000) / 3_600_000)).padStart(2, "0");
      const m = String(Math.floor((diff % 3_600_000) / 60_000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60_000) / 1_000)).padStart(2, "0");
      return `${d}d ${h}:${m}:${s}`;
    }
    setLabel(calc());
    const id = setInterval(() => setLabel(calc()), 1_000);
    return () => clearInterval(id);
  }, []);
  return label;
}

const RANK_COLORS = ["text-amber-500", "text-slate-400", "text-orange-400"];

function drawDateFromMonth(month: string): Date {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0, 23, 59, 59);
}

function PrizeImageViewer({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
      >
        <X className="size-5" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export function RaffleTab({
  lang,
  machines,
  myTickets,
  ticketBalance,
  canClaimFree,
  lastWinners,
  onBuyTicket,
  onClaimFreeTicket,
}: {
  lang: Language;
  machines: RaffleData[];
  myTickets: Record<number, number>;
  ticketBalance: number;
  canClaimFree: boolean;
  lastWinners: RaffleWinner[];
  onBuyTicket: (raffleId: number) => void;
  onClaimFreeTicket: () => void;
}) {
  const countdown = useMonthCountdown();
  const [viewingImage, setViewingImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const [confirmingBuyId, setConfirmingBuyId] = useState<number | null>(null);

  if (machines.length === 0) {
    return (
      <div className="panel flex flex-col items-center gap-3 py-14 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
          <Ticket className="size-7 text-muted-foreground/30" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {t(lang, "raffleNone")}
        </p>
        <p className="text-xs text-muted-foreground/60">
          {t(lang, "raffleCheckBack")}
        </p>
      </div>
    );
  }

  const firstMachine = machines[0];

  return (
    <div className="space-y-5">
      {viewingImage && (
        <PrizeImageViewer
          src={viewingImage.src}
          alt={viewingImage.alt}
          onClose={() => setViewingImage(null)}
        />
      )}

      {/* Header */}
      <div className="panel overflow-hidden">
        <div className="flex items-start justify-between gap-2 px-4 py-3.5">
          <div>
            <h2 className="text-sm font-bold">{t(lang, "monthlyRaffle")}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{t(lang, "raffleMachineSubtitle")}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            <span className="font-mono tabular-nums">{countdown}</span>
          </div>
        </div>
      </div>

      {/* Machine card grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {machines.map((machine) => {
          const tix = myTickets[machine.id] ?? 0;
          const full = tix >= machine.maxTickets;
          const chance =
            machine.totalTickets > 0
              ? ((tix / machine.totalTickets) * 100).toFixed(1)
              : "0";
          const accent = machine.color ?? undefined;
          const drawDate = drawDateFromMonth(machine.month);
          const drawDateStr = drawDate.toLocaleDateString(
            lang === "TH" ? "th-TH" : lang === "JP" ? "ja-JP" : "en-US",
            { day: "numeric", month: "short", year: "numeric" },
          );
          const canUse = ticketBalance >= 1 && !full;

          return (
            <div key={machine.id} className="group/card block">
              <div className="panel relative flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                {/* Hero image */}
                <div className="aspect-[4/3] w-full overflow-hidden bg-muted/20">
                  {machine.imageUrl ? (
                    <img
                      src={machine.imageUrl}
                      alt={localizedTitle(machine, lang)}
                      className="size-full object-contain p-4 transition-transform duration-300 group-hover/card:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="size-12 text-muted-foreground/15" />
                    </div>
                  )}
                </div>

                {/* Info section */}
                <div className="flex flex-1 flex-col border-t border-border/30 p-4">
                  <h3
                    className="text-sm font-semibold leading-snug transition-colors group-hover/card:text-primary"
                    style={accent ? { color: accent } : undefined}
                  >
                    {localizedTitle(machine, lang)}
                  </h3>

                  {machine.description && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {machine.description}
                    </p>
                  )}

                  {/* Prizes */}
                  <div className="mt-3 border-t border-border/30 pt-3">
                    <div className="space-y-2">
                      {machine.prizes.map((prize, i) => (
                        <div key={prize.rank} className="flex items-center gap-2.5">
                          <Trophy
                            className={cn(
                              "size-3.5 shrink-0",
                              RANK_COLORS[i] ?? "text-muted-foreground",
                            )}
                          />
                          {prize.imageUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                setViewingImage({
                                  src: prize.imageUrl!,
                                  alt: prize.name,
                                })
                              }
                              className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-muted transition-transform hover:scale-110"
                            >
                              <img
                                src={prize.imageUrl}
                                alt={prize.name}
                                className="size-full object-contain"
                              />
                            </button>
                          ) : (
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                              <Gift className="size-4 text-muted-foreground/40" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium leading-snug">
                              {prize.name}
                            </p>
                            {prize.honeyBonus != null && prize.honeyBonus > 0 && (
                              <p className="text-xs font-bold text-primary">
                                +{prize.honeyBonus} 🍯
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border/30 pt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{t(lang, "raffleDrawDate")}</p>
                      <p className="flex items-center gap-1 text-xs font-semibold">
                        <Calendar className="size-3 text-muted-foreground" />
                        {drawDateStr}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t(lang, "raffleMyTickets")}</p>
                      <p className="text-xs font-semibold">{tix} / {machine.maxTickets}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t(lang, "raffleTotalTickets")}</p>
                      <p className="text-xs font-semibold">{machine.totalTickets}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t(lang, "raffleParticipants")}</p>
                      <p className="flex items-center gap-1 text-xs font-semibold">
                        <Users className="size-3 text-muted-foreground" />
                        {machine.totalParticipants}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t(lang, "raffleWinChance")}</p>
                      <p className="text-xs font-semibold text-primary">{chance}%</p>
                    </div>
                  </div>

                  {/* Use ticket CTA */}
                  <div className="mt-3 border-t border-border/30 pt-3">
                    <p className="mb-2 text-center text-xs text-muted-foreground">
                      {t(lang, "raffleEntriesOutOf")
                        .replace("{my}", String(tix))
                        .replace("{total}", String(machine.totalTickets))}
                    </p>

                    {confirmingBuyId === machine.id ? (
                      <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                        <p className="text-xs font-semibold">
                          {t(lang, "raffleUseConfirm")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t(lang, "raffleUseConfirmDesc")
                            .replace("{remaining}", String(ticketBalance - 1))}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              onBuyTicket(machine.id);
                              setConfirmingBuyId(null);
                            }}
                            className="h-8 flex-1 gap-1 text-xs"
                          >
                            <Ticket className="size-3" />
                            {t(lang, "raffleConfirm")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmingBuyId(null)}
                            className="h-8 flex-1 text-xs"
                          >
                            {t(lang, "raffleCancel")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setConfirmingBuyId(machine.id)}
                        disabled={!canUse}
                        className="h-8 w-full gap-1.5 border border-primary/20 bg-primary/10 text-xs font-semibold text-primary hover:bg-primary/15"
                        style={
                          accent && canUse
                            ? {
                                borderColor: `${accent}30`,
                                backgroundColor: `${accent}15`,
                                color: accent,
                              }
                            : undefined
                        }
                      >
                        <Ticket className="size-3.5" />
                        {full
                          ? t(lang, "raffleSoldOut")
                          : ticketBalance < 1
                            ? t(lang, "raffleNoTicketsMsg")
                            : t(lang, "raffleUseTicket")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Free Ticket CTA */}
      {canClaimFree && (
        <div className="panel overflow-hidden">
          <div className="flex items-center gap-3.5 px-4 py-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
              <Gift className="size-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold">
                {t(lang, "raffleFreeAvailable")}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => onClaimFreeTicket()}
              className="shrink-0 gap-1 text-xs"
            >
              <Gift className="size-3.5" /> {t(lang, "raffleClaimFreeTicket")}
            </Button>
          </div>
        </div>
      )}

      {!canClaimFree && (
        <div className="flex items-center gap-2 rounded-xl bg-muted/30 px-3.5 py-2.5 text-xs text-muted-foreground">
          <Gift className="size-3.5 text-rose-500/40" />
          {t(lang, "raffleFreeClaimed")}
        </div>
      )}

      {/* How to get tickets */}
      <div className="panel overflow-hidden">
        <div className="border-b px-4 py-3.5">
          <h2 className="text-sm font-bold">{t(lang, "raffleHowToGet")}</h2>
        </div>
        <div className="divide-y divide-border/40">
          {[
            { icon: ShoppingBag, text: t(lang, "ticketMethodBuy") },
            {
              icon: Flame,
              text: t(lang, "raffleStreakHint").replace(
                "{days}",
                String(firstMachine.freeThreshold),
              ),
            },
            { icon: Gift, text: t(lang, "ticketMethodMission") },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3.5 px-4 py-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <item.icon className="size-4.5" />
              </div>
              <p className="min-w-0 flex-1 text-xs text-muted-foreground">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Past Winners */}
      {lastWinners.length > 0 && (
        <details className="group rounded-xl border">
          <summary className="flex cursor-pointer items-center justify-between px-4 py-2.5 text-xs font-semibold text-muted-foreground">
            {t(lang, "raffleWinner")}
            <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" />
          </summary>
          <div className="divide-y px-1 pb-1">
            {lastWinners.map((w, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2">
                <Trophy className="size-3.5 shrink-0 text-amber-500" />
                <span className="truncate text-xs font-medium">
                  {w.displayName ?? t(lang, "anonymous")}
                </span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {w.month} — {w.prizeName}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
