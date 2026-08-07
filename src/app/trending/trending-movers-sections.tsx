import Link from "next/link";

import { ArrowLink } from "@/components/shared/arrow-link";
import { Surface } from "@/components/ui/surface";
import { getCardName, type Language } from "@/lib/i18n";
import {
  buildTrendingPeriodTitle,
  buildTrendingWorthCollectingCopy,
  type TrendingMoverKind,
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
  sections: { period: TrendingPeriodKey; kind: TrendingMoverKind; cards: TrendingCardRow[] }[];
}) {
  return (
    <>
      {sections.map(({ period, kind, cards }) => (
        <section key={period} className="space-y-3" data-slot={`trending-seo-${kind}-${period}`}>
          <h2 className="text-h3">{buildTrendingPeriodTitle(lang, period, kind)}</h2>
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

/**
 * "How to read this" explainer — SERVER component, same constraints as
 * `TrendingMoversSections` above (no hooks, always in the first HTML
 * response). Targets the Thai search intent "การ์ดวันพีซ น่าเก็บ / น่าลงทุน"
 * (SEO round 3) with a short factual explainer, not a buy/sell call — see
 * `buildTrendingWorthCollectingCopy` for the full reasoning.
 */
export function TrendingWorthCollectingSection({ lang }: { lang: Language }) {
  const copy = buildTrendingWorthCollectingCopy(lang);

  return (
    <section className="space-y-3" data-slot="trending-seo-worth-collecting">
      <h2 className="text-h2">{copy.h2}</h2>
      <div className="max-w-3xl space-y-3 text-body-sm leading-relaxed text-muted-foreground">
        {copy.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
        <p>
          <ArrowLink href={copy.linkHref}>{copy.linkLabel}</ArrowLink>
        </p>
        <p className="text-meta">{copy.disclaimer}</p>
      </div>
    </section>
  );
}
