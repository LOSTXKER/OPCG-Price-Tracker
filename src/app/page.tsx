import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";
import {
  HomeStatsStrip,
  HomeFeaturedCard,
  HomeMiniTable,
} from "@/components/home/home-client-sections";
import { HomeMarketOverview } from "@/components/home/home-market-overview";
import { getHomeData, mapCardToTrending } from "@/lib/data/home";
import { CARD_TYPE_LABELS } from "@/lib/data/cards-browse";
import { CardType } from "@/generated/prisma/client";
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
    newestSet,
    totalCards,
    totalValue,
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
  const featured = highestPriced.length > 0 ? highestPriced[0] : null;

  const tableCards = initialTableCards.map(({ prices, ...c }) => ({
    ...c,
    setCode: c.set.code,
    psa10PriceUsd: prices?.[0]?.priceUsd ?? null,
  }));

  const filterDefinitions: FilterDefinition[] = [
    {
      key: "set",
      label: "set",
      options: sets.map((s) => ({
        value: s.code,
        label: `${s.code} · ${s.nameEn ?? s.name}`,
      })),
    },
    {
      key: "rarity",
      label: "rarity",
      options: rarityRows.map((r) => ({ value: r.rarity, label: r.rarity })),
    },
    {
      key: "type",
      label: "type",
      options: (Object.keys(CARD_TYPE_LABELS) as CardType[]).map((t) => ({
        value: t,
        label: CARD_TYPE_LABELS[t],
      })),
    },
  ];

  return (
    <HomeMarketOverview
      initialCards={tableCards}
      initialTotal={initialTableTotal}
      initialTotalPages={initialTableTotalPages}
      latestSetCode={newestSet?.code}
      filterDefinitions={filterDefinitions}
      initialSearch={initialSearch}
    >
      {/* Stats strip */}
      <HomeStatsStrip
        totalCards={totalCards}
        totalValue={totalValue}
      />

      {/* Highlights: Featured + Gainers/Losers */}
      <div className="panel grid gap-4 p-4 lg:grid-cols-12">
        {featured && (
          <div className="lg:col-span-4">
            <HomeFeaturedCard card={featured} />
          </div>
        )}
        <div className={`grid gap-4 sm:grid-cols-2 ${featured ? "lg:col-span-8" : "lg:col-span-12"}`}>
          <HomeMiniTable
            cards={gainers}
            type="gainers"
          />
          <HomeMiniTable
            cards={losers}
            type="losers"
          />
        </div>
      </div>
    </HomeMarketOverview>
  );
}
