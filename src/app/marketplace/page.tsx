import type { Metadata } from "next";
import { Layers, LineChart, ShoppingCart, Store } from "lucide-react";
import { FaqSection } from "@/components/shared/faq-section";
import { RelatedPages } from "@/components/shared/related-pages";
import { ListingStatus } from "@/generated/prisma/client";
import { MarketplaceBrowse, MarketplacePageHeader } from "@/components/marketplace/marketplace-browse";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Buy and sell One Piece Card Game cards on the Meecard marketplace. Browse active listings, compare prices and find deals.",
  alternates: { canonical: "/marketplace" },
};

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
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Marketplace", href: "/marketplace" }])} />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Marketplace" }]} />
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
      <RelatedPages
        items={[
          { href: "/", icon: LineChart, title: "ตลาดราคา", description: "ดูราคาการ์ดอัปเดตทุกวัน" },
          { href: "/sets", icon: Layers, title: "ชุดการ์ด", description: "ดูทุกชุดการ์ดพร้อมมูลค่า" },
          { href: "/guide/buying", icon: ShoppingCart, title: "คู่มือการซื้อ", description: "ซื้อการ์ดที่ไหนดี?" },
        ]}
      />
      <FaqSection items={[
        { question: "Marketplace คืออะไร?", answer: "Marketplace เป็นตลาดซื้อขายการ์ด OPCG ของ Meecard ผู้ใช้สามารถลงขายและซื้อการ์ดได้โดยตรง พร้อมราคาอ้างอิงจากตลาดจริง" },
        { question: "ขายการ์ดยังไง?", answer: "สมัครสมาชิก เลือกการ์ดที่ต้องการขาย ตั้งราคา แล้วลงประกาศ ผู้ซื้อจะติดต่อผ่านระบบแชทในเว็บ" },
        { question: "ค่าธรรมเนียมเท่าไหร่?", answer: "การลงขายฟรี Meecard เก็บค่าธรรมเนียมเมื่อขายสำเร็จเท่านั้น" },
      ]} />
    </>
  );
}
