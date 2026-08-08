import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/empty-state";
import {
  HomeFeaturedCard,
  HomeMiniTable,
} from "@/components/home/home-client-sections";
import { HomeMarketIntro } from "@/components/home/home-market-intro";
import { HomeMarketOverview } from "@/components/home/home-market-overview";
import { HomeSearchHero } from "@/components/home/home-search-hero";
import { HomeSeoContent } from "@/components/home/home-seo-content";
import { HomeSetStrip } from "@/components/home/home-set-strip";
import { AdPageContentReady } from "@/components/ads/ad-audience-provider";
import { getHomeData, mapCardToTrending } from "@/lib/data/home";
import { isMarketplaceEnabled } from "@/lib/marketplace/feature-flag";
import { CARD_TYPES } from "@/lib/constants/card-config";
import { getGameConfig } from "@/lib/game-config";
import { baseCardCode } from "@/lib/cards/card-code";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { itemListJsonLd } from "@/lib/seo/json-ld";
import {
  HOME_META_DESCRIPTION,
  HOME_META_TITLE,
  homeMarketItemListName,
} from "@/lib/seo/copy/home";
import { getCardName } from "@/lib/i18n";
import type { FilterDefinition } from "@/components/shared/filter-chips";

export const revalidate = 300;

/**
 * Thai-first metadata for the price pillar (SEO plan §3.1). `title` is the
 * visible part only — the root layout's template appends " | Meecard".
 *
 * The canonical lives HERE, not in the root layout: declaring "/" globally made
 * every other page claim to be a duplicate of the home page (plan §3.8.2).
 */
export const metadata: Metadata = {
  title: HOME_META_TITLE,
  description: HOME_META_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: HOME_META_TITLE,
    description: HOME_META_DESCRIPTION,
    url: "/",
  },
  twitter: { title: HOME_META_TITLE, description: HOME_META_DESCRIPTION },
};

// No searchParams read here on purpose — reading them opts the page out of ISR
// (forces per-request rendering). Search lives at /search; the home page stays
// statically rendered and revalidates every 5 min.
export default async function HomePage() {
  const {
    topGainers,
    topLosers,
    highestPriced,
    totalCards,
    initialTableCards,
    initialTableTotal,
    initialTableTotalPages,
    lastUpdated,
    sets,
    recentSets,
  } = await getHomeData();

  // Resolved at revalidate time like the rest of the page. While the flag is
  // off, the SEO tail must not advertise (or link to) a route that 404s —
  // Google was finding an internal link to /marketplace from the pillar page.
  const marketplaceEnabled = await isMarketplaceEnabled();

  // Formatted on the server so the market intro interpolates one stable date
  // string (React 19 forbids Date work during a client render — same
  // constraint as /opcg/most-expensive's `updatedLabel`).
  const updatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  if (totalCards === 0) {
    return (
      <EmptyState
        title="No card data yet"
        description="Run npm run scrape:master then npm run scrape:prices to populate data"
        preset="no-results"
      />
    );
  }

  const gainers = topGainers.map(mapCardToTrending);
  const losers = topLosers.map(mapCardToTrending);
  const featured = highestPriced[0] ?? null;

  const tableCards = initialTableCards.map(({ prices, ...c }) => ({
    ...c,
    setCode: c.set.code,
    psa10PriceUsd: prices?.[0]?.priceUsd ?? null,
  }));

  // Rarity options = BASE rarities only (SEC/SR/R/UC/C/L/SP/TR/DON — no P- variants).
  // The server expands a base rarity to its P- family, and the "version" facet in
  // HomeMarketOverview narrows regular/parallel — so we never list P-SEC etc. here.
  // (Type option labels are relabeled to the user's language client-side in
  // HomeMarketOverview, since this page is ISR with no request-time language.)
  const filterDefinitions: FilterDefinition[] = [
    {
      key: "rarity",
      label: "rarity",
      options: (getGameConfig("opcg")?.rarityFilterOptions ?? []).map((r) => ({
        value: r.code,
        label: r.label,
      })),
    },
    {
      key: "type",
      label: "type",
      options: CARD_TYPES.map((ct) => ({
        value: ct.code,
        label: ct.label.EN,
      })),
    },
  ];

  // Ranked list of what the market table actually shows first — makes the
  // page's core ranking machine-readable (SEO plan §3.1). Thai card names are
  // populated in the DB, so the list reads Thai for a Thai-first site.
  const marketListItems = tableCards.slice(0, 20).map((c) => ({
    name: `${baseCardCode(c.cardCode)} ${getCardName("TH", c)}`,
    url: `/opcg/cards/${c.cardCode}`,
    image: c.imageUrl,
  }));

  const setOptions = sets.map((s) => ({
    code: s.code,
    name: s.name,
    nameEn: s.nameEn,
    nameTh: s.nameTh,
    type: s.type,
    imageUrl: s.boxImageUrl,
    releaseDate: s.releaseDate ? s.releaseDate.toISOString() : null,
  }));

  return (
    <>
      <AdPageContentReady />

      <JsonLd
        data={itemListJsonLd(
          homeMarketItemListName(marketListItems.length),
          marketListItems
        )}
      />

      {/* Universal search hero — the page's focal point (VISION §5 teleport) */}
      <HomeSearchHero sets={setOptions} trending={gainers} />

      {/* Crawlable set links — the picker in the table below is client-only, so
          without this strip the pillar page linked to zero set pages. Owner
          decision 2026-08-06: lives UP HERE under the hero (tried the tail,
          reverted) — collectors browse by set first, so the strip earns its
          row. Phones render it as a one-row swipe rail (see home-set-strip),
          which is what keeps the market table on the first screen. */}
      <HomeSetStrip sets={recentSets} />

      {/* Highlights: มูลค่าสูงสุด · ราคาขึ้นมากสุด · ราคาลงมากสุด. Minimal — no
          dividers, no borders, no boxes; columns separated by whitespace alone so
          the page reads calm and editorial rather than gridded.
          HIDDEN ON PHONES (เบส): stacked, the three blocks pushed the market list
          a full screen down. From `sm` up they sit side by side and cost nothing,
          so they stay. Kept in the DOM (display:none) — no SEO loss. */}
      <section className="mt-3 hidden gap-x-8 gap-y-6 sm:mt-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {featured && (
          <div className="sm:col-span-2 lg:col-span-1">
            <HomeFeaturedCard card={featured} />
          </div>
        )}
        <HomeMiniTable cards={gainers} type="gainers" />
        <HomeMiniTable cards={losers} type="losers" />
      </section>

      {/* The market — core browse tool. Generous air above so it reads as its
          own document section, the way card-detail separates its blocks. */}
      <div className="mt-9 sm:mt-12">
        <HomeMarketOverview
          initialCards={tableCards}
          initialTotal={initialTableTotal}
          initialTotalPages={initialTableTotalPages}
          filterDefinitions={filterDefinitions}
          sets={setOptions}
        >
          {/* The section's H2 + context prose — numbers alone read as a thin
              page, and the table had no heading at all (SEO plan §3.1). */}
          <HomeMarketIntro
            totalCards={totalCards}
            totalSets={sets.length}
            updatedLabel={updatedLabel}
          />
        </HomeMarketOverview>
      </div>

      <HomeSeoContent marketplaceEnabled={marketplaceEnabled} />
    </>
  );
}
