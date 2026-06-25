import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";
import {
  HomeFeaturedCard,
  HomeMiniTable,
} from "@/components/home/home-client-sections";
import { HomeMarketOverview } from "@/components/home/home-market-overview";
import { HomeSearchHero } from "@/components/home/home-search-hero";
import { HomeSeoContent } from "@/components/home/home-seo-content";
import { AdSlot } from "@/components/ads/ad-slot";
import { getHomeData, mapCardToTrending } from "@/lib/data/home";
import { CARD_TYPES } from "@/lib/constants/card-config";
import type { FilterDefinition } from "@/components/shared/filter-chips";

export const revalidate = 300;

export default async function HomePage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;
  const initialSearch = typeof sp.search === "string" ? sp.search : "";
  const {
    topGainers,
    topLosers,
    highestPriced,
    totalCards,
    initialTableCards,
    initialTableTotal,
    initialTableTotalPages,
    sets,
    rarityRows,
  } = await getHomeData();

  if (totalCards === 0) {
    return (
      <KumaEmptyState
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

  const filterDefinitions: FilterDefinition[] = [
    {
      key: "rarity",
      label: "rarity",
      options: rarityRows.map((r) => ({ value: r.rarity, label: r.rarity })),
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
      {/* Universal search hero — the page's focal point (VISION §5 teleport) */}
      <HomeSearchHero sets={setOptions} trending={gainers} />

      {/* Highlights: Featured · Top Gainers · Top Losers. Minimal — no dividers,
          no borders, no boxes; columns separated by whitespace alone so the page
          reads calm and editorial rather than gridded. */}
      <section className="mt-3 grid gap-x-8 gap-y-6 sm:mt-4 sm:grid-cols-2 lg:grid-cols-3">
        {featured && (
          <div className="sm:col-span-2 lg:col-span-1">
            <HomeFeaturedCard card={featured} />
          </div>
        )}
        <HomeMiniTable cards={gainers} type="gainers" />
        <HomeMiniTable cards={losers} type="losers" />
      </section>

      {/* In-feed ad — mobile only, between highlights and the market table.
          House ad (first-party) sizes to its compact content; no forced aspect
          ratio so it stays a slim single nudge rather than a tall block. */}
      <AdSlot placement="home-in-feed" className="mt-5 py-2.5 md:hidden" />

      {/* The market — core browse tool. Generous air above so it reads as its
          own document section, the way card-detail separates its blocks. */}
      <div className="mt-9 sm:mt-12">
        <HomeMarketOverview
          initialCards={tableCards}
          initialTotal={initialTableTotal}
          initialTotalPages={initialTableTotalPages}
          filterDefinitions={filterDefinitions}
          sets={setOptions}
          initialSearch={initialSearch}
        />
      </div>

      <HomeSeoContent />
    </>
  );
}
