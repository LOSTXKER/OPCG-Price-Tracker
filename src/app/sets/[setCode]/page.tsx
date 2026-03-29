import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Crown, ArrowRight } from "lucide-react";

import { Breadcrumb } from "@/components/shared/breadcrumb";
import { RarityBadge } from "@/components/shared/rarity-badge";
import { RARITIES } from "@/lib/constants/rarities";
import { prisma } from "@/lib/db";
import { Price } from "@/components/shared/price-inline";
import { FormattedDate } from "@/components/shared/formatted-date";
import { SetPageStats, SetPageTopCardLabel } from "./set-page-client";
import { pullChance, PACKS_PER_BOX } from "@/lib/utils/pull-rate";
import {
  SetDetailContent,
  type RarityGroup,
  type CardData,
} from "@/components/sets/set-detail-content";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  Rarity ordering                                                    */
/* ------------------------------------------------------------------ */

const RARITY_RANK: Record<string, number> = {
  TR: 0,
  "P-SEC": 1,
  SEC: 2,
  "P-SR": 3,
  SR: 4,
  "P-R": 5,
  R: 6,
  UC: 7,
  C: 8,
  "P-UC": 9,
  "P-C": 10,
  "P-L": 11,
  L: 12,
  SP: 13,
  "P-SP": 14,
  DON: 15,
  P: 16,
  "P-P": 17,
};

function rarityRank(rarity: string): number {
  return RARITY_RANK[rarity] ?? 99;
}

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
          source: "SNKRDUNK",
          gradeCondition: "PSA 10",
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
  return {
    title: `${set.code.toUpperCase()} — ${set.nameEn ?? set.name}`,
    description: `${set.productCardCount.toLocaleString()} cards · ${set.nameEn ?? set.name}`,
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
    (a, b) => rarityRank(a[0]) - rarityRank(b[0])
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

  return (
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
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {set.type.replaceAll("_", " ")}
          </span>
          {set.releaseDate && (
            <FormattedDate
              date={set.releaseDate}
              options={{ year: "numeric", month: "long" }}
              className="text-xs text-muted-foreground"
            />
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {set.nameEn ?? set.name}
        </h1>
        <SetPageStats cardCount={cards.length} totalValue={totalValue} avgPrice={avgPrice} />
      </div>

      {/* Top card spotlight */}
      {topCard && (
        <Link
          href={`/cards/${topCard.cardCode}`}
          className="group block"
        >
          <div className="panel flex items-center gap-4 p-3 transition-all duration-200 hover:shadow-md sm:p-4">
            <div className="relative aspect-[63/88] w-14 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-[72px]">
              {topCard.imageUrl ? (
                <Image
                  src={topCard.imageUrl}
                  alt={topCard.nameEn ?? topCard.nameJp}
                  fill
                  className="object-contain"
                  sizes="72px"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Crown className="size-5 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center gap-1.5">
                <Crown className="size-3 text-amber-500" />
                <SetPageTopCardLabel />
              </div>
              <p className="truncate text-sm font-semibold transition-colors group-hover:text-primary">
                {topCard.nameEn ?? topCard.nameJp}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <RarityBadge rarity={topCard.rarity} size="sm" />
                <span className="font-mono text-[11px] text-muted-foreground">
                  {topCard.cardCode}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-lg font-bold tabular-nums sm:text-xl">
                <Price jpy={topCard.latestPriceJpy ?? 0} />
              </p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
          </div>
        </Link>
      )}

      {/* Interactive content */}
      <SetDetailContent
        groups={rarityGroups}
        totalCards={cards.length}
        packsPerBox={set.packsPerBox}
        cardsPerPack={set.cardsPerPack}
        hasPullRates={set.dropRates.length > 0}
      />
    </div>
  );
}
