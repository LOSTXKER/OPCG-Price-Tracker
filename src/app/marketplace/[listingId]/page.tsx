import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Truck, MessageCircle, Eye, Clock, ChevronRight } from "lucide-react";

import { ListingCard } from "@/components/marketplace/listing-card";
import { ReviewSection } from "@/components/marketplace/review-section";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PriceDisplay } from "@/components/shared/price-display";
import { RarityBadge } from "@/components/shared/rarity-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Surface } from "@/components/ui/surface";
import { ListingStatus, OrderStatus } from "@/generated/prisma/client";
import { getAuthUser } from "@/lib/api/auth";
import { prisma } from "@/lib/db";
import { assertMarketplaceEnabled } from "@/lib/marketplace/feature-flag";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { cn } from "@/lib/utils";
import { formatPct } from "@/lib/utils/currency";
import { formatRelativeAgoShort } from "@/lib/utils/relative-time";
import { t } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";
import { Price } from "@/components/shared/price-inline";
import { ImageGallery, type GalleryImage } from "./image-gallery";
import { ListingActionButtons } from "./listing-actions";
import { SaveButton } from "./save-button";
import { ViewTracker } from "./view-tracker";

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
  await assertMarketplaceEnabled();
  const lang = await getServerLanguage();
  const { listingId: idParam } = await params;
  const listingId = Number(idParam);
  if (!Number.isInteger(listingId) || listingId < 1) {
    notFound();
  }

  const [listing, currentUser] = await Promise.all([
    prisma.listing.findFirst({
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
            bio: true,
            createdAt: true,
          },
        },
      },
    }),
    getAuthUser().catch(() => null),
  ]);

  if (!listing) {
    notFound();
  }

  const isSaved = currentUser
    ? !!(await prisma.savedListing
        ?.findUnique({
          where: {
            userId_listingId: { userId: currentUser.id, listingId: listing.id },
          },
        })
        .catch(() => null))
    : false;

  const [similar, sellerListings, sellerListingCount, completedOrderCount, reviews] =
    await Promise.all([
      prisma.listing.findMany({
        where: {
          cardId: listing.cardId,
          status: ListingStatus.ACTIVE,
          id: { not: listing.id },
          userId: { not: listing.userId },
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
      }),
      prisma.listing.findMany({
        where: {
          userId: listing.userId,
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
      }),
      prisma.listing.count({
        where: { userId: listing.userId, status: ListingStatus.ACTIVE },
      }),
      prisma.order
        ?.count({
          where: { sellerId: listing.userId, status: OrderStatus.COMPLETED },
        })
        .catch(() => 0) ?? Promise.resolve(0),
      prisma.review
        ?.findMany({
          where: { revieweeId: listing.userId },
          include: {
            reviewer: { select: { displayName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
        .catch(() => []) ?? Promise.resolve([]),
    ]);

  const market = listing.card.latestPriceJpy;
  const diffPct =
    market != null && market > 0 ? ((listing.priceJpy - market) / market) * 100 : null;

  const cardName = listing.card.nameEn ?? listing.card.nameJp;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Marketplace", href: "/marketplace" },
    { name: cardName, href: `/marketplace/${listing.id}` },
  ];

  const setName =
    listing.card.set?.nameEn ?? listing.card.set?.name ?? listing.card.set?.code;
  const sellerName = listing.user.displayName ?? t(lang, "seller");

  const galleryImages: GalleryImage[] = [
    ...(listing.card.imageUrl
      ? [{ src: listing.card.imageUrl, alt: cardName, isCard: true }]
      : []),
    ...listing.photos.map((url) => ({
      src: url,
      alt: t(lang, "mktDetailRealPhotoAlt").replace("{name}", cardName),
      isCard: false,
    })),
  ];

  return (
    <div className="space-y-10">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <ViewTracker listingId={listing.id} />
      <Breadcrumb
        items={crumbs.map((c) => ({ label: c.name, href: c.href }))}
      />

      {/* ============ Top: Image LEFT + Info RIGHT ============ */}
      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">

        {/* -------- LEFT: Image Gallery (sticky) -------- */}
        <div>
          <div className="lg:sticky lg:top-24 space-y-3">
            <ImageGallery images={galleryImages} />

            <Link
              href={`/cards/${encodeURIComponent(listing.card.cardCode)}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full text-xs"
              )}
            >
              {t(lang, "mktDetailViewCardHistory")}
            </Link>
          </div>
        </div>

        {/* -------- RIGHT: 3 Visual Blocks -------- */}
        <div className="min-w-0 space-y-6">

          {/* ── Block A: Product Identity ── */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <h1 className="text-h1 min-w-0 flex-1 break-words">
                {cardName}
              </h1>
              <SaveButton listingId={listing.id} initialSaved={isSaved} />
            </div>

            <p className="text-muted-foreground font-mono text-sm tracking-wide">
              {listing.card.cardCode}
            </p>

            <div className="flex flex-wrap gap-2">
              <RarityBadge rarity={listing.card.rarity} />
              <Badge variant="outline">{listing.condition}</Badge>
              <Badge variant="secondary">x{listing.quantity}</Badge>
              {setName && (
                <Badge variant="outline" className="font-normal">
                  {setName}
                </Badge>
              )}
            </div>

            <div className="text-muted-foreground flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" />
                {t(lang, "mktDetailPostedAgo").replace("{ago}", formatRelativeAgoShort(listing.createdAt, lang))}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3" />
                {t(lang, "mktDetailViews").replace("{n}", (listing.viewCount ?? 0).toLocaleString())}
              </span>
            </div>
          </div>

          {/* ── Block B: Price + Actions ── */}
          <Surface variant="panel" padding="xl" className="space-y-5">
            <div className="space-y-3">
              <PriceDisplay
                priceJpy={listing.priceJpy}
                priceThb={listing.priceThb ?? undefined}
                showChange={false}
                size="lg"
              />

              {market != null && diffPct != null && (
                <p className="text-muted-foreground text-sm">
                  {t(lang, "mktDetailMarketPrice")}{" "}
                  <Price jpy={market} className="font-medium" />
                  <span
                    className={cn(
                      "ml-2 font-mono font-medium",
                      diffPct < 0 ? "text-price-up" : "text-price-down"
                    )}
                  >
                    {diffPct > 0 ? "▲" : "▼"}
                    {formatPct(Math.abs(diffPct), 0)}%
                  </span>
                </p>
              )}

              {diffPct != null && diffPct <= -10 && (
                <Badge className="bg-price-up/90 border-0 text-white">
                  {t(lang, "mktDetailBestDeal").replace("{n}", String(Math.abs(Math.round(diffPct))))}
                </Badge>
              )}
              {diffPct != null && diffPct >= 15 && (
                <Badge variant="destructive">
                  {t(lang, "mktDetailAboveMarket").replace("{n}", String(Math.round(diffPct)))}
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              <Link
                href={`/messages/${listing.id}`}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "w-full gap-2 text-base"
                )}
              >
                <MessageCircle className="size-5" />
                {t(lang, "mktDetailInterestedChat")}
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <ListingActionButtons
                  listingId={listing.id}
                  priceThb={listing.priceThb ?? 0}
                  marketPriceThb={listing.card.latestPriceThb}
                />
              </div>
            </div>
          </Surface>

          {/* ── Block C: Seller + Shipping ── */}
          <Surface variant="panel" className="overflow-hidden">
            <div className="flex items-center gap-4 p-5">
              <Avatar className="size-14 border">
                {listing.user.avatarUrl ? (
                  <AvatarImage src={listing.user.avatarUrl} alt={sellerName} />
                ) : null}
                <AvatarFallback className="text-lg font-bold">
                  {sellerName.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${listing.user.id}`}
                  className="hover:text-primary text-base font-semibold underline-offset-4 hover:underline"
                >
                  {sellerName}
                </Link>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {listing.user.sellerRating != null
                    ? `★ ${listing.user.sellerRating.toFixed(1)} ${t(lang, "mktDetailReviewCount").replace("{n}", String(listing.user.sellerReviewCount))}`
                    : t(lang, "mktDetailNoReviews")}
                  {" · "}
                  {t(lang, "mktDetailListingCount").replace("{n}", String(sellerListingCount))}
                  {" · "}
                  {t(lang, "mktDetailSalesCount").replace("{n}", String(completedOrderCount))}
                </p>
                <Link
                  href={`/profile/${listing.user.id}`}
                  className="text-primary mt-1 inline-flex items-center gap-0.5 text-xs font-medium hover:underline"
                >
                  {t(lang, "mktDetailViewProfile")}
                  <ChevronRight className="size-3" />
                </Link>
              </div>
            </div>

            <div className="border-[var(--p-hair)] text-muted-foreground space-y-2 border-t px-5 py-4 text-sm">
              <div className="flex items-start gap-2">
                <Truck className="mt-0.5 size-4 flex-shrink-0" />
                <span>
                  {listing.shipping.length > 0
                    ? listing.shipping.join(" · ")
                    : t(lang, "mktDetailContactSeller")}
                </span>
              </div>
              {listing.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 flex-shrink-0" />
                  <span>{listing.location}</span>
                </div>
              )}
            </div>
          </Surface>

        </div>
      </div>

      {/* ============ Full-Width Sections Below ============ */}

      {/* Description */}
      {listing.description && (
        <section className="space-y-4">
          <h2 className="text-h3">{t(lang, "mktDetailSellerDescription")}</h2>
          <Surface variant="panel" padding="lg">
            <p className="break-words whitespace-pre-wrap text-sm leading-relaxed">
              {listing.description}
            </p>
          </Surface>
        </section>
      )}

      {/* Seller's Other Listings */}
      {sellerListings.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-h3">
            {t(lang, "mktDetailOtherFromSeller").replace("{name}", sellerName)}
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {sellerListings.map((l) => (
              <div key={l.id} className="w-52 flex-shrink-0">
                <ListingCard
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
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Similar Listings */}
      {similar.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-h3">{t(lang, "mktDetailSimilarListings")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
      )}

      {/* Reviews */}
      <section className="space-y-4">
        <h2 className="text-h3">
          {t(lang, "mktDetailSellerReviews").replace("{n}", String(listing.user.sellerReviewCount))}
        </h2>
        <ReviewSection
          reviews={reviews}
          averageRating={listing.user.sellerRating}
          totalCount={listing.user.sellerReviewCount}
          lang={lang}
        />
      </section>
    </div>
  );
}
