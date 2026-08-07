import { BookOpen, Calculator, Store, TrendingUp } from "lucide-react";
import { RelatedPages } from "@/components/shared/related-pages";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { FaqSection } from "@/components/shared/faq-section";
import { PageHeader } from "@/components/layout/page-header";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/json-ld";
import { prisma } from "@/lib/db";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { isMarketplaceEnabled } from "@/lib/marketplace/feature-flag";
import { t, type Language } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";
import {
  buildSetsIndexFaq,
  buildSetsIndexHeading,
  buildSetsIndexIntro,
  buildSetsIndexMeta,
  formatSetMonth,
  type SetsIndexSeoData,
} from "@/lib/seo/copy/sets";
import { SetsListClient, type SetWithCard } from "./sets-page-client";

export const dynamic = "force-dynamic";

/** Thai-first: the copy crawlers see is Thai (doc/seo-content-plan.md §3.8). */
const SEO_LANG: Language = "TH";

const { title: SEO_TITLE, description: SEO_DESCRIPTION } =
  buildSetsIndexMeta(SEO_LANG);

export const metadata = buildPageMetadata({
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  canonical: "/opcg/sets",
});

export default async function SetsIndexPage() {
  const lang = await getServerLanguage();
  // While the admin flag is off, /marketplace 404s — the pillar page must not
  // ship an internal link into it (SEO round 1). Page is force-dynamic already.
  const marketplaceEnabled = await isMarketplaceEnabled();
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
        select: { setId: true, cardCode: true, imageUrl: true },
      }),
    ]);

    const productCountMap = new Map(
      products.map((p) => [p.code, p._count.cards])
    );

    // `topCard` is a stand-in "box art" for every set with no `boxImageUrl`
    // (all 51, today) — but ordering globally by `cardCode` breaks for any
    // set whose box also distributes an SP/parallel reprint of an
    // earlier-numbered card (e.g. an OP04 box containing an "OP01-047_p2"
    // bonus reprint): "OP01-…" always sorts before "OP0N-…" for N > 1, so
    // that unrelated reprint kept winning the pick for most sets past OP02,
    // showing a card that visually has nothing to do with the set (root
    // cause behind the OP04 tile audit finding — the image itself loads
    // fine, it's just the wrong card). Prefer a card whose own code is
    // native to the set; only fall back to "any card in the set" if it has
    // none (shouldn't happen, but keeps a set from going imageless).
    const setCodeById = new Map(sets.map((s) => [s.id, s.code.toUpperCase()]));
    const nativeTopCardMap = new Map<number, { imageUrl: string | null }>();
    const anyTopCardMap = new Map<number, { imageUrl: string | null }>();
    for (const tc of topCards) {
      if (!anyTopCardMap.has(tc.setId))
        anyTopCardMap.set(tc.setId, { imageUrl: tc.imageUrl });
      const setCode = setCodeById.get(tc.setId);
      if (
        setCode &&
        !nativeTopCardMap.has(tc.setId) &&
        tc.cardCode.toUpperCase().startsWith(setCode)
      ) {
        nativeTopCardMap.set(tc.setId, { imageUrl: tc.imageUrl });
      }
    }
    const topCardMap = new Map<number, { imageUrl: string | null }>();
    for (const id of setIds) {
      const card = nativeTopCardMap.get(id) ?? anyTopCardMap.get(id);
      if (card) topCardMap.set(id, card);
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
      // Formatted on the server so the tile never re-formats a date client-side.
      releaseLabel: formatSetMonth(SEO_LANG, s.releaseDate),
      boxImageUrl: s.boxImageUrl,
      topCard: topCardMap.get(s.id) ?? null,
      // Sealed-box SNKRDUNK price — wired in Phase B (scraper + schema).
      boxPriceJpy: null,
    }));
  } catch (error) {
    console.error("Failed to fetch sets:", error);
    dbError = true;
  }

  // Intro + FAQ are generated from the same data the grid renders, so the page
  // always ships real Thai prose (numbers alone = thin content).
  const dated = setsRaw.filter((s) => s.releaseDate);
  const latestSet = dated.length
    ? dated.reduce((a, b) => (a.releaseDate! > b.releaseDate! ? a : b))
    : null;
  const seoData: SetsIndexSeoData = {
    setCount: setsRaw.length,
    cardCount: setsRaw.reduce((sum, s) => sum + s.productCardCount, 0),
    latest: latestSet
      ? {
          code: latestSet.code,
          name: latestSet.nameEn ?? latestSet.name,
          releaseDate: latestSet.releaseDate,
        }
      : null,
  };
  const heading = buildSetsIndexHeading(SEO_LANG);
  const introParagraphs = buildSetsIndexIntro(SEO_LANG, seoData);
  const faqItems = buildSetsIndexFaq(SEO_LANG, seoData);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t(lang, "home"), href: "/" },
          { name: t(lang, "sets"), href: "/opcg/sets" },
        ])}
      />
      {setsRaw.length > 0 && (
        <JsonLd
          data={itemListJsonLd(
            "ชุดการ์ดวันพีซทั้งหมด (One Piece Card Game)",
            setsRaw.map((s) => ({
              name: `${s.code.toUpperCase()} ${s.nameEn ?? s.name}`,
              url: `/opcg/sets/${s.code}`,
              image: s.boxImageUrl ?? s.topCard?.imageUrl ?? null,
            })),
          )}
        />
      )}
      <Breadcrumb
        items={[
          { label: t(lang, "home"), href: "/" },
          { label: t(lang, "sets") },
        ]}
      />
      <div className="space-y-8">
        {/* The keyword sentence IS the subtitle — one text block under the H1
            instead of a generic helper line plus a floating SEO paragraph
            saying the same thing (owner call 2026-08-06). */}
        <PageHeader title={heading.title} description={introParagraphs[0]} />

        {dbError ? (
          <ErrorBanner />
        ) : setsRaw.length === 0 ? (
          <EmptyState mascot="kuma" title="ยังไม่มีข้อมูลชุดการ์ด" />
        ) : (
          <SetsListClient sets={setsRaw} />
        )}

        <FaqSection
          title="คำถามที่พบบ่อยเรื่องชุดการ์ดวันพีซ"
          items={faqItems}
        />
      </div>
      <RelatedPages
        items={[
          {
            href: "/opcg/trending",
            icon: TrendingUp,
            title: "การ์ดวันพีซมาแรงวันนี้",
            description: "การ์ด OPCG ที่ราคาขยับมากที่สุดในวันนี้",
          },
          {
            href: "/opcg/drop-calculator",
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
          ...(marketplaceEnabled
            ? [
                {
                  href: "/marketplace",
                  icon: Store,
                  title: "ตลาดซื้อขายการ์ด",
                  description:
                    "ซื้อขายการ์ดวันพีซในตลาดของ Meecard ราคายุติธรรม",
                },
              ]
            : []),
        ]}
      />
    </>
  );
}
