import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Crown, ArrowRight } from "lucide-react";

import { PRICE_SOURCE } from "@/lib/constants/prices";

import { Breadcrumb } from "@/components/shared/breadcrumb";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { RarityBadge } from "@/components/shared/rarity-badge";
import { RARITIES, raritySort } from "@/lib/constants/rarities";
import { prisma } from "@/lib/db";
import { Price } from "@/components/shared/price-inline";
import { Surface } from "@/components/ui/surface";
import { FormattedDate } from "@/components/shared/formatted-date";
import { SetPageStats, SetPageTopCardLabel, DropRateDialog } from "./set-page-client";
import { pullChance, PACKS_PER_BOX } from "@/lib/utils/pull-rate";
import { formatCount } from "@/lib/utils/currency";
import {
  SetDetailContent,
  type RarityGroup,
  type CardData,
} from "@/components/sets/set-detail-content";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const getSet = cache(async (setCode: string) => {
  const code = decodeURIComponent(setCode);
  const cardSet = await prisma.cardSet.findUnique({
    where: { code },
    include: { dropRates: true },
  });
  if (!cardSet) return null;

  const product = await prisma.product.findUnique({ where: { code } });
  const cards = await prisma.card.findMany({
    where: product
      ? { productCards: { some: { productId: product.id } } }
      : { setId: cardSet.id },
    orderBy: [{ latestPriceJpy: "desc" }],
    include: {
      set: { select: { code: true } },
      prices: {
        where: {
          source: PRICE_SOURCE.SNKRDUNK,
          gradeCondition: PRICE_SOURCE.PSA_10,
          type: "SELL",
        },
        orderBy: { scrapedAt: "desc" },
        take: 1,
        select: { priceUsd: true },
      },
    },
  });

  return { ...cardSet, cards, productCardCount: cards.length };
});

export async function generateMetadata(props: {
  params: Promise<{ setCode: string }>;
}): Promise<Metadata> {
  const { setCode } = await props.params;
  const set = await getSet(setCode);
  if (!set) return { title: "Set not found" };

  const title = `${set.code.toUpperCase()} — ${set.nameEn ?? set.name}`;
  const description = `${formatCount(set.productCardCount)} cards · ${set.nameEn ?? set.name} — One Piece Card Game`;

  return {
    title,
    description,
    alternates: { canonical: `/sets/${set.code}` },
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function SetDetailPage(props: {
  params: Promise<{ setCode: string }>;
}) {
  const { setCode } = await props.params;
  const set = await getSet(setCode);
  if (!set) notFound();

  const { cards } = set;
  const withPrice = cards.filter(
    (c) => c.latestPriceJpy != null && c.latestPriceJpy > 0
  );
  const totalValue = withPrice.reduce(
    (s, c) => s + (c.latestPriceJpy ?? 0),
    0
  );
  const avgPrice =
    withPrice.length > 0 ? Math.round(totalValue / withPrice.length) : 0;
  const topCard =
    withPrice.length > 0
      ? withPrice.reduce((a, b) =>
          (a.latestPriceJpy ?? 0) > (b.latestPriceJpy ?? 0) ? a : b
        )
      : null;

  const dropRateMap = new Map(set.dropRates.map((dr) => [dr.rarity, dr]));

  const groupsMap = new Map<string, typeof cards>();
  for (const c of cards) {
    if (!groupsMap.has(c.rarity)) groupsMap.set(c.rarity, []);
    groupsMap.get(c.rarity)!.push(c);
  }
  const sortedEntries = [...groupsMap.entries()].sort(
    (a, b) => raritySort(a[0], b[0])
  );

  const rarityGroups: RarityGroup[] = sortedEntries.map(
    ([rarity, groupCards]) => {
      const info = RARITIES.find((r) => r.code === rarity);
      const dr = dropRateMap.get(rarity);
      const n = groupCards.length;
      const pullRate =
        dr?.avgPerBox != null
          ? {
              rarity,
              avgPerBox: dr.avgPerBox,
              ratePerPack: dr.ratePerPack ?? dr.avgPerBox / PACKS_PER_BOX,
            }
          : undefined;
      const perBox =
        dr?.avgPerBox && n > 0 ? pullChance(dr.avgPerBox, n) : undefined;

      return {
        rarity,
        name: info?.name ?? rarity,
        cards: groupCards.map(
          (c): CardData => ({
            id: c.id,
            cardCode: c.cardCode,
            nameJp: c.nameJp,
            nameEn: c.nameEn,
            rarity: c.rarity,
            isParallel: c.isParallel,
            imageUrl: c.imageUrl,
            latestPriceJpy: c.latestPriceJpy,
            latestPriceThb: c.latestPriceThb,
            priceChange24h: c.priceChange24h,
            priceChange7d: c.priceChange7d,
            priceChange30d: c.priceChange30d,
            setCode: c.set.code,
            psa10PriceUsd: c.prices?.[0]?.priceUsd ?? null,
            cardType: c.cardType,
            color: c.color,
          })
        ),
        pullRate,
        pullChancePerBox: perBox,
      };
    }
  );

  const setName = set.nameEn ?? set.name;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Sets", href: "/sets" },
          { name: `${set.code.toUpperCase()} — ${setName}`, href: `/sets/${set.code}` },
        ])}
      />
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Sets", href: "/sets" },
            { label: set.code.toUpperCase() },
          ]}
        />

      {/* Hero */}
      <div>
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
            {set.code.toUpperCase()}
          </span>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {set.type.replaceAll("_", " ")}
          </span>
          {set.releaseDate && (
            <FormattedDate
              date={set.releaseDate}
              options={{ year: "numeric", month: "long" }}
              className="text-meta"
            />
          )}
        </div>
        <h1 className="text-h1 break-words">
          {set.nameEn ?? set.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <SetPageStats cardCount={cards.length} totalValue={totalValue} avgPrice={avgPrice} />
          {set.dropRates.length > 0 && (
            <DropRateDialog
              groups={rarityGroups}
              packsPerBox={set.packsPerBox}
              cardsPerPack={set.cardsPerPack}
            />
          )}
        </div>
      </div>

      {/* Top card spotlight */}
      {topCard && (
        <Link
          href={`/cards/${topCard.cardCode}`}
          className="group block"
        >
          <Surface variant="panel" className="grid grid-cols-[auto_1fr_auto] items-center gap-3 p-3 transition-colors hover:bg-muted/20 sm:gap-4 sm:p-4">
            <div className="relative aspect-[63/88] w-12 shrink-0 overflow-hidden rounded-md bg-muted sm:w-[60px]">
              {topCard.imageUrl ? (
                <Image
                  src={topCard.imageUrl}
                  alt={topCard.nameEn ?? topCard.nameJp}
                  fill
                  className="object-contain"
                  sizes="60px"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Crown className="size-4 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="mb-0.5 flex items-center gap-1.5">
                <Crown className="size-3 text-primary" />
                <SetPageTopCardLabel />
              </div>
              <p className="truncate text-sm font-semibold transition-colors group-hover:text-primary">
                {topCard.nameEn ?? topCard.nameJp}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <RarityBadge rarity={topCard.rarity} size="sm" />
                <span className="font-mono text-xs text-muted-foreground">
                  {topCard.cardCode}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-right">
              <p className="font-mono text-base font-bold tabular-nums sm:text-lg">
                <Price jpy={topCard.latestPriceJpy ?? 0} />
              </p>
              <ArrowRight className="hidden size-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground sm:block" />
            </div>
          </Surface>
        </Link>
      )}

      {/* Interactive content */}
      <SetDetailContent
        groups={rarityGroups}
        totalCards={cards.length}
      />
    </div>
    </>
  );
}
