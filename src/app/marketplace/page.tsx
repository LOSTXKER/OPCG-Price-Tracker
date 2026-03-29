import { Store } from "lucide-react";
import { ListingStatus } from "@/generated/prisma/client";
import { MarketplaceBrowse, MarketplacePageHeader } from "@/components/marketplace/marketplace-browse";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

export default async function MarketplacePage() {
  let listings: Parameters<typeof MarketplaceBrowse>[0]["initialListings"] = [];
  let total = 0;
  let dbError = false;

  try {
    const where = { status: ListingStatus.ACTIVE };
    const [rows, count] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE,
        skip: 0,
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
      prisma.listing.count({ where }),
    ]);

    total = count;
    listings = rows.map((l) => ({
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
      user: l.user,
    }));
  } catch (error) {
    console.error("Failed to fetch marketplace listings:", error);
    dbError = true;
  }

  return (
    <div className="space-y-8">
      <MarketplacePageHeader />
      {dbError ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-muted/30 py-12 text-center">
          <Store className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-destructive">Failed to connect to database. Please try again.</p>
        </div>
      ) : (
        <MarketplaceBrowse
          initialListings={listings}
          initialTotal={total}
          initialPage={1}
          pageSize={PAGE_SIZE}
        />
      )}
    </div>
  );
}
