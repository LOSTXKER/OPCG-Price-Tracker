import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminConfig } from "@/lib/admin/config";
import { PRICE_SOURCE } from "@/lib/constants/prices";
import { CardDetail } from "@/components/cards/card-detail";
import { AdPageContentReady } from "@/components/ads/ad-audience-provider";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { productJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import {
  buildChartData,
  deriveLatestPrice,
  deriveSnkrdunkPrices,
  deriveSourcePrices,
  getCardByCode,
  getListingsForCard,
  getRelatedFromSameSet,
  getSiblingVariants,
} from "@/lib/data/card-detail";
import { prisma } from "@/lib/db";
import { formatJpy } from "@/lib/utils/currency";
import { daysSince } from "@/lib/utils/time";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await props.params;
  const card = await getCardByCode(code);
  if (!card) return { title: "Card not found" };

  const displayName = card.nameEn ?? card.nameJp;
  const priceText = card.latestPriceJpy != null
    ? formatJpy(card.latestPriceJpy)
    : "Price unavailable";

  const title = `${card.cardCode} ${displayName}`;
  const description = `${priceText} · ${displayName} (${card.rarity}) — One Piece Card Game | Meecard`;

  return {
    title,
    description,
    alternates: { canonical: `/opcg/cards/${card.cardCode}` },
    openGraph: {
      title,
      description,
      type: "article",
      images: card.imageUrl ? [{ url: card.imageUrl, alt: displayName }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: card.imageUrl ? [card.imageUrl] : undefined,
    },
  };
}

export default async function CardDetailPage(props: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await props.params;
  const card = await getCardByCode(code);
  if (!card) notFound();

  await prisma.card.update({
    where: { id: card.id },
    data: { viewCount: { increment: 1 } },
  });

  const [siblings, relatedCards, listings, adminConfig] = await Promise.all([
    getSiblingVariants(card.baseCode, card.id),
    getRelatedFromSameSet(card.setId, card.id),
    getListingsForCard(card.id),
    getAdminConfig(),
  ]);

  const price = deriveLatestPrice(card);
  const snkrdunkPrices = deriveSnkrdunkPrices(card.prices);
  const sourcePricesRaw = deriveSourcePrices(card.prices, "raw");
  const sourcePricesPsa10 = deriveSourcePrices(card.prices, "psa10");
  let chartData = buildChartData(card.prices);

  // Latest update timestamp from the freshest known price for this card.
  // Compute "days since" on the server so the client component renders purely
  // (the React 19 purity rule forbids Date.now() during render).
  const latestUpdatedAt = card.prices[0]?.scrapedAt
    ? new Date(card.prices[0].scrapedAt).toISOString()
    : null;
  const daysSinceUpdate = latestUpdatedAt ? daysSince(latestUpdatedAt) : null;


  // Fallback: if no price history but card has a current price, show it as a single data point
  if (chartData.length === 0 && card.latestPriceJpy != null) {
    chartData = [{
      scrapedAt: new Date().toISOString(),
      priceJpy: card.latestPriceJpy,
      priceThb: card.latestPriceThb,
      priceUsd: null,
      source: PRICE_SOURCE.YUYUTEI,
      gradeCondition: null,
      type: null,
    }];
  }

  const displayName = card.nameEn ?? card.nameJp;
  const setName = card.set.nameEn ?? card.set.name;

  return (
    <>
      <AdPageContentReady />
      <JsonLd
        data={productJsonLd({
          cardCode: card.cardCode,
          nameEn: card.nameEn,
          nameJp: card.nameJp,
          rarity: card.rarity,
          imageUrl: card.imageUrl,
          latestPriceJpy: card.latestPriceJpy,
          set: { nameEn: card.set.nameEn, name: card.set.name },
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: setName, href: `/opcg/sets/${card.set.code}` },
          { name: `${card.cardCode} ${displayName}`, href: `/opcg/cards/${card.cardCode}` },
        ])}
      />
      <CardDetail
        key={card.id}
        card={{
        id: card.id,
        cardCode: card.cardCode,
        baseCode: card.baseCode,
        nameJp: card.nameJp,
        nameEn: card.nameEn,
        nameTh: card.nameTh,
        cardType: card.cardType,
        color: card.color,
        colorEn: card.colorEn,
        rarity: card.rarity,
        isParallel: card.isParallel,
        cost: card.cost,
        power: card.power,
        counter: card.counter,
        life: card.life,
        attribute: card.attribute,
        trait: card.trait,
        effectJp: card.effectJp,
        effectEn: card.effectEn,
        effectTh: card.effectTh,
        viewCount: card.viewCount + 1,
        imageUrl: card.imageUrl,
        latestPriceJpy: card.latestPriceJpy,
        latestPriceThb: card.latestPriceThb,
        priceChange24h: card.priceChange24h,
        priceChange7d: card.priceChange7d,
        priceChange30d: card.priceChange30d,
        set: {
          code: card.set.code,
          name: card.set.name,
          nameEn: card.set.nameEn,
          nameTh: card.set.nameTh,
        },
        price,
        chartData,
      }}
      siblings={siblings}
      relatedCards={relatedCards}
      snkrdunkPrices={snkrdunkPrices}
      sourcePricesRaw={sourcePricesRaw}
      sourcePricesPsa10={sourcePricesPsa10}
      latestUpdatedAt={latestUpdatedAt}
      daysSinceUpdate={daysSinceUpdate}
      listings={listings.map((l) => ({
        id: l.id,
        priceJpy: l.priceJpy,
        priceThb: l.priceThb,
        condition: l.condition,
        listedAtIso: l.createdAt.toISOString(),
        user: l.user
          ? {
              displayName: l.user.displayName,
              avatarUrl: l.user.avatarUrl,
              sellerRating: l.user.sellerRating,
              sellerReviewCount: l.user.sellerReviewCount,
            }
          : null,
      }))}
      marketplaceEnabled={adminConfig.marketplaceEnabled}
    />
    </>
  );
}
