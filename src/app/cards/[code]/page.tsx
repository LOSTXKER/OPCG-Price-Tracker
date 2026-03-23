import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";

import { CardDetail } from "@/components/cards/card-detail";
import { CardDetailPriceChart } from "@/components/cards/card-detail-price-chart";
import { ListingCard } from "@/components/marketplace/listing-card";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const getCardForDetail = cache(async (rawCode: string) => {
  const cardCode = decodeURIComponent(rawCode);
  return prisma.card.findUnique({
    where: { cardCode },
    include: {
      set: true,
      prices: { orderBy: { scrapedAt: "desc" }, take: 30 },
    },
  });
});

const getCommunityPrice = cache(async (cardId: number) => {
  const result = await prisma.communityPrice.aggregate({
    where: {
      cardId,
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    _avg: { priceThb: true },
    _count: true,
  });
  return {
    avgThb: result._avg.priceThb ? Math.round(result._avg.priceThb) : null,
    reportCount: result._count,
  };
});

const getListingsForCard = cache(async (cardId: number) => {
  return prisma.listing.findMany({
    where: { cardId, status: "ACTIVE" },
    orderBy: { priceJpy: "asc" },
    take: 24,
    include: {
      user: {
        select: {
          displayName: true,
          avatarUrl: true,
          sellerRating: true,
          sellerReviewCount: true,
        },
      },
    },
  });
});

export async function generateMetadata(props: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await props.params;
  const card = await getCardForDetail(code);
  if (!card) {
    return { title: "ไม่พบการ์ด" };
  }
  const displayName = card.nameEn ?? card.nameJp;
  const title = `${card.set.code}-${card.cardCode} ${displayName}`;
  const priceText =
    card.latestPriceJpy != null
      ? `¥${card.latestPriceJpy.toLocaleString("ja-JP")}`
      : "ราคายังไม่มี";
  return {
    title,
    description: `ราคาล่าสุด ${priceText} · ${card.nameJp} (${card.rarity}) — One Piece Card Game`,
  };
}

export default async function CardDetailPage(props: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await props.params;
  const card = await getCardForDetail(code);
  if (!card) notFound();

  await prisma.card.update({
    where: { id: card.id },
    data: { viewCount: { increment: 1 } },
  });

  const [listings, communityPrice] = await Promise.all([
    getListingsForCard(card.id),
    getCommunityPrice(card.id),
  ]);

  const latestRow = card.prices[0];
  const latestPrice =
    latestRow != null
      ? {
          priceJpy: latestRow.priceJpy,
          priceThb: latestRow.priceThb,
          inStock: latestRow.inStock,
        }
      : card.latestPriceJpy != null
        ? {
            priceJpy: card.latestPriceJpy,
            priceThb: card.latestPriceThb,
            inStock: true,
          }
        : null;

  const chartData = [...card.prices]
    .sort(
      (a, b) =>
        new Date(a.scrapedAt).getTime() - new Date(b.scrapedAt).getTime()
    )
    .map((p) => ({
      scrapedAt: p.scrapedAt.toISOString(),
      priceJpy: p.priceJpy,
      priceThb: p.priceThb,
    }));

  const displayViewCount = card.viewCount + 1;

  const marketplaceSlot =
    listings.length === 0 ? (
      <p className="text-muted-foreground text-sm">ยังไม่มีรายการขายสำหรับการ์ดนี้</p>
    ) : (
      <ul className="flex list-none flex-col gap-3 p-0">
        {listings.map((l) => (
          <li key={l.id}>
            <ListingCard
              id={l.id}
              card={{
                cardCode: card.cardCode,
                nameJp: card.nameJp,
                rarity: card.rarity,
                imageUrl: card.imageUrl,
                latestPriceJpy: card.latestPriceJpy,
              }}
              priceJpy={l.priceJpy}
              priceThb={l.priceThb}
              condition={l.condition}
              seller={{
                displayName: l.user.displayName,
                avatarUrl: l.user.avatarUrl,
                sellerRating: l.user.sellerRating,
                sellerReviewCount: l.user.sellerReviewCount,
              }}
              shipping={l.shipping}
              location={l.location}
              isFeatured={l.isFeatured}
            />
          </li>
        ))}
      </ul>
    );

  return (
    <CardDetail
      card={{
        cardCode: card.cardCode,
        nameJp: card.nameJp,
        nameEn: card.nameEn,
        rarity: card.rarity,
        cardType: card.cardType,
        color: card.color,
        colorEn: card.colorEn,
        cost: card.cost,
        power: card.power,
        counter: card.counter,
        life: card.life,
        attribute: card.attribute,
        trait: card.trait,
        effectJp: card.effectJp,
        imageUrl: card.imageUrl,
        isParallel: card.isParallel,
        viewCount: displayViewCount,
        set: {
          code: card.set.code,
          name: card.set.name,
          nameEn: card.set.nameEn,
        },
      }}
      latestPrice={latestPrice}
      priceChange24h={card.priceChange24h}
      priceChange7d={card.priceChange7d}
      communityPrice={communityPrice}
      priceHistorySlot={<CardDetailPriceChart data={chartData} />}
      marketplaceSlot={marketplaceSlot}
    />
  );
}
