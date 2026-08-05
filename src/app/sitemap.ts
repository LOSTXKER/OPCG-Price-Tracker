import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { isMarketplaceEnabled } from "@/lib/marketplace/feature-flag";

export const dynamic = "force-dynamic";

import { clientEnv } from "@/lib/env";
const BASE_URL = clientEnv().NEXT_PUBLIC_APP_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const marketplaceEnabledPromise = isMarketplaceEnabled();
  let cards: { cardCode: string; updatedAt: Date }[] = [];
  let sets: { code: string; updatedAt: Date }[] = [];
  let blogPosts: { slug: string; updatedAt: Date }[] = [];

  const [cardsResult, setsResult, blogResult] = await Promise.allSettled([
    prisma.card.findMany({
      select: { cardCode: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }),
    prisma.cardSet.findMany({
      select: { code: true, updatedAt: true },
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  // One optional/missing table must not erase the healthy catalog entries.
  if (cardsResult.status === "fulfilled") cards = cardsResult.value;
  if (setsResult.status === "fulfilled") sets = setsResult.value;
  if (blogResult.status === "fulfilled") blogPosts = blogResult.value;

  const cardEntries = cards.map((card) => ({
    url: `${BASE_URL}/opcg/cards/${card.cardCode}`,
    lastModified: card.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const setEntries = sets.map((set) => ({
    url: `${BASE_URL}/opcg/sets/${set.code}`,
    lastModified: set.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const now = new Date();
  const marketplaceEnabled = await marketplaceEnabledPromise;

  return [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/opcg/search`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/opcg/sets`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/opcg/trending`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/opcg/decks`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...(marketplaceEnabled
      ? [{ url: `${BASE_URL}/marketplace`, lastModified: now, changeFrequency: "daily" as const, priority: 0.7 }]
      : []),
    { url: `${BASE_URL}/opcg/market-overview`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${BASE_URL}/opcg/compare`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/opcg/drop-calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/opcg/deck-calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/opcg/most-expensive`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/honey`, lastModified: now, changeFrequency: "weekly", priority: 0.4 },
    { url: `${BASE_URL}/raffle/winners`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/guide`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/guide/getting-started`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/guide/sets`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/guide/rarities`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/guide/buying`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/guide/card-types`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/guide/colors`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/guide/authenticity`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/guide/versions`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    ...blogPosts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...setEntries,
    ...cardEntries,
  ];
}
