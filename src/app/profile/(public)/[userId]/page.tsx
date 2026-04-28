import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { JsonLd } from "@/lib/seo/json-ld-script";
import {
  loadPublicProfileData,
  profileUserSelect,
  resolveIsOwner,
} from "@/lib/profile/load-public-profile";
import { PublicProfileClient } from "./public-profile-client";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true, bio: true, sellerRating: true, sellerReviewCount: true, handle: true },
  });
  if (!user) return { title: "Profile not found" };
  const name = user.displayName ?? "User";
  const desc = user.bio
    ?? `${name} on Meecard — ${user.sellerReviewCount} reviews${user.sellerRating ? `, ★ ${user.sellerRating.toFixed(1)}` : ""}`;
  const ogImage = `/profile/${userId}/opengraph-image`;
  return {
    title: `${name} | Meecard`,
    description: desc,
    openGraph: { title: name, description: desc, images: [ogImage] },
    twitter: { card: "summary_large_image", title: name, description: desc, images: [ogImage] },
    alternates: user.handle ? { canonical: `/@${user.handle}` } : undefined,
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { userId } = await params;
  if (!userId || userId.length < 10) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: profileUserSelect,
  });

  if (!user) {
    notFound();
  }

  const isOwner = await resolveIsOwner(user.id);

  const visibility = user.privacySettings?.profileVisibility ?? "public";

  if (!isOwner && visibility === "private") {
    return (
      <PublicProfileClient
        user={{
          id: user.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          bio: null,
          tier: user.tier,
          sellerRating: null,
          sellerReviewCount: 0,
          createdAt: user.createdAt.toISOString(),
          handle: user.handle,
          socials: null,
        }}
        stats={{ listingCount: 0, reviewCount: 0, portfolioCardCount: 0 }}
        listings={[]}
        reviews={[]}
        collectionCards={[]}
        achievements={[]}
        badges={[]}
        collectionStats={{
          totalCards: 0,
          uniqueCards: 0,
          setsCollected: 0,
          rareCount: 0,
          topSets: [],
        }}
        sellerStats={{
          rating: null,
          reviewCount: 0,
          completedDeals: 0,
          responseHours: null,
          topReview: null,
          isVerified: false,
          lastSeenAt: null,
        }}
        privacyFlags={{
          hidePortfolioPrices: false,
          hidePortfolioQty: false,
          summaryOnly: false,
          showListings: false,
          showCollection: false,
          showDecks: false,
          showStats: false,
        }}
        firstListingId={null}
        viewerSavedSeller={false}
        viewerIsSignedIn={false}
        isOwner={false}
        isPrivate
      />
    );
  }

  const { serialized } = await loadPublicProfileData(user, isOwner);

  const displayName = user.displayName ?? "User";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: displayName, href: `/profile/${user.id}` },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.name, href: c.href })))} />
      <PublicProfileClient
        user={serialized.user}
        stats={serialized.stats}
        listings={serialized.listings}
        reviews={serialized.reviews}
        collectionCards={serialized.collectionCards}
        achievements={serialized.achievements}
        badges={serialized.badges}
        collectionStats={serialized.collectionStats}
        sellerStats={serialized.sellerStats}
        privacyFlags={serialized.privacyFlags}
        firstListingId={serialized.firstListingId}
        viewerSavedSeller={serialized.viewerSavedSeller}
        viewerIsSignedIn={serialized.viewerIsSignedIn}
        isOwner={isOwner}
      />
    </>
  );
}
