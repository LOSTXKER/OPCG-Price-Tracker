import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

import { clientEnv } from "@/lib/env";
const BASE_URL = clientEnv().NEXT_PUBLIC_APP_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let cards: { cardCode: string; updatedAt: Date }[] = [];
  let sets: { code: string; updatedAt: Date }[] = [];
  let blogPosts: { slug: string; updatedAt: Date }[] = [];

  try {
    [cards, sets, blogPosts] = await Promise.all([
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
  } catch {
    // DB not available at build time
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

  const now = new Date();

  return [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/cards`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/sets`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/trending`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/marketplace`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/market-overview`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${BASE_URL}/compare`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/pull-calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/deck-calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/guide`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/guide/getting-started`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/guide/sets`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/guide/rarities`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/guide/buying`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/guide/card-types`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/guide/colors`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
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
