import type { Metadata } from "next";
import { BookOpen, Calculator, Store, TrendingUp } from "lucide-react";
import { RelatedPages } from "@/components/shared/related-pages";

import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { prisma } from "@/lib/db";
import { t } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";
import {
  SetsPageHeader,
  SetsListClient,
  type SetWithCard,
} from "./sets-page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Card Sets — Booster Boxes & Decks",
  description:
    "Browse all OPCG card sets, booster boxes and starter decks. Card counts and release dates.",
  alternates: { canonical: "/sets" },
};

export default async function SetsIndexPage() {
  const lang = await getServerLanguage();
  let setsRaw: SetWithCard[] = [];
  let dbError = false;

  try {
    const sets = await prisma.cardSet.findMany({
      orderBy: [{ type: "asc" }, { code: "asc" }],
    });

    const setIds = sets.map((s) => s.id);
    const [products, topCards] = await Promise.all([
      prisma.product.findMany({
        select: { code: true, _count: { select: { cards: true } } },
      }),
      prisma.card.findMany({
        where: {
          setId: { in: setIds },
          imageUrl: { not: null },
        },
        orderBy: { cardCode: "asc" },
        select: { setId: true, imageUrl: true },
      }),
    ]);

    const productCountMap = new Map(
      products.map((p) => [p.code, p._count.cards])
    );
    const topCardMap = new Map<number, { imageUrl: string | null }>();
    for (const tc of topCards) {
      if (!topCardMap.has(tc.setId))
        topCardMap.set(tc.setId, { imageUrl: tc.imageUrl });
    }
    setsRaw = sets.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      nameEn: s.nameEn,
      type: s.type,
      cardCount: s.cardCount,
      productCardCount: productCountMap.get(s.code) ?? s.cardCount,
      releaseDate: s.releaseDate?.toISOString() ?? null,
      boxImageUrl: s.boxImageUrl,
      topCard: topCardMap.get(s.id) ?? null,
      // Sealed-box SNKRDUNK price — wired in Phase B (scraper + schema).
      boxPriceJpy: null,
    }));
  } catch (error) {
    console.error("Failed to fetch sets:", error);
    dbError = true;
  }

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t(lang, "home"), href: "/" },
          { name: t(lang, "sets"), href: "/sets" },
        ])}
      />
      <Breadcrumb
        items={[
          { label: t(lang, "home"), href: "/" },
          { label: t(lang, "sets") },
        ]}
      />
      <div className="space-y-8">
        <SetsPageHeader />

        {dbError ? (
          <ErrorBanner />
        ) : setsRaw.length === 0 ? (
          <KumaEmptyState title="No card sets yet" />
        ) : (
          <SetsListClient sets={setsRaw} />
        )}
      </div>
      <RelatedPages
        items={[
          {
            href: "/trending",
            icon: TrendingUp,
            title: "การ์ดวันพีซมาแรงวันนี้",
            description: "การ์ด OPCG ที่ราคาขยับมากที่สุดในวันนี้",
          },
          {
            href: "/drop-calculator",
            icon: Calculator,
            title: "คำนวณ Drop Rate กล่องสุ่ม",
            description: "จำลองเปิดกล่องการ์ด OPCG คำนวณโอกาสได้การ์ดที่ต้องการ",
          },
          {
            href: "/guide/sets",
            icon: BookOpen,
            title: "คู่มือชุดการ์ด OPCG",
            description: "เรียนรู้รายละเอียดชุดการ์ดวันพีซแต่ละชุด",
          },
          {
            href: "/marketplace",
            icon: Store,
            title: "ตลาดซื้อขายการ์ด",
            description: "ซื้อขายการ์ดวันพีซในตลาดของ Meecard ราคายุติธรรม",
          },
        ]}
      />
    </>
  );
}
