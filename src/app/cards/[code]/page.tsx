import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminConfig } from "@/lib/admin/config";
import { PRICE_SOURCE } from "@/lib/constants/prices";
import { CardDetail } from "@/components/cards/card-detail";
import { derivePriceHistory } from "@/components/cards/card-detail/price-history";
import { deriveSoldFeed } from "@/components/cards/card-detail/sold-feed";
import { FaqSection } from "@/components/shared/faq-section";
import { AdPageContentReady } from "@/components/ads/ad-audience-provider";
import { baseCardCode } from "@/lib/cards/card-code";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { productJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import {
  buildCardFaq,
  buildCardIntro,
  buildCardSeoDescription,
  buildCardSeoTitle,
  cardDisplayName,
  type CardSeoData,
} from "@/lib/seo/copy/card";
import {
  buildChartData,
  deriveLatestPrice,
  deriveSnkrdunkPrices,
  deriveSourcePrices,
  getCardByCode,
  getListingsForCard,
  getRelatedFromSameSet,
  getSiblingVariants,
  getSoldPricesForCard,
} from "@/lib/data/card-detail";
import { daysSince } from "@/lib/utils/time";

/**
 * Hourly ISR. This page used to be `force-dynamic` *and* wrote a `viewCount`
 * increment on every render, so every crawler hit meant a fresh DB read plus a
 * DB write — thousands a day on a ~3,800-URL surface. Nothing here needs
 * per-request data (no cookies/headers in the server path; language and
 * currency are client preferences), so the render is cached and the view
 * increment moved to POST /api/cards/[code]/view.
 */
export const revalidate = 3600;

/** Everything the SEO copy builders need, in one place. */
function toSeoData(card: Awaited<ReturnType<typeof getCardByCode>>): CardSeoData {
  const c = card!;
  return {
    cardCode: c.cardCode,
    nameTh: c.nameTh,
    nameLatin: c.nameEn ?? c.nameJp,
    rarity: c.rarity,
    isParallel: c.isParallel,
    setCode: c.set.code,
    // CardSet.nameTh is NULL for every set — always render the English name and
    // let the Thai copy wrap it ("จากชุด OP01 Romance Dawn").
    setName: c.set.nameEn ?? c.set.name,
    latestPriceJpy: c.latestPriceJpy,
    latestPriceThb: c.latestPriceThb,
    priceChange30d: c.priceChange30d,
    priceScrapedAt: c.prices[0]?.scrapedAt
      ? new Date(c.prices[0].scrapedAt).toISOString()
      : null,
  };
}

export async function generateMetadata(props: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await props.params;
  const card = await getCardByCode(code);
  if (!card) return { title: "ไม่พบการ์ดใบนี้" };

  const seo = toSeoData(card);
  const title = buildCardSeoTitle("TH", seo);
  const description = buildCardSeoDescription("TH", seo);
  // og:image alt is reader-facing text — printed card number only.
  const imageAlt = `${baseCardCode(seo.cardCode)} ${cardDisplayName("TH", seo)}`;

  return {
    title,
    description,
    alternates: { canonical: `/opcg/cards/${card.cardCode}` },
    openGraph: {
      // A price page is a product-style page, not an article. A page-level
      // `openGraph` object REPLACES the root one, so siteName/locale are
      // re-declared here on purpose.
      type: "website",
      siteName: "Meecard",
      locale: "th_TH",
      url: `/opcg/cards/${card.cardCode}`,
      title,
      description,
      images: card.imageUrl ? [{ url: card.imageUrl, alt: imageAlt }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: card.imageUrl ? [card.imageUrl] : undefined,
    },
  };
}

export default async function CardDetailPage(props: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await props.params;
  const card = await getCardByCode(code);
  if (!card) notFound();

  const [siblings, relatedCards, listings, soldPrices, adminConfig] = await Promise.all([
    getSiblingVariants(card.baseCode, card.id),
    getRelatedFromSameSet(card.setId, card.id),
    getListingsForCard(card.id),
    getSoldPricesForCard(card.id),
    getAdminConfig(),
  ]);

  // Real settled sales — replaces the generated feed that used to fill this
  // block. Empty for cards the sources have never reported a sale for, which is
  // the honest state rather than invented rows.
  const soldFeed = deriveSoldFeed(
    soldPrices.map((row) => ({
      source: row.source,
      gradeCondition: row.gradeCondition,
      priceJpy: row.priceJpy,
      priceUsd: row.priceUsd,
      scrapedAt: row.scrapedAt.toISOString(),
    })),
  );

  const price = deriveLatestPrice(card);
  const snkrdunkPrices = deriveSnkrdunkPrices(card.prices);
  const sourcePricesRaw = deriveSourcePrices(card.prices, "raw");
  const sourcePricesPsa10 = deriveSourcePrices(card.prices, "psa10");
  let chartData = buildChartData(card.prices);
  // Real price history, derived from the CardPrice rows already fetched — taken
  // BEFORE the synthetic single-point fallback below so the table never shows a
  // "today" row that was never actually scraped. The chart above is client-only;
  // this table is the crawlable version.
  // 30 daily rows = the free tier's own price-history quota (TIER_LIMITS.FREE
  // .priceHistoryDays), so an anonymous visitor and Googlebot see exactly what
  // the pricing page promises for free. The chart's range control decides how
  // many of those rows are on screen.
  const priceHistory = derivePriceHistory(chartData, { maxPoints: 30 });

  // Latest update timestamp from the freshest known price for this card.
  // Compute "days since" on the server so the client component renders purely
  // (the React 19 purity rule forbids Date.now() during render).
  const latestUpdatedAt = card.prices[0]?.scrapedAt
    ? new Date(card.prices[0].scrapedAt).toISOString()
    : null;
  const daysSinceUpdate = latestUpdatedAt ? daysSince(latestUpdatedAt) : null;


  // Fallback: if no price history but card has a current price, show it as a single data point
  if (chartData.length === 0 && card.latestPriceJpy != null) {
    chartData = [{
      scrapedAt: new Date().toISOString(),
      priceJpy: card.latestPriceJpy,
      priceThb: card.latestPriceThb,
      priceUsd: null,
      source: PRICE_SOURCE.YUYUTEI,
      gradeCondition: null,
      type: null,
    }];
  }

  const seo = toSeoData(card);
  const displayName = cardDisplayName("TH", seo);
  const setName = seo.setName;

  return (
    <>
      <AdPageContentReady />
      <JsonLd
        data={productJsonLd({
          cardCode: card.cardCode,
          nameEn: card.nameEn,
          nameJp: card.nameJp,
          nameTh: card.nameTh,
          rarity: card.rarity,
          imageUrl: card.imageUrl,
          latestPriceJpy: card.latestPriceJpy,
          latestPriceThb: card.latestPriceThb,
          priceScrapedAt: latestUpdatedAt,
          set: { nameEn: card.set.nameEn, name: card.set.name, nameTh: card.set.nameTh },
        })}
      />
      {/* Labels mirror the visible Breadcrumb in card-detail.tsx exactly —
          structured data must match what the user sees (the old version
          stuffed "ราคา"/keywords into names the UI never shows; the page's
          uniqueness lives in the title/H1 already). */}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "หน้าแรก", href: "/" },
          { name: "ชุดการ์ด", href: "/opcg/sets" },
          { name: setName, href: `/opcg/sets/${card.set.code}` },
          {
            name: card.baseCode ?? card.cardCode,
            href: `/opcg/cards/${card.cardCode}`,
          },
        ])}
      />
      <CardDetail
        key={card.id}
        introSlot={
          <section className="mt-5 max-w-prose space-y-2">
            {buildCardIntro("TH", seo).map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="text-body-sm leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        }
        priceHistory={priceHistory}
        soldFeed={soldFeed}
        faqSlot={<FaqSection items={buildCardFaq("TH", seo)} />}
        card={{
        id: card.id,
        cardCode: card.cardCode,
        baseCode: card.baseCode,
        nameJp: card.nameJp,
        nameEn: card.nameEn,
        nameTh: card.nameTh,
        cardType: card.cardType,
        color: card.color,
        colorEn: card.colorEn,
        rarity: card.rarity,
        isParallel: card.isParallel,
        cost: card.cost,
        power: card.power,
        counter: card.counter,
        life: card.life,
        attribute: card.attribute,
        trait: card.trait,
        effectJp: card.effectJp,
        effectEn: card.effectEn,
        effectTh: card.effectTh,
        viewCount: card.viewCount,
        imageUrl: card.imageUrl,
        latestPriceJpy: card.latestPriceJpy,
        latestPriceThb: card.latestPriceThb,
        priceChange24h: card.priceChange24h,
        priceChange7d: card.priceChange7d,
        priceChange30d: card.priceChange30d,
        set: {
          code: card.set.code,
          name: card.set.name,
          nameEn: card.set.nameEn,
          nameTh: card.set.nameTh,
        },
        price,
        chartData,
      }}
      siblings={siblings}
      relatedCards={relatedCards}
      snkrdunkPrices={snkrdunkPrices}
      sourcePricesRaw={sourcePricesRaw}
      sourcePricesPsa10={sourcePricesPsa10}
      latestUpdatedAt={latestUpdatedAt}
      daysSinceUpdate={daysSinceUpdate}
      listings={listings.map((l) => ({
        id: l.id,
        priceJpy: l.priceJpy,
        priceThb: l.priceThb,
        condition: l.condition,
        listedAtIso: l.createdAt.toISOString(),
        user: l.user
          ? {
              displayName: l.user.displayName,
              avatarUrl: l.user.avatarUrl,
              sellerRating: l.user.sellerRating,
              sellerReviewCount: l.user.sellerReviewCount,
            }
          : null,
      }))}
      marketplaceEnabled={adminConfig.marketplaceEnabled}
    />
    </>
  );
}
