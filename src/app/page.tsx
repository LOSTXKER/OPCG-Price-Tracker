import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/empty-state";
import {
  HomeFeaturedCard,
  HomeMiniTable,
} from "@/components/home/home-client-sections";
import { AdInventorySlot } from "@/components/ads/ad-inventory-slot";
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

  // Formatted on the server, once per language, so the client hero only picks
  // a stable pre-built string (React 19 forbids Date work during a client
  // render, and server/client timezones could disagree on the calendar day).
  // th-TH renders the Buddhist year Thai readers expect; EN/JP now get their
  // own calendars instead of inheriting the Thai one.
  const dateOpts = { day: "numeric", month: "long", year: "numeric" } as const;
  const updatedLabels = lastUpdated
    ? {
        TH: new Date(lastUpdated).toLocaleDateString("th-TH", dateOpts),
        EN: new Date(lastUpdated).toLocaleDateString("en-GB", dateOpts),
        JP: new Date(lastUpdated).toLocaleDateString("ja-JP", dateOpts),
      }
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

      {/* Search now lives in the global navbar; keep one compact, visible H1
          plus ONE lead sentence (coverage + grades + freshness date — owner
          ruling 2026-08-28). */}
      <HomeSearchHero
        totalCards={totalCards}
        totalSets={sets.length}
        updatedLabels={updatedLabels}
      />

      {/* Highlights: มูลค่าสูงสุด · ราคาขึ้นมากสุด · ราคาลงมากสุด. Minimal — no
          dividers, no borders, no boxes; columns separated by whitespace alone so
          the page reads calm and editorial rather than gridded. The sitewide
          figures (การ์ดทั้งหมด / มูลค่ารวม / JPY-THB) live in the header ticker,
          not here — owner call 2026-08-28, after they briefly appeared in both.
          A fourth track opens at `xl` for advertising; below that the three
          editorial blocks own the row and the ad simply does not render.
          HIDDEN ON PHONES (เบส): stacked, the three blocks pushed the market list
          a full screen down. From `sm` up they sit side by side and cost nothing,
          so they stay. Kept in the DOM (display:none) — no SEO loss. */}
      <section
        className="mt-3 hidden gap-x-8 gap-y-6 sm:mt-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        data-slot="home-highlight-grid"
      >
        {featured && (
          <div className="sm:col-span-2 lg:col-span-1">
            <HomeFeaturedCard card={featured} />
          </div>
        )}
        <HomeMiniTable cards={gainers} type="gainers" />
        <HomeMiniTable cards={losers} type="losers" />
        {/* Stretches with the row instead of pinning to its top: the slot's own
            frame is now "fill the column", so the ad ends where the editorial
            columns beside it end. */}
        <div className="hidden xl:block" data-slot="home-highlight-ad">
          <AdInventorySlot zone="home-highlight-rail" />
        </div>
      </section>

      {/* The market — core browse tool. Generous air above so it reads as its
          own document section, the way card-detail separates its blocks.
          The section is HEADED by the latest-sets strip (owner ruling
          2026-08-28, reversing 2026-08-26): the old "ตารางราคาการ์ด" h2 is
          gone and the strip's own heading + one-row rail introduce the table
          instead — collectors pick the set first, so the set links earn the
          headline slot. The crawlable links stay in the first HTML response. */}
      <div className="mt-9 sm:mt-12">
        <HomeSetStrip sets={recentSets} />
        <div className="mt-4 sm:mt-5">
          <HomeMarketOverview
            initialCards={tableCards}
            initialTotal={initialTableTotal}
            initialTotalPages={initialTableTotalPages}
            filterDefinitions={filterDefinitions}
            sets={setOptions}
          />
        </div>
      </div>

      <HomeSeoContent marketplaceEnabled={marketplaceEnabled} />
    </>
  );
}
