import { clientEnv } from "@/lib/env";
const BASE_URL = clientEnv().NEXT_PUBLIC_APP_URL;

export type BreadcrumbItem = { name: string; href: string };

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Meecard",
    url: BASE_URL,
    description:
      "One Piece Card Game market prices updated daily. Track Yuyu-tei prices, view price history charts, manage your portfolio.",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function productJsonLd(card: {
  cardCode: string;
  nameEn: string | null;
  nameJp: string;
  rarity: string;
  imageUrl: string | null;
  latestPriceJpy: number | null;
  set: { nameEn: string | null; name: string };
}) {
  const name = card.nameEn ?? card.nameJp;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${card.cardCode} ${name}`,
    description: `${name} (${card.rarity}) — ${card.set.nameEn ?? card.set.name}`,
    image: card.imageUrl ?? undefined,
    url: `${BASE_URL}/cards/${card.cardCode}`,
    brand: { "@type": "Brand", name: "One Piece Card Game" },
    category: "Trading Cards",
    ...(card.latestPriceJpy != null && {
      offers: {
        "@type": "Offer",
        price: card.latestPriceJpy,
        priceCurrency: "JPY",
        availability: "https://schema.org/InStock",
        url: `${BASE_URL}/cards/${card.cardCode}`,
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

export function itemListJsonLd(name: string, items: { name: string; url: string }[]) {
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
    })),
  };
}
