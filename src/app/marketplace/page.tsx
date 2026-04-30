import type { Metadata } from "next";
import { Layers, LineChart, ShoppingCart } from "lucide-react";
import { FaqSection } from "@/components/shared/faq-section";
import { RelatedPages } from "@/components/shared/related-pages";
import { ListingStatus, type Prisma } from "@/generated/prisma/client";
import { MarketplaceBrowse, MarketplacePageHeader } from "@/components/marketplace/marketplace-browse";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { prisma } from "@/lib/db";
import { assertMarketplaceEnabled } from "@/lib/marketplace/feature-flag";
import { MarketplaceErrorState } from "./marketplace-error-state";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Buy and sell One Piece Card Game cards on the Meecard marketplace. Browse active listings, compare prices and find deals.",
  alternates: { canonical: "/marketplace" },
};

const PAGE_SIZE = 12;

type SearchParams = {
  seller?: string | string[];
  cardCode?: string | string[];
};

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await assertMarketplaceEnabled();
  const params = await searchParams;
  const rawSeller = Array.isArray(params.seller) ? params.seller[0] : params.seller;
  const sellerKey = (rawSeller ?? "").trim().replace(/^@/, "").slice(0, 60);
  const rawCardCode = Array.isArray(params.cardCode) ? params.cardCode[0] : params.cardCode;
  // Card codes are uppercase A-Z, digits, dash and underscore (parallel suffix).
  // Strip anything else to avoid weird query strings hitting the DB.
  const cardCodeKey = (rawCardCode ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 24);

  let listings: Parameters<typeof MarketplaceBrowse>[0]["initialListings"] = [];
  let total = 0;
  let dbError = false;
  let lockedSeller: Parameters<typeof MarketplaceBrowse>[0]["lockedSeller"] = null;

  try {
    const where: Prisma.ListingWhereInput = { status: ListingStatus.ACTIVE };
    if (sellerKey) {
      // Resolve handle or id → seller. Unknown sellers fall back to the
      // unfiltered view so the URL still renders something useful.
      const seller = await prisma.user.findFirst({
        where: { OR: [{ handle: sellerKey }, { id: sellerKey }] },
        select: { id: true, handle: true, displayName: true },
      });
      if (seller) {
        where.userId = seller.id;
        lockedSeller = {
          id: seller.id,
          handle: seller.handle,
          displayName: seller.displayName,
        };
      }
    }
    if (cardCodeKey) {
      where.card = { cardCode: cardCodeKey };
    }
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
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Marketplace", href: "/marketplace" }])} />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Marketplace" }]} />
      <div className="space-y-8">
        <MarketplacePageHeader />
        {dbError ? (
          <MarketplaceErrorState />
        ) : (
          <MarketplaceBrowse
            initialListings={listings}
            initialTotal={total}
            initialPage={1}
            pageSize={PAGE_SIZE}
            lockedSeller={lockedSeller}
          />
        )}
      </div>
      <RelatedPages
        items={[
          { href: "/", icon: LineChart, title: "ตลาดราคา", description: "ดูราคาการ์ดอัปเดตทุกวัน" },
          { href: "/sets", icon: Layers, title: "ชุดการ์ด", description: "ดูทุกชุดการ์ดพร้อมมูลค่า" },
          { href: "/guide/buying", icon: ShoppingCart, title: "คู่มือการซื้อ", description: "ซื้อการ์ดที่ไหนดี?" },
        ]}
      />
      <FaqSection items={[
        { question: "Marketplace คืออะไร?", answer: "ตลาดซื้อขายการ์ด OPCG บน Meecard ลงขายเองหรือซื้อจากคนอื่นได้เลย มีราคาตลาดจริงให้อ้างอิง" },
        { question: "ขายการ์ดยังไง?", answer: "สมัครสมาชิก เลือกการ์ดที่จะขาย ตั้งราคา แล้วลงประกาศ คนซื้อจะทักมาทางแชทในเว็บ" },
        { question: "ค่าธรรมเนียมเท่าไหร่?", answer: "ลงขายฟรี เก็บค่าธรรมเนียมแค่ตอนขายได้เท่านั้น" },
      ]} />
    </>
  );
}
