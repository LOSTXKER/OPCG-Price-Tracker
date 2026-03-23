import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tcg-price-tracker.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let cards: { cardCode: string; updatedAt: Date }[] = [];
  let sets: { code: string; updatedAt: Date }[] = [];

  try {
    [cards, sets] = await Promise.all([
      prisma.card.findMany({
        select: { cardCode: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 5000,
      }),
      prisma.cardSet.findMany({
        select: { code: true, updatedAt: true },
      }),
    ]);
  } catch {
    // DB not available at build time - return static entries only
  }

  const cardEntries = cards.map((card) => ({
    url: `${BASE_URL}/cards/${card.cardCode}`,
    lastModified: card.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const setEntries = sets.map((set) => ({
    url: `${BASE_URL}/sets/${set.code}`,
    lastModified: set.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/cards`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/sets`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/marketplace`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    ...setEntries,
    ...cardEntries,
  ];
}
