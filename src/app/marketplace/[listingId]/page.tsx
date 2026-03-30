import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ListingCard } from "@/components/marketplace/listing-card";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PriceDisplay } from "@/components/shared/price-display";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ListingStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { cn } from "@/lib/utils";
import { formatPct } from "@/lib/utils/currency";
import { Price } from "@/components/shared/price-inline";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ listingId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { listingId: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) return { title: "Listing not found" };

  const listing = await prisma.listing.findFirst({
    where: { id, status: ListingStatus.ACTIVE },
    select: {
      priceThb: true,
      card: { select: { nameEn: true, nameJp: true, cardCode: true, imageUrl: true } },
    },
  });
  if (!listing) return { title: "Listing not found" };

  const name = listing.card.nameEn ?? listing.card.nameJp;
  const title = `${listing.card.cardCode} ${name} — ฿${(listing.priceThb ?? 0).toLocaleString()}`;

  return {
    title,
    description: `Buy ${name} (${listing.card.cardCode}) for ฿${(listing.priceThb ?? 0).toLocaleString()} on the Meecard marketplace.`,
    openGraph: {
      title,
      images: listing.card.imageUrl ? [listing.card.imageUrl] : undefined,
    },
  };
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { listingId: idParam } = await params;
  const listingId = Number(idParam);
  if (!Number.isInteger(listingId) || listingId < 1) {
    notFound();
  }

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, status: ListingStatus.ACTIVE },
    include: {
      card: {
        include: { set: { select: { code: true, name: true, nameEn: true } } },
      },
      user: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          sellerRating: true,
          sellerReviewCount: true,
        },
      },
    },
  });

  if (!listing) {
    notFound();
  }

  const similar = await prisma.listing.findMany({
    where: {
      cardId: listing.cardId,
      status: ListingStatus.ACTIVE,
      id: { not: listing.id },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
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
  });

  const market = listing.card.latestPriceJpy;
  const diffPct =
    market != null && market > 0 ? ((listing.priceJpy - market) / market) * 100 : null;

  const cardName = listing.card.nameEn ?? listing.card.nameJp;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Marketplace", href: "/marketplace" },
    { name: cardName, href: `/marketplace/${listing.id}` },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Breadcrumb
        items={crumbs.map((c) => ({ label: c.name, href: c.href }))}
      />
      <div className="flex flex-wrap gap-2">
        <Link
          href="/marketplace"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          ← Back
        </Link>
        <Link
          href={`/cards/${encodeURIComponent(listing.card.cardCode)}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Card page
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,280px)_1fr]">
        <div className="space-y-3">
          <div className="bg-muted relative aspect-[63/88] w-full max-w-xs overflow-hidden rounded-xl border">
            {listing.card.imageUrl ? (
              <Image
                src={listing.card.imageUrl}
                alt={listing.card.nameEn ?? listing.card.nameJp}
                fill
                className="object-cover"
                sizes="280px"
              />
            ) : (
              <div className="text-muted-foreground flex size-full items-center justify-center text-sm">
                No image
              </div>
            )}
          </div>
          {listing.photos.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {listing.photos.map((url) => (
                <div
                  key={url}
                  className="border-border relative h-20 w-16 overflow-hidden rounded-md border"
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="min-w-0 space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{listing.card.nameEn ?? listing.card.nameJp}</h1>
            <p className="text-muted-foreground font-mono text-sm">{listing.card.cardCode}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">{listing.condition}</Badge>
              <Badge variant="secondary">×{listing.quantity}</Badge>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground text-sm">Asking price</p>
            <div className="mt-1">
              <PriceDisplay
                priceJpy={listing.priceJpy}
                priceThb={listing.priceThb ?? undefined}
                showChange={false}
                size="lg"
              />
            </div>
            {market != null && diffPct != null ? (
              <p className="text-muted-foreground mt-2 text-sm">
                Approx. market price <Price jpy={market} />
                <span
                  className={cn(
                    "ml-2 font-mono font-medium",
                    diffPct < 0 ? "text-price-up" : "text-price-down"
                  )}
                >
                  {diffPct > 0 ? "+" : ""}
                  {formatPct(diffPct, 0)}%
                </span>
              </p>
            ) : null}
          </div>

          {listing.description ? (
            <div>
              <p className="text-muted-foreground text-sm">Description</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{listing.description}</p>
            </div>
          ) : null}

          <div className="panel p-4">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Seller
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Avatar>
                {listing.user.avatarUrl ? (
                  <AvatarImage src={listing.user.avatarUrl} alt="" />
                ) : null}
                <AvatarFallback>
                  {(listing.user.displayName ?? "?").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <Link
                  href={`/profile/${listing.user.id}`}
                  className="hover:text-primary font-medium underline-offset-4 hover:underline"
                >
                  {listing.user.displayName ?? "Seller"}
                </Link>
                <p className="text-muted-foreground text-sm">
                  {listing.user.sellerRating != null
                    ? `★ ${listing.user.sellerRating.toFixed(1)}`
                    : "No rating"}{" "}
                  · {listing.user.sellerReviewCount} reviews
                </p>
              </div>
            </div>
          </div>

          <div className="text-muted-foreground space-y-1 text-sm">
            {listing.location ? <p>Location: {listing.location}</p> : null}
            <p>
              Shipping:{" "}
              {listing.shipping.length > 0 ? listing.shipping.join(" · ") : "Contact seller"}
            </p>
          </div>

          <Button type="button" variant="secondary" disabled className="w-full sm:w-auto">
            Chat (coming soon)
          </Button>
        </div>
      </div>

      {similar.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Similar listings</h2>
          <div className="space-y-4">
            {similar.map((l) => (
              <ListingCard
                key={l.id}
                id={l.id}
                card={{
                  cardCode: l.card.cardCode,
                  nameJp: l.card.nameJp,
                  nameEn: l.card.nameEn,
                  rarity: l.card.rarity,
                  imageUrl: l.card.imageUrl,
                  latestPriceJpy: l.card.latestPriceJpy,
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
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
