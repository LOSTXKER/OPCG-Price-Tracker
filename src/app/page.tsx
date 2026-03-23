import Link from "next/link";
import { Flame, TrendingDown, TrendingUp } from "lucide-react";

import { CardGrid } from "@/components/cards/card-grid";
import { CardItem } from "@/components/cards/card-item";
import { SearchBar } from "@/components/shared/search-bar";
import { MostViewed } from "@/components/trending/most-viewed";
import { TopMovers } from "@/components/trending/top-movers";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type TrendingCard = {
  cardCode: string;
  nameJp: string;
  rarity: string;
  imageUrl: string | null;
  priceJpy: number | null;
  priceChange24h: number | null;
  set?: { code: string; name?: string };
};

type ViewedCard = TrendingCard & { viewCount: number };

async function getHomeData() {
  try {
    const [topGainers, topLosers, mostViewed, newestSet, totalCards, highestPriced] =
      await Promise.all([
        prisma.card.findMany({
          where: { priceChange24h: { not: null, gt: 0 } },
          orderBy: { priceChange24h: "desc" },
          take: 10,
          include: { set: { select: { code: true, name: true } } },
        }),
        prisma.card.findMany({
          where: { priceChange24h: { not: null, lt: 0 } },
          orderBy: { priceChange24h: "asc" },
          take: 10,
          include: { set: { select: { code: true, name: true } } },
        }),
        prisma.card.findMany({
          where: { viewCount: { gt: 0 } },
          orderBy: { viewCount: "desc" },
          take: 10,
          include: { set: { select: { code: true } } },
        }),
        prisma.cardSet.findFirst({
          orderBy: [{ releaseDate: "desc" }, { createdAt: "desc" }],
        }),
        prisma.card.count(),
        prisma.card.findMany({
          where: { latestPriceJpy: { not: null, gt: 0 } },
          orderBy: { latestPriceJpy: "desc" },
          take: 10,
          include: { set: { select: { code: true, name: true } } },
        }),
      ]);

    const latestSetCards = newestSet
      ? await prisma.card.findMany({
          where: { setId: newestSet.id },
          orderBy: { latestPriceJpy: "desc" },
          take: 20,
          include: { set: { select: { code: true } } },
        })
      : [];

    return {
      topGainers,
      topLosers,
      mostViewed,
      newestSet,
      latestSetCards,
      totalCards,
      highestPriced,
    };
  } catch (error) {
    console.error("Failed to fetch home data:", error);
    return {
      topGainers: [],
      topLosers: [],
      mostViewed: [],
      newestSet: null,
      latestSetCards: [],
      totalCards: 0,
      highestPriced: [],
    };
  }
}

export default async function HomePage() {
  const {
    topGainers,
    topLosers,
    mostViewed,
    newestSet,
    latestSetCards,
    totalCards,
    highestPriced,
  } = await getHomeData();

  const hasTrendingData = topGainers.length > 0 || topLosers.length > 0;

  const gainersForUi: TrendingCard[] = topGainers.map((c) => ({
    cardCode: c.cardCode,
    nameJp: c.nameJp,
    rarity: c.rarity,
    imageUrl: c.imageUrl,
    priceJpy: c.latestPriceJpy,
    priceChange24h: c.priceChange24h,
    set: c.set,
  }));

  const losersForUi: TrendingCard[] = topLosers.map((c) => ({
    cardCode: c.cardCode,
    nameJp: c.nameJp,
    rarity: c.rarity,
    imageUrl: c.imageUrl,
    priceJpy: c.latestPriceJpy,
    priceChange24h: c.priceChange24h,
    set: c.set,
  }));

  const viewedForUi: ViewedCard[] = mostViewed.map((c) => ({
    cardCode: c.cardCode,
    nameJp: c.nameJp,
    rarity: c.rarity,
    imageUrl: c.imageUrl,
    priceJpy: c.latestPriceJpy,
    priceChange24h: c.priceChange24h,
    viewCount: c.viewCount,
    set: c.set,
  }));

  const highPricedForUi: TrendingCard[] = highestPriced.map((c) => ({
    cardCode: c.cardCode,
    nameJp: c.nameJp,
    rarity: c.rarity,
    imageUrl: c.imageUrl,
    priceJpy: c.latestPriceJpy,
    priceChange24h: c.priceChange24h,
    set: c.set,
  }));

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            OPCG Price Tracker
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm">
            ราคากลาง One Piece Card Game อัปเดต — ค้นหาและดูแนวโน้มราคา
            {totalCards > 0 && (
              <span className="ml-1">({totalCards.toLocaleString()} การ์ด)</span>
            )}
          </p>
        </div>
        <SearchBar className="max-w-xl" />
      </section>

      {totalCards === 0 ? (
        <section className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-20 text-center">
          <h2 className="text-lg font-semibold">ยังไม่มีข้อมูลการ์ด</h2>
          <p className="text-muted-foreground max-w-md text-sm">
            ต้อง migrate ฐานข้อมูลและ scrape ข้อมูลก่อน
          </p>
        </section>
      ) : (
        <>
          {hasTrendingData && (
            <>
              <TopMovers
                title="Top gainers (24h)"
                icon={<TrendingUp className="text-emerald-500" />}
                cards={gainersForUi}
                type="gainers"
              />
              <TopMovers
                title="Top losers (24h)"
                icon={<TrendingDown className="text-red-500" />}
                cards={losersForUi}
                type="losers"
              />
            </>
          )}

          {viewedForUi.length > 0 && <MostViewed cards={viewedForUi} />}

          {!hasTrendingData && highPricedForUi.length > 0 && (
            <TopMovers
              title="การ์ดราคาสูงสุด"
              icon={<Flame className="text-amber-500" />}
              cards={highPricedForUi}
              type="gainers"
            />
          )}

          {newestSet && latestSetCards.length > 0 && (
            <section className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="font-heading text-lg font-semibold tracking-tight">
                  ชุดล่าสุด · {newestSet.name}
                </h2>
                <Link
                  href={`/sets/${newestSet.code}`}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  ดูทั้งหมด
                </Link>
              </div>
              <CardGrid>
                {latestSetCards.map((c) => (
                  <CardItem
                    key={c.id}
                    cardCode={c.cardCode}
                    nameJp={c.nameJp}
                    nameEn={c.nameEn}
                    rarity={c.rarity}
                    imageUrl={c.imageUrl}
                    priceJpy={c.latestPriceJpy ?? undefined}
                    priceThb={c.latestPriceThb ?? undefined}
                    priceChange7d={c.priceChange7d}
                    setCode={c.set.code}
                  />
                ))}
              </CardGrid>
            </section>
          )}
        </>
      )}
    </div>
  );
}
