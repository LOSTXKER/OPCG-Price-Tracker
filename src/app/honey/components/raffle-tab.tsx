"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Clock,
  Gift,
  Package,
  Ticket,
  Trophy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { t, getLocale, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { RaffleData, RaffleWinner } from "../types";
import { localizedTitle } from "../types";
import { HeaderPill, SectionHeader } from "./_shared/section-header";

function useRaffleCountdown() {
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
    const update = () => setLabel(calc());
    const first = setTimeout(update, 0);
    const id = setInterval(update, 1_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return label;
}

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
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white motion-base hover:bg-white/20"
      >
        <X className="size-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
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
  const countdown = useRaffleCountdown();
  const [viewingImage, setViewingImage] = useState<{ src: string; alt: string } | null>(null);
  const [confirmingBuyId, setConfirmingBuyId] = useState<number | null>(null);

  if (machines.length === 0) {
    return (
      <Surface variant="panel" className="flex flex-col items-center gap-2 py-14 text-center">
        <Ticket className="size-7 text-muted-foreground/30" />
        <p className="text-sm font-medium">{t(lang, "raffleNone")}</p>
        <p className="text-meta">{t(lang, "raffleCheckBack")}</p>
      </Surface>
    );
  }

  return (
    <div className="space-y-4">
      {viewingImage && (
        <PrizeImageViewer
          src={viewingImage.src}
          alt={viewingImage.alt}
          onClose={() => setViewingImage(null)}
        />
      )}

      <SectionHeader
        title={t(lang, "monthlyRaffle")}
        description={t(lang, "raffleMachineSubtitle")}
        pill={
          <HeaderPill icon={Clock} tone="primary">
            <span className="font-mono">{countdown}</span>
          </HeaderPill>
        }
      />

      <RecentWinnersStrip lang={lang} winners={lastWinners} />

      {canClaimFree && (
        <Surface variant="outline" className="flex items-center gap-3 p-3.5">
          <Gift className="size-4 shrink-0 text-primary" />
          <p className="min-w-0 flex-1 text-xs font-semibold">
            {t(lang, "raffleFreeAvailable")}
          </p>
          <Button
            size="sm"
            onClick={() => onClaimFreeTicket()}
            className="h-8 shrink-0 gap-1 text-xs"
          >
            <Gift className="size-3.5" /> {t(lang, "raffleClaimFreeTicket")}
          </Button>
        </Surface>
      )}

      {/* Machine card grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {machines.map((machine) => (
          <MachineCard
            key={machine.id}
            lang={lang}
            machine={machine}
            myTickets={myTickets[machine.id] ?? 0}
            ticketBalance={ticketBalance}
            confirming={confirmingBuyId === machine.id}
            onConfirm={() => {
              onBuyTicket(machine.id);
              setConfirmingBuyId(null);
            }}
            onCancelConfirm={() => setConfirmingBuyId(null)}
            onStartConfirm={() => setConfirmingBuyId(machine.id)}
            onViewImage={setViewingImage}
          />
        ))}
      </div>

    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recent winners — compact social-proof strip                        */
/* ------------------------------------------------------------------ */

/**
 * Horizontal scrolling card rail that lives directly under the raffle
 * header. Previous iterations put the winners list at the very bottom
 * of the tab, which meant nobody scrolled that far to see it. Hoisting
 * it near the top (with a "View all" link) turns it into social proof
 * right where the user is making their "should I buy a ticket?" call.
 */
function RecentWinnersStrip({
  lang,
  winners,
}: {
  lang: Language;
  winners: RaffleWinner[];
}) {
  return (
    <Surface
      as="section"
      variant="panel"
      aria-label={t(lang, "raffleWinner")}
      className="overflow-hidden"
    >
      <header className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Trophy className="size-3.5 text-primary" />
          <p className="text-eyebrow">{t(lang, "raffleWinner")}</p>
        </div>
        <Link
          href="/raffle/winners"
          className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs font-semibold text-primary ease-chrome hover:bg-muted/70"
        >
          {t(lang, "winnersViewAll")}
          <ArrowRight className="size-3" />
        </Link>
      </header>

      {winners.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto scrollbar-none px-3 py-2.5">
          {winners.slice(0, 8).map((w, i) => (
            <Surface
              as="article"
              variant="outline"
              key={i}
              className="flex min-w-[180px] max-w-[220px] shrink-0 flex-col gap-0.5 px-3 py-2"
            >
              <p className="truncate text-xs font-semibold leading-tight">
                {w.prizeName}
              </p>
              <p className="truncate text-meta">
                {w.displayName ?? t(lang, "anonymous")}
                <span className="mx-1.5 text-border">·</span>
                <span className="tabular-nums">{w.month}</span>
              </p>
            </Surface>
          ))}
        </div>
      ) : (
        <p className="px-4 py-3.5 text-meta">{t(lang, "winnersEmpty")}</p>
      )}
    </Surface>
  );
}

/* ------------------------------------------------------------------ */
/*  Single machine card (slimmed)                                      */
/* ------------------------------------------------------------------ */

function MachineCard({
  lang,
  machine,
  myTickets,
  ticketBalance,
  confirming,
  onConfirm,
  onCancelConfirm,
  onStartConfirm,
  onViewImage,
}: {
  lang: Language;
  machine: RaffleData;
  myTickets: number;
  ticketBalance: number;
  confirming: boolean;
  onConfirm: () => void;
  onCancelConfirm: () => void;
  onStartConfirm: () => void;
  onViewImage: (img: { src: string; alt: string }) => void;
}) {
  const accent = machine.color ?? undefined;
  const drawDate = drawDateFromMonth(machine.month);
  const drawDateStr = drawDate.toLocaleDateString(
    getLocale(lang),
    { day: "numeric", month: "short" },
  );
  const isDrawn = Boolean(machine.drawnAt);
  const canUse = ticketBalance >= 1;
  const drawnAtStr = machine.drawnAt
    ? new Date(machine.drawnAt).toLocaleDateString(
        getLocale(lang),
        { day: "numeric", month: "short", year: "numeric" },
      )
    : null;
  const winnerName =
    machine.winner?.displayName?.trim() || t(lang, "anonymous");
  const isAnonymous = !machine.winner?.displayName?.trim();

  return (
    <Surface variant="panel" interactive className="relative flex h-full flex-col overflow-hidden ease-chrome transition-colors">
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted/20">
        {machine.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={machine.imageUrl}
            alt={localizedTitle(machine, lang)}
            className="size-full object-contain p-4 transition-transform duration-[var(--dur-slow)] hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="size-12 text-muted-foreground/15" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3
            className="text-h5 leading-snug"
            style={accent ? { color: accent } : undefined}
          >
            {localizedTitle(machine, lang)}
          </h3>
          {isDrawn ? (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-eyebrow text-primary">
              <Trophy className="size-3" />
              {t(lang, "raffleWinnerAnnounced")}
            </span>
          ) : (
            <p className="mt-0.5 flex items-center gap-1 text-meta">
              <Calendar className="size-3" />
              <span>
                {t(lang, "raffleDrawDate")}: <span className="tabular-nums">{drawDateStr}</span>
              </span>
            </p>
          )}
        </div>

        {/* Prizes */}
        <ul className="space-y-1.5">
          {machine.prizes.map((prize) => (
            <li key={prize.rank} className="flex items-center gap-2.5">
              <span className="inline-flex size-5 shrink-0 items-center justify-center text-xs font-bold tabular-nums text-muted-foreground">
                {prize.rank}
              </span>
              {prize.imageUrl ? (
                <button
                  type="button"
                  onClick={() => onViewImage({ src: prize.imageUrl!, alt: prize.name })}
                  className="size-9 shrink-0 overflow-hidden rounded-lg bg-muted transition-transform hover:scale-105"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={prize.imageUrl}
                    alt={prize.name}
                    className="size-full object-contain"
                  />
                </button>
              ) : (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Gift className="size-4 text-muted-foreground/40" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{prize.name}</p>
                {prize.honeyBonus != null && prize.honeyBonus > 0 && (
                  <p className="text-xs font-semibold text-primary">
                    +{prize.honeyBonus} 🍯
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {isDrawn ? (
          <>
            <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2.5">
              {machine.winner?.avatarUrl && !isAnonymous ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={machine.winner.avatarUrl}
                  alt={winnerName}
                  className="size-9 shrink-0 rounded-full border border-hair object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full border border-transparent dark:border-hair bg-muted text-xs font-semibold text-muted-foreground"
                >
                  {isAnonymous ? "?" : winnerName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate text-sm font-semibold",
                    isAnonymous && "italic text-muted-foreground",
                  )}
                >
                  {winnerName}
                </p>
                {drawnAtStr && (
                  <p className="text-meta">
                    {t(lang, "raffleDrawn")} · <span className="tabular-nums">{drawnAtStr}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="mt-auto">
              <Button
                size="sm"
                render={<Link href={`/raffle/winners#raffle-${machine.id}`} />}
                className="h-9 w-full gap-1.5 text-xs font-semibold"
                style={accent ? { backgroundColor: accent, color: "#fff" } : undefined}
              >
                <Trophy className="size-3.5" />
                {t(lang, "raffleViewResult")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-center">
              <div className="flex flex-col gap-0.5">
                <p className="text-meta">{t(lang, "raffleMyTickets")}</p>
                <p className="text-sm font-semibold tabular-nums">{myTickets}</p>
              </div>
              <div className="flex flex-col gap-0.5 border-l">
                <p className="text-meta">{t(lang, "raffleTotalTickets")}</p>
                <p className="text-sm font-semibold tabular-nums">
                  {machine.totalTickets}
                </p>
              </div>
            </div>

            <div className="mt-auto">
              {confirming ? (
                <Surface variant="outline" className="space-y-2 p-2.5">
                  <p className="text-xs font-semibold">
                    {t(lang, "raffleUseConfirm")}
                  </p>
                  <p className="text-meta">
                    {t(lang, "raffleUseConfirmDesc")
                      .replace("{remaining}", String(ticketBalance - 1))}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={onConfirm}
                      className="h-8 flex-1 gap-1 text-xs"
                    >
                      <Ticket className="size-3" />
                      {t(lang, "raffleConfirm")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onCancelConfirm}
                      className="h-8 flex-1 text-xs"
                    >
                      {t(lang, "raffleCancel")}
                    </Button>
                  </div>
                </Surface>
              ) : (
                <Button
                  size="sm"
                  onClick={onStartConfirm}
                  disabled={!canUse}
                  className={cn(
                    "h-9 w-full gap-1.5 text-xs font-semibold",
                    canUse
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground",
                  )}
                  style={
                    accent && canUse
                      ? { backgroundColor: accent, color: "#fff" }
                      : undefined
                  }
                >
                  <Ticket className="size-3.5" />
                  {ticketBalance < 1
                    ? t(lang, "raffleNoTicketsMsg")
                    : t(lang, "raffleUseTicket")}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Surface>
  );
}
