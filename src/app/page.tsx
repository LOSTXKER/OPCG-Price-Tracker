import { ArrowRight, Layers, Package, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";

import { CardItem } from "@/components/cards/card-item";
import { CardGrid } from "@/components/cards/card-grid";
import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";
import { HomeMarketTable, HomeFeaturedCard, HomeMostViewed } from "@/components/home/home-client-sections";
import { getHomeData, mapCardToTrending, type ViewedCard } from "@/lib/data/home";
import { Price } from "@/components/shared/price-inline";

export const dynamic = "force-dynamic";

function getMarketCondition(upCount: number, downCount: number) {
  if (upCount === 0 && downCount === 0) return { condition: "neutral" as const, change: 0 };
  const ratio = upCount / (upCount + downCount);
  const change = Math.round((ratio - 0.5) * 200 * 10) / 10;
  if (ratio > 0.6) return { condition: "bull" as const, change };
  if (ratio < 0.4) return { condition: "bear" as const, change };
  return { condition: "neutral" as const, change };
}

export default async function HomePage() {
  const {
    topGainers,
    topLosers,
    mostViewed,
    newestSet,
    latestSetCards,
    totalCards,
    totalSets,
    highestPriced,
    totalValue,
  } = await getHomeData();

  const gainers = topGainers.map(mapCardToTrending);
  const losers = topLosers.map(mapCardToTrending);
  const viewed: ViewedCard[] = mostViewed.map((c) => ({
    ...mapCardToTrending(c),
    viewCount: c.viewCount,
  }));
  const featured = highestPriced.length > 0 ? highestPriced[0] : null;
  const upCount = topGainers.length;
  const downCount = topLosers.length;
  const market = getMarketCondition(upCount, downCount);

  if (totalCards === 0) {
    return (
      <KumaEmptyState
        title="ยังไม่มีข้อมูลการ์ด"
        description="ต้อง scrape ข้อมูลก่อน — รัน npm run scrape:master แล้วตามด้วย npm run scrape:prices"
        preset="no-results"
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Market indices */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <IndexCard
          label="การ์ดทั้งหมด"
          value={totalCards.toLocaleString()}
          icon={<Layers className="size-4" />}
        />
        <IndexCard
          label="มูลค่ารวม"
          value={<Price jpy={totalValue} />}
          icon={<Package className="size-4" />}
          mono
        />
        <IndexCard
          label="ราคาขึ้น"
          value={upCount.toString()}
          icon={<TrendingUp className="size-4" />}
          accent="up"
        />
        <IndexCard
          label="ราคาลง"
          value={downCount.toString()}
          icon={<TrendingDown className="size-4" />}
          accent="down"
        />
      </div>

      {/* Main grid: Featured + Top Gainers */}
      <div className="grid gap-6 lg:grid-cols-12">
        {featured && (
          <HomeFeaturedCard card={featured} />
        )}

        <div className="panel overflow-hidden lg:col-span-8">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-sm font-semibold">ราคาขึ้นมากสุด</h2>
            <Link href="/cards?sort=change_desc" className="text-xs text-muted-foreground hover:text-foreground">
              ดูทั้งหมด
            </Link>
          </div>
          <HomeMarketTable cards={gainers} type="gainers" />
        </div>
      </div>

      {/* Losers + Most Viewed */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-sm font-semibold">ราคาลงมากสุด</h2>
            <Link href="/cards?sort=change_7d_desc" className="text-xs text-muted-foreground hover:text-foreground">
              ดูทั้งหมด
            </Link>
          </div>
          <HomeMarketTable cards={losers} type="losers" />
        </div>

        <div className="panel overflow-hidden">
          <div className="px-4 py-3">
            <h2 className="text-sm font-semibold">ยอดนิยม</h2>
          </div>
          <HomeMarketTable cards={viewed} type="gainers" showViews />
        </div>
      </div>

      {/* Most Viewed Cards -- horizontal scroll */}
      {viewed.length > 0 && (
        <HomeMostViewed cards={viewed} />
      )}

      {/* Latest set */}
      {newestSet && latestSetCards.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">ชุดล่าสุด</h2>
              <p className="text-xs text-muted-foreground">{newestSet.nameEn ?? newestSet.name}</p>
            </div>
            <Link
              href={`/boxes/${newestSet.code}`}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ดูเพิ่มเติม <ArrowRight className="size-3" />
            </Link>
          </div>
          <div>
            <CardGrid>
              {latestSetCards.slice(0, 10).map((c) => (
                <CardItem
                  key={c.id}
                  cardCode={c.cardCode}
                  nameJp={c.nameJp}
                  nameEn={c.nameEn}
                  nameTh={c.nameTh}
                  rarity={c.rarity}
                  isParallel={c.isParallel}
                  imageUrl={c.imageUrl}
                  priceJpy={c.latestPriceJpy ?? undefined}
                  priceThb={c.latestPriceThb ?? undefined}
                  priceChange7d={c.priceChange7d}
                  setCode={c.set.code}
                />
              ))}
            </CardGrid>
          </div>
        </section>
      )}
    </div>
  );
}

function IndexCard({
  label,
  value,
  accent,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  accent?: "up" | "down";
  mono?: boolean;
}) {
  const color =
    accent === "up"
      ? "text-price-up"
      : accent === "down"
        ? "text-price-down"
        : "text-foreground";

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold tracking-tight ${color} ${mono ? "font-price" : ""}`}>
        {value}
      </p>
    </div>
  );
}

