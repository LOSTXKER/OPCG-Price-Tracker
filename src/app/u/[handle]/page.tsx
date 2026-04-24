import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { JsonLd } from "@/lib/seo/json-ld-script";
import {
  loadPublicProfileData,
  profileUserSelect,
  resolveIsOwner,
} from "@/lib/profile/load-public-profile";
import { PublicProfileClient } from "@/app/profile/(public)/[userId]/public-profile-client";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ handle: string }>;
};

function normalizeHandle(raw: string): string | null {
  if (!raw) return null;
  const cleaned = raw.toLowerCase().replace(/^@/, "");
  if (!/^[a-z0-9_]{3,24}$/.test(cleaned)) return null;
  return cleaned;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle: raw } = await params;
  const handle = normalizeHandle(raw);
  if (!handle) return { title: "Profile not found" };
  const user = await prisma.user.findUnique({
    where: { handle },
    select: { id: true, displayName: true, bio: true, sellerRating: true, sellerReviewCount: true, handle: true },
  });
  if (!user) return { title: "Profile not found" };
  const name = user.displayName ?? `@${user.handle}`;
  const desc = user.bio
    ?? `${name} on Meecard — ${user.sellerReviewCount} reviews${user.sellerRating ? `, ★ ${user.sellerRating.toFixed(1)}` : ""}`;
  const ogImage = `/profile/${user.id}/opengraph-image`;
  return {
    title: `${name} | Meecard`,
    description: desc,
    openGraph: { title: name, description: desc, images: [ogImage] },
    twitter: { card: "summary_large_image", title: name, description: desc, images: [ogImage] },
    alternates: { canonical: `/@${user.handle}` },
  };
}

export default async function HandleProfilePage({ params }: PageProps) {
  const { handle: raw } = await params;
  const handle = normalizeHandle(raw);
  if (!handle) notFound();

  const user = await prisma.user.findUnique({
    where: { handle, deletedAt: null },
    select: profileUserSelect,
  });

  if (!user) {
    notFound();
  }

  const isOwner = await resolveIsOwner(user.id);

  if (!isOwner && user.profileVisibility === "private") {
    // Reuse the same private view from /profile/[userId]
    redirect(`/profile/${user.id}`);
  }

  const { serialized } = await loadPublicProfileData(user, isOwner);

  const displayName = user.displayName ?? `@${user.handle}`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: displayName, href: `/@${user.handle}` },
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
