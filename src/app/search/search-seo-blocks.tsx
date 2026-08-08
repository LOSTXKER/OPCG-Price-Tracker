import Link from "next/link";

import { ArrowLink } from "@/components/shared/arrow-link";
import { Surface } from "@/components/ui/surface";
import { RarityBadge } from "@/components/shared/rarity-badge";
import { getCardName, type Language } from "@/lib/i18n";
import {
  POPULAR_SEARCHES,
  buildSearchCopy,
} from "@/lib/seo/copy/tools";
import { formatJpy, formatThb, jpyToThb } from "@/lib/utils/currency";
import { baseCardCode } from "@/lib/cards/card-code";

export type SsrSearchCard = {
  cardCode: string;
  nameJp: string;
  nameEn: string | null;
  nameTh: string | null;
  rarity: string;
  latestPriceJpy: number | null;
  imageUrl: string | null;
  setCode: string;
};

export type SsrSearchSet = {
  code: string;
  name: string;
  nameEn: string | null;
  releaseDate: string | null;
};

/**
 * SERVER component — the search results as plain HTML for the first response
 * (and for no-JS clients). The interactive client search renders the same data
 * once it hydrates, so the caller wraps this in `<UntilHydrated>` to avoid two
 * lists on screen.
 */
export function SearchSsrResults({
  lang,
  query,
  total,
  cards,
}: {
  lang: Language;
  query: string;
  total: number;
  cards: SsrSearchCard[];
}) {
  const copy = buildSearchCopy(lang);

  return (
    <section className="space-y-3" data-slot="search-ssr-results">
      <h2 className="text-h3">{copy.resultsTitle(query, total)}</h2>
      <Surface variant="panel" padding="none" className="overflow-hidden">
        <ol className="divide-y divide-hair">
          {cards.map((card) => (
            <li key={card.cardCode}>
              <Link
                href={`/opcg/cards/${card.cardCode}`}
                className="flex items-center gap-3 px-4 py-2.5 ease-chrome transition-colors hover:bg-muted/70"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body-sm font-medium">
                    {getCardName(lang, card)}
                  </span>
                  <span className="flex items-center gap-1.5 text-meta">
                    <span>{baseCardCode(card.cardCode)}</span>
                    <span aria-hidden>·</span>
                    <span>{card.setCode.toUpperCase()}</span>
                    <RarityBadge rarity={card.rarity} size="sm" />
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-body-sm tabular-nums">
                    {card.latestPriceJpy != null
                      ? formatThb(Math.round(jpyToThb(card.latestPriceJpy)))
                      : "—"}
                  </span>
                  <span className="text-meta tabular-nums">
                    {card.latestPriceJpy != null ? formatJpy(card.latestPriceJpy) : "—"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Surface>
      <p className="text-meta">{copy.allResultsHint(query)}</p>
    </section>
  );
}

/**
 * SERVER component — crawlable browse scaffolding for the empty state: the set
 * list (already queried for the filter picker but never rendered until a search
 * ran) plus the popular-query links.
 *
 * `CardSet.nameTh` is NULL for every set, so set names stay English wrapped in
 * Thai context words ("ชุด OP01 Romance Dawn").
 */
export function SearchBrowseBlocks({
  lang,
  sets,
}: {
  lang: Language;
  sets: SsrSearchSet[];
}) {
  const copy = buildSearchCopy(lang);

  return (
    <div className="space-y-8">
      <section className="space-y-3" data-slot="search-browse-sets">
        <h2 className="text-h3">{copy.browseSetsTitle}</h2>
        <p className="text-body-sm text-muted-foreground">{copy.browseSetsIntro}</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((set) => (
            <Surface
              as={Link}
              key={set.code}
              variant="outline"
              interactive
              href={`/opcg/sets/${set.code.toLowerCase()}`}
              className="flex items-center gap-2 px-3 py-2.5"
            >
              <span className="text-code shrink-0 text-muted-foreground">
                {set.code.toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-body-sm">
                {set.nameEn ?? set.name}
              </span>
            </Surface>
          ))}
        </div>
        <ArrowLink href="/opcg/sets">{copy.viewAllSets}</ArrowLink>
      </section>

      <section className="space-y-3" data-slot="search-popular-queries">
        <h2 className="text-h3">{copy.popularTitle}</h2>
        <ul className="flex flex-wrap gap-2">
          {POPULAR_SEARCHES.map((item) => (
            <li key={item.query}>
              <Link
                href={`/opcg/search?q=${encodeURIComponent(item.query)}`}
                className="inline-flex min-h-11 items-center rounded-lg border border-hair bg-background px-3 text-body-sm ease-chrome transition-colors hover:border-primary/40 hover:text-primary md:min-h-9"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
