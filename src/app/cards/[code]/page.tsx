import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CardDetail } from "@/components/cards/card-detail";
import {
  buildChartData,
  deriveLatestPrice,
  getAvailableSources,
  getCardByCode,
  getCommunityPrice,
  getSiblingVariants,
} from "@/lib/data/card-detail";
import { prisma } from "@/lib/db";
import { formatJpy } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await props.params;
  const card = await getCardByCode(code);
  if (!card) return { title: "ไม่พบการ์ด" };

  const displayName = card.nameEn ?? card.nameJp;
  const priceText = card.latestPriceJpy != null
    ? formatJpy(card.latestPriceJpy)
    : "ราคายังไม่มี";

  return {
    title: `${card.cardCode} ${displayName}`,
    description: `${priceText} · ${displayName} (${card.rarity}) — One Piece Card Game | Kuma Tracker`,
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

  const [communityPrice, siblings] = await Promise.all([
    getCommunityPrice(card.id),
    getSiblingVariants(card.baseCode, card.id),
  ]);

  const price = deriveLatestPrice(card);
  const chartData = buildChartData(card.prices);
  const sources = getAvailableSources(card.prices);

  return (
    <CardDetail
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
      communityPrice={communityPrice}
    />
  );
}
