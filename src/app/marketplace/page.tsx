import { ListingStatus } from "@/generated/prisma/client";
import { MarketplaceBrowse } from "@/components/marketplace/marketplace-browse";
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
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Marketplace</h1>
        <p className="text-muted-foreground text-sm">ซื้อขายการ์ดกับชุมชน</p>
      </div>
      {dbError ? (
        <div className="rounded-xl border border-dashed border-destructive/50 py-12 text-center">
          <p className="text-destructive text-sm">ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่</p>
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
