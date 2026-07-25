import { EmptyState } from "@/components/shared/empty-state";
import {
  HomeFeaturedCard,
  HomeMiniTable,
} from "@/components/home/home-client-sections";
import { HomeMarketOverview } from "@/components/home/home-market-overview";
import { HomeSearchHero } from "@/components/home/home-search-hero";
import { HomeSeoContent } from "@/components/home/home-seo-content";
import { AdPageContentReady } from "@/components/ads/ad-audience-provider";
import { getHomeData, mapCardToTrending } from "@/lib/data/home";
import { CARD_TYPES } from "@/lib/constants/card-config";
import { getGameConfig } from "@/lib/game-config";
import type { FilterDefinition } from "@/components/shared/filter-chips";

export const revalidate = 300;

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
    sets,
  } = await getHomeData();

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

      {/* Universal search hero — the page's focal point (VISION §5 teleport) */}
      <HomeSearchHero sets={setOptions} trending={gainers} />

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
        />
      </div>

      <HomeSeoContent />
    </>
  );
}
