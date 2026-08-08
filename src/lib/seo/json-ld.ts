import { baseCardCode } from "@/lib/cards/card-code";
import { clientEnv } from "@/lib/env";
import { jpyToThb } from "@/lib/utils/currency";
const BASE_URL = clientEnv().NEXT_PUBLIC_APP_URL;

export type BreadcrumbItem = { name: string; href: string };

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Meecard",
    // Helps Google display the right site name in the SERP instead of
    // guessing from the domain — this brand is new and the deploy hostname
    // (opcg-price-tracker) doesn't spell "Meecard" (SEO round 3).
    alternateName: ["มีการ์ด", "Meecard เช็คราคาการ์ดวันพีช"],
    url: BASE_URL,
    inLanguage: "th-TH",
    description:
      "เช็คราคาการ์ดวันพีช (One Piece Card Game) ทุกใบ ทุกเกรด — ราคากลางอัปเดตทุกวัน พร้อมกราฟราคาย้อนหลังและเครื่องมือจัดพอร์ต",
    // No SearchAction: Google retired the sitelinks search box (Nov 2024),
    // so the markup was dead weight.
  };
}

/**
 * Brand entity for the whole site. Rendered once (on /about) — it anchors
 * E-E-A-T for a price-data site and feeds brand SERP treatment.
 */
export function organizationJsonLd(options?: {
  sameAs?: string[];
  /**
   * URL of the channel readers can actually reach us on. There is no support
   * mailbox, so the ContactPoint carries a `url` instead of an `email` —
   * claiming an unread address would be a false contact signal.
   */
  contactUrl?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Meecard",
    // Registered legal entity behind the site (E-E-A-T) — mirrors the
    // "ผู้ดำเนินการเว็บไซต์" section on /about. Facts limited to what the
    // owner's registry source confirms: names + province.
    legalName: "บริษัท มี-ไลค์ โซเชียล จำกัด",
    alternateName: "Mee-Like Social Company Limited",
    address: {
      "@type": "PostalAddress",
      addressLocality: "เชียงใหม่",
      addressCountry: "TH",
    },
    url: BASE_URL,
    logo: `${BASE_URL}/icon`,
    description:
      "Meecard — เว็บเช็คราคาการ์ดวันพีช (One Piece Card Game) สำหรับตลาดไทย ราคากลางอัปเดตทุกวันจากตลาดญี่ปุ่น",
    ...(options?.sameAs?.length ? { sameAs: options.sameAs } : {}),
    ...(options?.contactUrl
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer support",
            url: options.contactUrl,
            availableLanguage: ["th", "en"],
          },
        }
      : {}),
  };
}

export function productJsonLd(card: {
  cardCode: string;
  nameEn: string | null;
  nameJp: string;
  nameTh?: string | null;
  rarity: string;
  imageUrl: string | null;
  latestPriceJpy: number | null;
  latestPriceThb?: number | null;
  /** Freshest scrape timestamp — drives priceValidUntil (prices are daily). */
  priceScrapedAt?: Date | string | null;
  set: { nameEn: string | null; name: string; nameTh?: string | null };
}) {
  const latinName = card.nameEn ?? card.nameJp;
  const thaiName = card.nameTh?.trim() || null;
  const name = thaiName ?? latinName;
  const setName = card.set.nameTh?.trim() || card.set.nameEn || card.set.name;
  const publicCode = baseCardCode(card.cardCode);

  // The page always renders THB (see cardPriceThbText in copy/card.ts) — the
  // structured data must match what a visitor actually sees, never JPY.
  // `latestPriceThb` can be a real 0 in the DB (not "unset"), and `??` treats
  // only `null`/`undefined` as missing, so a 0 used to leak through as a ฿0
  // offer. Same threshold as the on-page copy: THB counts only when > 0,
  // otherwise derive it from JPY, and emit no `offers` at all when neither
  // source has a usable price (never a fabricated ¥/0 price).
  const price =
    card.latestPriceThb != null && card.latestPriceThb > 0
      ? Math.round(card.latestPriceThb)
      : card.latestPriceJpy != null
        ? Math.round(jpyToThb(card.latestPriceJpy))
        : null;
  const priceCurrency = "THB";

  const scraped = card.priceScrapedAt ? new Date(card.priceScrapedAt) : null;
  const priceValidUntil =
    scraped && !Number.isNaN(scraped.getTime())
      ? new Date(scraped.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    // Reader-facing fields carry the printed card number only. The internal
    // `_p3`/`_r1` printing suffix stays in `sku`/`url` below, which are
    // identifiers rather than text (see @/lib/cards/card-code).
    name: `${publicCode} ${name}`,
    ...(thaiName && thaiName !== latinName ? { alternateName: latinName } : {}),
    description: `ราคาการ์ด ${name} (${publicCode}) ความหายาก ${card.rarity} จากชุด ${setName} — One Piece Card Game`,
    image: card.imageUrl ?? undefined,
    url: `${BASE_URL}/opcg/cards/${card.cardCode}`,
    brand: { "@type": "Brand", name: "One Piece Card Game" },
    category: "Trading Cards",
    sku: card.cardCode,
    inLanguage: "th-TH",
    ...(price != null && {
      // No `availability`: Meecard reports a market reference price, it is not
      // a shop — claiming InStock would be a false merchant signal.
      offers: {
        "@type": "Offer",
        price,
        priceCurrency,
        ...(priceValidUntil ? { priceValidUntil } : {}),
        url: `${BASE_URL}/opcg/cards/${card.cardCode}`,
      },
    }),
  };
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${BASE_URL}${item.href}`,
    })),
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

export function blogPostingJsonLd(post: {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  authorName: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url: `${BASE_URL}/blog/${post.slug}`,
    image: post.coverImage ?? undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.authorName ?? "Meecard",
    },
    publisher: {
      "@type": "Organization",
      name: "Meecard",
      url: BASE_URL,
    },
  };
}

export function itemListJsonLd(
  name: string,
  items: { name: string; url: string; image?: string | null }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}
