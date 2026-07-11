import type { Metadata } from "next";
import { Layers, LineChart, ShoppingCart } from "lucide-react";
import { FaqSection } from "@/components/shared/faq-section";
import { RelatedPages } from "@/components/shared/related-pages";
import { ListingStatus, type Prisma } from "@/generated/prisma/client";
import { MarketplaceBrowse, MarketplacePageHeader } from "@/components/marketplace/marketplace-browse";
import { LocalizedBreadcrumb } from "@/components/shared/localized-breadcrumb";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { prisma } from "@/lib/db";
import { assertMarketplaceEnabled } from "@/lib/marketplace/feature-flag";
import { MarketplaceErrorState } from "./marketplace-error-state";
import { t } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";
import { parseCondition } from "@/lib/api/parse-condition";

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
  q?: string | string[];
  condition?: string | string[];
  rarity?: string | string[];
  variant?: string | string[];
  sort?: string | string[];
  page?: string | string[];
};

const MARKETPLACE_SORTS = new Set([
  "newest",
  "price_jpy_asc",
  "price_jpy_desc",
  "price_thb_asc",
  "price_thb_desc",
]);

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await assertMarketplaceEnabled();
  const params = await searchParams;
  const lang = await getServerLanguage();
  const rawSeller = firstParam(params.seller);
  const sellerKey = (rawSeller ?? "").trim().replace(/^@/, "").slice(0, 60);
  const rawCardCode = firstParam(params.cardCode);
  // Card codes are uppercase A-Z, digits, dash and underscore (parallel suffix).
  // Strip anything else to avoid weird query strings hitting the DB.
  const cardCodeKey = (rawCardCode ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 24);
  const rawSearch = firstParam(params.q);
  const searchKey = (rawSearch ?? "").trim().slice(0, 100);
  const conditionKey = parseCondition(firstParam(params.condition));
  const rarityKeys = [
    ...new Set(
      firstParam(params.rarity)
        .split(",")
        .map((value) => value.trim().toUpperCase())
        .filter((value) => /^[A-Z-]{1,12}$/.test(value)),
    ),
  ];
  const variantKeys = [
    ...new Set(
      firstParam(params.variant)
        .split(",")
        .filter((value) => value === "regular" || value === "parallel"),
    ),
  ];
  const rawSort = firstParam(params.sort);
  const sortKey = MARKETPLACE_SORTS.has(rawSort) ? rawSort : "newest";
  const rawPage = Number(firstParam(params.page));
  const pageKey = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  let listings: Parameters<typeof MarketplaceBrowse>[0]["initialListings"] = [];
  let total = 0;
  let resolvedPage = pageKey;
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
    const cardWhere: Prisma.CardWhereInput = {};
    if (cardCodeKey) {
      cardWhere.cardCode = { equals: cardCodeKey, mode: "insensitive" };
    } else if (searchKey) {
      cardWhere.OR = [
        { cardCode: { contains: searchKey, mode: "insensitive" } },
        { nameJp: { contains: searchKey, mode: "insensitive" } },
        { nameEn: { contains: searchKey, mode: "insensitive" } },
      ];
    }
    if (rarityKeys.length > 0) {
      const expandedRarities = [
        ...new Set(
          rarityKeys.flatMap((rarity) =>
            rarity.startsWith("P-") ? [rarity] : [rarity, `P-${rarity}`],
          ),
        ),
      ];
      cardWhere.rarity = { in: expandedRarities };
    }
    if (variantKeys.length === 1) {
      cardWhere.isParallel = variantKeys[0] === "parallel";
    }
    if (Object.keys(cardWhere).length > 0) {
      where.card = cardWhere;
    }

    if (conditionKey) where.condition = conditionKey;

    const orderBy: Prisma.ListingOrderByWithRelationInput =
      sortKey === "price_jpy_asc"
        ? { priceJpy: "asc" }
        : sortKey === "price_jpy_desc"
          ? { priceJpy: "desc" }
          : sortKey === "price_thb_asc"
            ? { priceThb: "asc" }
            : sortKey === "price_thb_desc"
              ? { priceThb: "desc" }
              : { createdAt: "desc" };

    const count = await prisma.listing.count({ where });
    total = count;
    const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
    resolvedPage = Math.min(pageKey, totalPages);
    const rows = await prisma.listing.findMany({
        where,
        orderBy,
        take: PAGE_SIZE,
        skip: (resolvedPage - 1) * PAGE_SIZE,
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
      });

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
      <LocalizedBreadcrumb items={[{ labelKey: "home", href: "/" }, { labelKey: "marketplace" }]} />
      <div className="space-y-8">
        <MarketplacePageHeader />
        {dbError ? (
          <MarketplaceErrorState />
        ) : (
          <MarketplaceBrowse
            initialListings={listings}
            initialTotal={total}
            initialPage={resolvedPage}
            pageSize={PAGE_SIZE}
            initialSearch={cardCodeKey || searchKey}
            initialCardCode={cardCodeKey}
            initialCondition={conditionKey}
            initialRarities={rarityKeys}
            initialVariants={variantKeys}
            initialSort={sortKey}
            lockedSeller={lockedSeller}
          />
        )}
      </div>
      <RelatedPages
        title={t(lang, "more")}
        items={[
          { href: "/", icon: LineChart, title: t(lang, "mktHomeRelatedPricesTitle"), description: t(lang, "mktHomeRelatedPricesDesc") },
          { href: "/opcg/sets", icon: Layers, title: t(lang, "mktHomeRelatedSetsTitle"), description: t(lang, "mktHomeRelatedSetsDesc") },
          { href: "/guide/buying", icon: ShoppingCart, title: t(lang, "mktHomeRelatedBuyingTitle"), description: t(lang, "mktHomeRelatedBuyingDesc") },
        ]}
      />
      <FaqSection title={t(lang, "guideHomeFaqHeading")} items={[
        { question: t(lang, "mktHomeFaqWhatQ"), answer: t(lang, "mktHomeFaqWhatA") },
        { question: t(lang, "mktHomeFaqSellQ"), answer: t(lang, "mktHomeFaqSellA") },
        {
          question: t(lang, "mktHomeFaqFeeQ"),
          answer: t(lang, "mktHomeFaqFeeA"),
        },
      ]} />
    </>
  );
}
