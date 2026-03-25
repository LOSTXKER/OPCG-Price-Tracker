import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { CardEditor } from "./card-editor";

export default async function AdminCardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cardId = parseInt(id);
  if (isNaN(cardId)) notFound();

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      set: { select: { code: true, name: true, nameEn: true } },
      prices: {
        orderBy: { scrapedAt: "desc" },
        take: 30,
        select: {
          id: true,
          source: true,
          type: true,
          priceJpy: true,
          scrapedAt: true,
        },
      },
    },
  });

  if (!card) notFound();

  const candidates: { pIndex: number; url: string }[] = [];
  if (card.isParallel && card.baseCode) {
    const bandaiBase =
      "https://www.onepiece-cardgame.com/images/cardlist/card";
    for (let p = 1; p <= 8; p++) {
      candidates.push({
        pIndex: p,
        url: `${bandaiBase}/${card.baseCode}_p${p}.png`,
      });
    }
  }

  const serialized = {
    ...card,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
    prices: card.prices.map((p) => ({
      ...p,
      scrapedAt: p.scrapedAt.toISOString(),
    })),
    candidates,
  };

  return <CardEditor card={serialized} />;
}
