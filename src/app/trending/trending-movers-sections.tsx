import Link from "next/link";

import { Surface } from "@/components/ui/surface";
import { getCardName, type Language } from "@/lib/i18n";
import {
  buildTrendingPeriodTitle,
  type TrendingPeriodKey,
} from "@/lib/seo/copy/tools";
import { formatThb, jpyToThb } from "@/lib/utils/currency";

import type { TrendingCardRow } from "./page";

/**
 * SERVER component — no hooks, no `useSearchParams`, no fetch. The three
 * period sections below are therefore always present in the first HTML
 * response, which is what the interactive (client) table above cannot
 * guarantee for every crawler.
 */
export function TrendingMoversSections({
  lang,
  sections,
}: {
  lang: Language;
  sections: { period: TrendingPeriodKey; cards: TrendingCardRow[] }[];
}) {
  return (
    <>
      {sections.map(({ period, cards }) => (
        <section key={period} className="space-y-3" data-slot={`trending-seo-${period}`}>
          <h2 className="text-h3">{buildTrendingPeriodTitle(lang, period)}</h2>
          <Surface variant="panel" padding="none" className="overflow-hidden">
            <ol className="divide-y divide-hair">
              {cards.map((card, index) => (
                <li key={card.cardCode}>
                  <Link
                    href={`/opcg/cards/${card.cardCode}`}
                    className="flex items-center gap-3 px-4 py-2.5 ease-chrome transition-colors hover:bg-muted/70"
                  >
                    <span className="w-5 shrink-0 text-center text-code text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body-sm font-medium">
                        {getCardName(lang, card)}
                      </span>
                      <span className="text-meta">
                        {card.baseCode ?? card.cardCode} · {card.setCode.toUpperCase()} · {card.rarity}
                      </span>
                    </span>
                    {/* THB only — owner ruling 2026-08-06 ("ไม่เอาเยน"):
                        no yen line in user-facing copy. */}
                    <span className="shrink-0 text-right">
                      <span className="block text-body-sm tabular-nums">
                        {card.latestPriceJpy != null
                          ? formatThb(Math.round(jpyToThb(card.latestPriceJpy)))
                          : "—"}
                      </span>
                      <span className="text-meta tabular-nums">
                        {formatChange(changeFor(card, period))}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </Surface>
        </section>
      ))}
    </>
  );
}

function changeFor(card: TrendingCardRow, period: TrendingPeriodKey): number | null {
  if (period === "24h") return card.priceChange24h;
  if (period === "7d") return card.priceChange7d;
  return card.priceChange30d;
}

function formatChange(value: number | null): string {
  if (value == null) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}
