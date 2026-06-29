"use client";

import { Calendar, Gift, ShieldCheck, Trophy, Ticket } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { localizedTitle } from "@/app/honey/types";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState as SharedEmptyState } from "@/components/shared/empty-state";
import { Surface } from "@/components/ui/surface";
import type { DrawnRaffleSummary } from "@/lib/honey/raffle-winners";

const LOCALE_MAP: Record<Language, string> = {
  TH: "th-TH",
  EN: "en-US",
  JP: "ja-JP",
};

function formatMonthHeading(month: string, lang: Language): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString(LOCALE_MAP[lang], {
    month: "long",
    year: "numeric",
  });
}

function formatDrawDate(iso: string, lang: Language): string {
  return new Date(iso).toLocaleDateString(LOCALE_MAP[lang], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function WinnersList({
  groups,
}: {
  groups: Array<{ month: string; raffles: DrawnRaffleSummary[] }>;
}) {
  const lang = useUIStore((s) => s.language);

  return (
    <div className="space-y-8">
      <Hero lang={lang} />

      {groups.length === 0 ? (
        <EmptyState lang={lang} />
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <MonthSection key={group.month} group={group} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}

function Hero({ lang }: { lang: Language }) {
  return (
    <PageHeader
      icon={ShieldCheck}
      title={t(lang, "winnersPageTitle")}
      description={t(lang, "winnersPageSubtitle")}
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-eyebrow text-primary">
          <ShieldCheck className="size-3" />
          {t(lang, "winnersTransparencyBadge")}
        </span>
      }
      actions={
        <div className="flex items-center gap-2 rounded-xl border border-transparent dark:border-[var(--p-hair)] bg-muted/30 px-3 py-2">
          <Trophy className="size-4 text-muted-foreground" />
          <p className="text-meta">{t(lang, "winnersUpdatedMonthly")}</p>
        </div>
      }
    />
  );
}

function EmptyState({ lang }: { lang: Language }) {
  return (
    <SharedEmptyState
      variant="panel"
      icon={Trophy}
      title={t(lang, "winnersEmpty")}
      description={t(lang, "winnersEmptyHint")}
    />
  );
}

function MonthSection({
  group,
  lang,
}: {
  group: { month: string; raffles: DrawnRaffleSummary[] };
  lang: Language;
}) {
  return (
    <section aria-labelledby={`winners-month-${group.month}`}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2
          id={`winners-month-${group.month}`}
          className="text-h3 capitalize"
        >
          {formatMonthHeading(group.month, lang)}
        </h2>
        <span className="text-eyebrow">
          {group.raffles.length === 1
            ? t(lang, "winnersMachineCountOne")
            : t(lang, "winnersMachineCountMany").replace(
                "{count}",
                String(group.raffles.length),
              )}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {group.raffles.map((raffle) => (
          <WinnerCard key={raffle.id} raffle={raffle} lang={lang} />
        ))}
      </div>
    </section>
  );
}

function WinnerCard({
  raffle,
  lang,
}: {
  raffle: DrawnRaffleSummary;
  lang: Language;
}) {
  const accent = raffle.color ?? undefined;
  const topPrize = raffle.prizes[0];
  const winnerName =
    raffle.winner.displayName?.trim() || t(lang, "anonymous");
  const isAnonymous = !raffle.winner.displayName?.trim();
  const heroImage = topPrize?.imageUrl ?? raffle.imageUrl ?? null;

  return (
    <Surface
      as="article"
      id={`raffle-${raffle.id}`}
      variant="panel"
      padding="none"
      className="ease-chrome relative flex h-full scroll-mt-24 flex-col overflow-hidden transition-colors hover:bg-muted/70"
      style={accent ? { borderTop: `3px solid ${accent}` } : undefined}
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted/20">
        {heroImage ? (
          <img
            src={heroImage}
            alt={topPrize?.name ?? localizedTitle(raffle, lang)}
            className="size-full object-contain p-4"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Gift className="size-12 text-muted-foreground/15" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 border-t border-[var(--p-hair)] p-4">
        <div>
          <p className="text-eyebrow">{t(lang, "monthlyRaffle")}</p>
          <h3
            className="mt-0.5 text-sm font-semibold leading-snug"
            style={accent ? { color: accent } : undefined}
          >
            {localizedTitle(raffle, lang)}
          </h3>
        </div>

        {topPrize && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-2">
            <Trophy className="size-3.5 shrink-0 text-muted-foreground" />
            <p className="min-w-0 flex-1 truncate text-xs font-medium">
              {topPrize.name}
            </p>
            {topPrize.honeyBonus != null && topPrize.honeyBonus > 0 && (
              <span className="shrink-0 text-xs font-bold text-primary">
                +{topPrize.honeyBonus}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 rounded-lg border border-[var(--p-hair)] bg-background px-3 py-2.5">
          <WinnerAvatar
            avatarUrl={raffle.winner.avatarUrl}
            name={winnerName}
            isAnonymous={isAnonymous}
          />
          <div className="min-w-0 flex-1">
            <p className="text-eyebrow">{t(lang, "winnersWinnerLabel")}</p>
            <p
              className={cn(
                "truncate text-sm font-semibold",
                isAnonymous && "italic text-muted-foreground",
              )}
            >
              {winnerName}
            </p>
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-[var(--p-hair)] pt-3">
          <div>
            <p className="text-meta">{t(lang, "winnersDrawnOn")}</p>
            <p className="flex items-center gap-1 text-xs font-semibold">
              <Calendar className="size-3 text-muted-foreground" />
              {formatDrawDate(raffle.drawnAt, lang)}
            </p>
          </div>
          <div>
            <p className="text-meta">{t(lang, "winnersTotalEntries")}</p>
            <p className="flex items-center gap-1 text-xs font-semibold">
              <Ticket className="size-3 text-muted-foreground" />
              {raffle.totalTickets.toLocaleString(LOCALE_MAP[lang])}
            </p>
          </div>
        </div>
      </div>
    </Surface>
  );
}

function WinnerAvatar({
  avatarUrl,
  name,
  isAnonymous,
}: {
  avatarUrl: string | null;
  name: string;
  isAnonymous: boolean;
}) {
  if (avatarUrl && !isAnonymous) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="size-10 shrink-0 rounded-full border border-[var(--p-hair)] object-cover"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-full border border-transparent dark:border-[var(--p-hair)] bg-muted text-xs font-semibold text-muted-foreground"
    >
      {isAnonymous ? "?" : getInitials(name)}
    </div>
  );
}
