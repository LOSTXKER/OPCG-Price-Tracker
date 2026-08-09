import Image from "next/image";
import { TrendingDown, TrendingUp, Zap, AlertTriangle } from "lucide-react";

import { ArrowLink } from "@/components/shared/arrow-link";
import { RarityBadge } from "@/components/shared/rarity-badge";
import { Badge } from "@/components/ui/badge";
import { ListRow } from "@/components/ui/list-row";
import { PriceTag } from "@/components/ui/price-tag";
import { Surface } from "@/components/ui/surface";
import { BLUR_DATA_URL } from "@/lib/constants/ui";
import { getCardName, type Language } from "@/lib/i18n";
import {
  buildTrendingPeriodTitle,
  buildTrendingWorthCollectingCopy,
  type TrendingMoverKind,
  type TrendingPeriodKey,
} from "@/lib/seo/copy/tools";
import { formatThb, jpyToThb } from "@/lib/utils/currency";

import type { TrendingCardRow } from "./page";

const PERIOD_LABEL: Record<TrendingPeriodKey, string> = {
  "24h": "24 ชม.",
  "7d": "7 วัน",
  "30d": "30 วัน",
};

/**
 * SERVER component — no hooks, no `useSearchParams`, no fetch. The three
 * period sections below are therefore always present in the first HTML
 * response, which is what the interactive (client) table above cannot
 * guarantee for every crawler.
 *
 * Rows use the canonical `ListRow` (with a real card thumbnail) instead of a
 * hand-rolled text-only `<li>` — the old version was plain text and read as
 * a duplicate of the table above; the thumbnail + kind badge give each
 * section its own visual identity (เบส "ไม่สวย" pass, 2026-08-09).
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
      {sections.map(({ period, kind, cards }) => {
        const isGainer = kind === "gainers";
        return (
          <section key={period} className="space-y-3" data-slot={`trending-seo-${kind}-${period}`}>
            <div className="flex items-center gap-2">
              <h2 className="text-h3">{buildTrendingPeriodTitle(lang, period, kind)}</h2>
              <Badge variant={isGainer ? "success" : "danger"}>
                {isGainer ? <TrendingUp /> : <TrendingDown />}
                {PERIOD_LABEL[period]}
              </Badge>
            </div>
            <Surface variant="panel" padding="none" className="divide-y divide-hair overflow-hidden">
              {cards.map((card, index) => {
                const name = getCardName(lang, card);
                return (
                  <ListRow
                    key={card.cardCode}
                    href={`/opcg/cards/${card.cardCode}`}
                    leading={
                      <div className="flex items-center gap-2">
                        <span className="w-4 shrink-0 text-center text-code text-muted-foreground">
                          {index + 1}
                        </span>
                        <span className="relative size-9 shrink-0 overflow-hidden rounded-sm bg-muted">
                          {card.imageUrl && (
                            <Image
                              src={card.imageUrl}
                              alt={name}
                              fill
                              className="object-contain"
                              sizes="36px"
                              placeholder="blur"
                              blurDataURL={BLUR_DATA_URL}
                            />
                          )}
                        </span>
                      </div>
                    }
                    title={name}
                    subtitle={
                      <>
                        <span className="text-code">{card.baseCode ?? card.cardCode}</span>
                        <span aria-hidden="true">·</span>
                        <span>{card.setCode.toUpperCase()}</span>
                        <RarityBadge rarity={card.rarity} size="sm" />
                      </>
                    }
                    trailing={
                      <>
                        {/* THB only — owner ruling 2026-08-06 ("ไม่เอาเยน"):
                            no yen line in user-facing copy. */}
                        <span className="block text-body-sm tabular-nums">
                          {card.latestPriceJpy != null
                            ? formatThb(Math.round(jpyToThb(card.latestPriceJpy)))
                            : "—"}
                        </span>
                        <PriceTag
                          change={changeFor(card, period)}
                          changeOnly
                          changeStyle="plain"
                          decimals={2}
                          size="md"
                        />
                      </>
                    }
                  />
                );
              })}
            </Surface>
          </section>
        );
      })}
    </>
  );
}

function changeFor(card: TrendingCardRow, period: TrendingPeriodKey): number | null {
  if (period === "24h") return card.priceChange24h;
  if (period === "7d") return card.priceChange7d;
  return card.priceChange30d;
}

// One lucide icon per tip, same slot order as buildTrendingWorthCollectingCopy's
// `tips` array (24h spike → sustained demand → sudden drop) — sitewide "1
// concept = 1 icon" rule (see AGENTS.md Component Kit).
const TIP_ICONS = [Zap, TrendingUp, AlertTriangle];

/**
 * "How to read this" explainer — SERVER component, same constraints as
 * `TrendingMoversSections` above (no hooks, always in the first HTML
 * response). Targets the Thai search intent "การ์ดวันพีช น่าเก็บ / น่าลงทุน"
 * (SEO round 3) with a short factual explainer, not a buy/sell call — see
 * `buildTrendingWorthCollectingCopy` for the full reasoning.
 */
export function TrendingWorthCollectingSection({ lang }: { lang: Language }) {
  const copy = buildTrendingWorthCollectingCopy(lang);

  return (
    <section className="space-y-4" data-slot="trending-seo-worth-collecting">
      <div>
        <h2 className="text-h2">{copy.h2}</h2>
        <p className="mt-1.5 text-body-sm leading-relaxed text-muted-foreground">
          {copy.lead}
        </p>
      </div>
      {/* Three reading signals as a card row — the old narrow prose column
          left the right half of the page empty (owner call เบส 2026-08-07;
          same treatment as the guide hub intro). Icon chip reuses the exact
          RelatedPageCard grammar (bg-primary/10 + size-9 rounded-lg) so this
          block doesn't read as a bare, off-brand box next to it. */}
      <div className="grid gap-3 sm:grid-cols-3">
        {copy.tips.map((tip, i) => {
          const Icon = TIP_ICONS[i] ?? Zap;
          return (
            <Surface key={tip.title} variant="outline" className="flex items-start gap-3 p-4">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="size-[18px] text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-h5">{tip.title}</p>
                <p className="mt-1.5 text-body-sm leading-relaxed text-muted-foreground">
                  {tip.body}
                </p>
              </div>
            </Surface>
          );
        })}
      </div>
      <ArrowLink href={copy.linkHref}>{copy.linkLabel}</ArrowLink>
      <p className="text-meta">{copy.disclaimer}</p>
    </section>
  );
}
