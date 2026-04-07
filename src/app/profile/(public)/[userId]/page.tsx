import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ListingStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { PublicProfileClient } from "./public-profile-client";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true, bio: true, sellerRating: true, sellerReviewCount: true },
  });
  if (!user) return { title: "Profile not found" };
  const name = user.displayName ?? "User";
  const desc = user.bio
    ?? `${name} on Meecard — ${user.sellerReviewCount} reviews${user.sellerRating ? `, ★ ${user.sellerRating.toFixed(1)}` : ""}`;
  return {
    title: `${name} | Meecard`,
    description: desc,
    openGraph: { title: name, description: desc },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { userId } = await params;
  if (!userId || userId.length < 10) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      coverImageUrl: true,
      bio: true,
      tier: true,
      sellerRating: true,
      sellerReviewCount: true,
      createdAt: true,
      profileVisibility: true,
      showCollection: true,
      showListings: true,
      showDecks: true,
      showStats: true,
      _count: {
        select: {
          listings: { where: { status: ListingStatus.ACTIVE } },
          reviewsReceived: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  let isOwner = false;
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const dbViewer = await prisma.user.findUnique({
        where: { supabaseId: authUser.id },
        select: { id: true },
      });
      isOwner = dbViewer?.id === user.id;
    }
  } catch {
    // not logged in
  }

  if (!isOwner && user.profileVisibility === "private") {
    return (
      <PublicProfileClient
        user={{
          id: user.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          coverImageUrl: null,
          bio: null,
          tier: user.tier,
          sellerRating: null,
          sellerReviewCount: 0,
          createdAt: user.createdAt.toISOString(),
        }}
        stats={{ listingCount: 0, reviewCount: 0, portfolioCardCount: 0, watchlistCount: 0 }}
        listings={[]}
        reviews={[]}
        collectionCards={[]}
        watchlistCards={[]}
        isOwner={false}
        isPrivate
      />
    );
  }

  const canShowListings = isOwner || user.showListings;
  const canShowCollection = isOwner || user.showCollection;

  const [listings, reviews, portfolioCards, watchlistCards, portfolioCardCount, watchlistCount] = await Promise.all([
    canShowListings
      ? prisma.listing.findMany({
          where: { userId: user.id, status: ListingStatus.ACTIVE },
          orderBy: { createdAt: "desc" },
          take: 24,
          include: {
            card: {
              include: { set: { select: { code: true, name: true, nameEn: true } } },
            },
            user: {
              select: {
                displayName: true,
                avatarUrl: true,
                sellerRating: true,
                sellerReviewCount: true,
              },
            },
          },
        })
      : Promise.resolve([]),
    prisma.review.findMany({
      where: { revieweeId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        reviewer: { select: { displayName: true, avatarUrl: true } },
      },
    }),
    canShowCollection
      ? prisma.portfolioItem.findMany({
          where: { portfolio: { userId: user.id } },
          take: 30,
          orderBy: { addedAt: "desc" },
          select: {
            id: true,
            card: {
              select: {
                cardCode: true,
                nameJp: true,
                nameEn: true,
                rarity: true,
                imageUrl: true,
                latestPriceJpy: true,
                latestPriceThb: true,
                set: { select: { code: true } },
              },
            },
          },
        })
      : Promise.resolve([]),
    prisma.watchlistItem.findMany({
      where: { userId: user.id },
      take: 30,
      orderBy: { addedAt: "desc" },
      select: {
        id: true,
        card: {
          select: {
            cardCode: true,
            nameJp: true,
            nameEn: true,
            rarity: true,
            imageUrl: true,
            latestPriceJpy: true,
            latestPriceThb: true,
            set: { select: { code: true } },
          },
        },
      },
    }),
    canShowCollection
      ? prisma.portfolioItem.count({ where: { portfolio: { userId: user.id } } })
      : Promise.resolve(0),
    prisma.watchlistItem.count({ where: { userId: user.id } }),
  ]);

  const displayName = user.displayName ?? "User";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: displayName, href: `/profile/${user.id}` },
  ];

  const serializedListings = listings.map((l) => ({
    id: l.id,
    priceJpy: l.priceJpy,
    priceThb: l.priceThb,
    condition: l.condition,
    shipping: l.shipping,
    location: l.location,
    isFeatured: l.isFeatured,
    card: {
      cardCode: l.card.cardCode,
      nameJp: l.card.nameJp,
      nameEn: l.card.nameEn,
      rarity: l.card.rarity,
      imageUrl: l.card.imageUrl,
      latestPriceJpy: l.card.latestPriceJpy,
    },
    seller: {
      displayName: l.user.displayName,
      avatarUrl: l.user.avatarUrl,
      sellerRating: l.user.sellerRating,
      sellerReviewCount: l.user.sellerReviewCount,
    },
  }));

  const serializedReviews = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    reviewer: {
      displayName: r.reviewer.displayName,
      avatarUrl: r.reviewer.avatarUrl,
    },
  }));

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.name, href: c.href })))} />
      <PublicProfileClient
        user={{
          id: user.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          coverImageUrl: user.coverImageUrl,
          bio: user.bio,
          tier: user.tier,
          sellerRating: user.sellerRating,
          sellerReviewCount: user.sellerReviewCount,
          createdAt: user.createdAt.toISOString(),
        }}
        stats={{
          listingCount: user._count.listings,
          reviewCount: user._count.reviewsReceived,
          portfolioCardCount,
          watchlistCount,
        }}
        listings={serializedListings}
        reviews={serializedReviews}
        collectionCards={portfolioCards.map((pi) => ({
          cardCode: pi.card.cardCode,
          nameJp: pi.card.nameJp,
          nameEn: pi.card.nameEn,
          rarity: pi.card.rarity,
          imageUrl: pi.card.imageUrl,
          priceJpy: pi.card.latestPriceJpy,
          priceThb: pi.card.latestPriceThb,
          setCode: pi.card.set?.code,
        }))}
        watchlistCards={watchlistCards.map((wi) => ({
          cardCode: wi.card.cardCode,
          nameJp: wi.card.nameJp,
          nameEn: wi.card.nameEn,
          rarity: wi.card.rarity,
          imageUrl: wi.card.imageUrl,
          priceJpy: wi.card.latestPriceJpy,
          priceThb: wi.card.latestPriceThb,
          setCode: wi.card.set?.code,
        }))}
        isOwner={isOwner}
        hiddenSections={!isOwner ? {
          listings: !user.showListings,
          collection: !user.showCollection,
          decks: !user.showDecks,
          stats: !user.showStats,
        } : undefined}
      />
    </>
  );
}
