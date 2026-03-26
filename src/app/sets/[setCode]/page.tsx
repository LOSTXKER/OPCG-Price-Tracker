import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { CardGrid } from "@/components/cards/card-grid";
import { CardItem } from "@/components/cards/card-item";
import { PullRatesTable, type PullRateRow } from "@/components/sets/pull-rates-table";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { RarityBadge } from "@/components/shared/rarity-badge";
import { RARITIES } from "@/lib/constants/rarities";
import { prisma } from "@/lib/db";
import { Price } from "@/components/shared/price-inline";
import { pullChance, formatPct, PACKS_PER_BOX } from "@/lib/utils/pull-rate";

export const dynamic = "force-dynamic";

const TIER_ORDER = ["SP", "SP CARD", "P-SEC", "SEC", "P-SR", "SR", "P-R", "R", "L", "P-L", "P-UC", "UC", "P-C", "C", "DON", "P", "P-P"];

const TIER_ACCENT: Record<string, string> = {
  SP: "border-l-pink-500",
  "SP CARD": "border-l-pink-500",
  "P-SEC": "border-l-amber-500",
  SEC: "border-l-amber-500",
  "P-SR": "border-l-purple-500",
  SR: "border-l-purple-500",
  "P-R": "border-l-blue-500",
  R: "border-l-blue-500",
  L: "border-l-orange-500",
  "P-L": "border-l-orange-500",
  "P-UC": "border-l-emerald-500",
  UC: "border-l-emerald-500",
  "P-C": "border-l-neutral-400",
  C: "border-l-neutral-400",
  DON: "border-l-red-500",
};

const TIER_BG: Record<string, string> = {
  SP: "bg-pink-500/5",
  "SP CARD": "bg-pink-500/5",
  "P-SEC": "bg-amber-500/5",
  SEC: "bg-amber-500/5",
  "P-SR": "bg-purple-500/5",
  SR: "bg-purple-500/5",
  "P-R": "bg-blue-500/5",
  R: "bg-blue-500/5",
  DON: "bg-red-500/5",
};

const COLLAPSED_BY_DEFAULT = new Set(["C", "P-C", "UC", "P-UC"]);

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
    include: { set: { select: { code: true } } },
  });

  return { ...cardSet, cards, productCardCount: cards.length };
});

export async function generateMetadata(props: {
  params: Promise<{ setCode: string }>;
}): Promise<Metadata> {
  const { setCode } = await props.params;
  const set = await getSet(setCode);
  if (!set) return { title: "ไม่พบชุด" };
  return {
    title: `${set.code.toUpperCase()} — ${set.nameEn ?? set.name}`,
    description: `${set.productCardCount.toLocaleString()} ใบ · ${set.nameEn ?? set.name}`,
  };
}

export default async function SetDetailPage(props: {
  params: Promise<{ setCode: string }>;
}) {
  const { setCode } = await props.params;
  const set = await getSet(setCode);
  if (!set) notFound();

  const cards = set.cards;
  const cardsWithPrice = cards.filter((c) => c.latestPriceJpy != null && c.latestPriceJpy > 0);
  const totalValue = cardsWithPrice.reduce((sum, c) => sum + (c.latestPriceJpy ?? 0), 0);
  const avgPrice = cardsWithPrice.length > 0 ? Math.round(totalValue / cardsWithPrice.length) : 0;
  const mostExpensive = cardsWithPrice.length > 0
    ? cardsWithPrice.reduce((a, b) => (a.latestPriceJpy ?? 0) > (b.latestPriceJpy ?? 0) ? a : b)
    : null;

  const dropRateMap = new Map(set.dropRates.map((dr) => [dr.rarity, dr]));

  const tierGroups = new Map<string, typeof cards>();
  for (const c of cards) {
    if (!tierGroups.has(c.rarity)) tierGroups.set(c.rarity, []);
    tierGroups.get(c.rarity)!.push(c);
  }

  const sortedTiers = [...tierGroups.entries()].sort((a, b) => {
    const aIdx = TIER_ORDER.indexOf(a[0]);
    const bIdx = TIER_ORDER.indexOf(b[0]);
    return (aIdx === -1 ? 100 : aIdx) - (bIdx === -1 ? 100 : bIdx);
  });

  const totalForBar = cards.length || 1;

  return (
    <div className="space-y-8">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Sets", href: "/sets" },
          { label: set.code.toUpperCase() },
        ]}
      />

      {/* Header */}
      <div>
        <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono font-medium">{set.code.toUpperCase()}</span>
          <span>·</span>
          <span>{set.type.replaceAll("_", " ")}</span>
          {set.releaseDate && (
            <>
              <span>·</span>
              <span>{set.releaseDate.toLocaleDateString("th-TH", { year: "numeric", month: "long" })}</span>
            </>
          )}
        </div>
        <h1 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">{set.nameEn ?? set.name}</h1>
      </div>

      {/* Stat widgets */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="panel p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">การ์ดทั้งหมด</p>
          <p className="mt-1 font-sans text-2xl font-bold tabular-nums">{cards.length}</p>
        </div>
        <div className="panel p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">มูลค่ารวม</p>
          <p className="mt-1 font-sans text-2xl font-bold tabular-nums font-mono"><Price jpy={totalValue} /></p>
        </div>
        <div className="panel p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">ราคาเฉลี่ย</p>
          <p className="mt-1 font-sans text-2xl font-bold tabular-nums font-mono"><Price jpy={avgPrice} /></p>
        </div>
        <div className="panel p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">แพงที่สุด</p>
          <p className="mt-1 font-sans text-2xl font-bold tabular-nums font-mono">{mostExpensive ? <Price jpy={mostExpensive.latestPriceJpy ?? 0} /> : "—"}</p>
          {mostExpensive && <p className="mt-0.5 truncate text-xs text-muted-foreground">{mostExpensive.nameEn ?? mostExpensive.nameJp}</p>}
        </div>
      </div>

      {/* Pull Rates (when drop rate data exists) */}
      {set.dropRates.length > 0 && (
        <PullRatesTable
          rows={sortedTiers
            .filter(([rarity]) => dropRateMap.get(rarity)?.avgPerBox)
            .map(([rarity, tierCards]): PullRateRow => {
              const dr = dropRateMap.get(rarity)!;
              return {
                rarity,
                cardCount: tierCards.length,
                avgPerBox: dr.avgPerBox!,
                ratePerPack: dr.ratePerPack ?? dr.avgPerBox! / PACKS_PER_BOX,
              };
            })}
          packsPerBox={set.packsPerBox}
          cardsPerPack={set.cardsPerPack}
        />
      )}

      {/* Rarity Distribution bar chart */}
      {sortedTiers.length > 0 && (
        <div className="panel p-5">
          <h2 className="mb-4 text-sm font-semibold">Rarity Distribution</h2>
          <div className="space-y-2.5">
            {sortedTiers.map(([rarity, tierCards]) => {
              const count = tierCards.length;
              const pct = Math.round((count / totalForBar) * 100);
              return (
                <Link
                  key={rarity}
                  href={`/cards?set=${set.code}&rarity=${rarity}`}
                  className="group flex items-center gap-3 transition-opacity hover:opacity-70"
                >
                  <span className="w-16 shrink-0 font-mono text-sm font-medium">{rarity}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary/60" style={{ width: `${Math.max(pct, 4)}%` }} />
                  </div>
                  <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">{count} ({pct}%)</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Cards by Tier — collapsible with accent colors */}
      {cards.length === 0 ? (
        <div className="panel py-16 text-center">
          <p className="text-sm text-muted-foreground">ยังไม่มีการ์ดในชุดนี้</p>
        </div>
      ) : (
        sortedTiers.map(([rarity, tierCards]) => {
          const dr = dropRateMap.get(rarity);
          const n = tierCards.length;
          const perBox = dr?.avgPerBox && n > 0 ? pullChance(dr.avgPerBox, n) : null;
          const rarityInfo = RARITIES.find((r) => r.code === rarity);
          const accent = TIER_ACCENT[rarity] ?? "border-l-neutral-400";
          const bg = TIER_BG[rarity] ?? "";
          const isCollapsed = COLLAPSED_BY_DEFAULT.has(rarity);

          return (
            <details key={rarity} open={!isCollapsed} className="group">
              <summary className={`flex cursor-pointer items-center gap-3 rounded-lg border-l-3 ${accent} ${bg} px-5 py-3 transition-colors hover:bg-muted/50`}>
                <RarityBadge rarity={rarity} size="md" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold">{rarityInfo?.name ?? rarity}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{n} cards</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {dr?.avgPerBox != null && (
                    <span className="hidden font-mono tabular-nums sm:inline">~{dr.avgPerBox < 1 ? dr.avgPerBox.toFixed(2) : dr.avgPerBox.toFixed(1)}/box</span>
                  )}
                  {perBox != null && (
                    <span className="font-mono font-semibold tabular-nums text-primary">{formatPct(perBox)}/box</span>
                  )}
                </div>
                <span className="text-muted-foreground transition-transform group-open:rotate-90">▸</span>
              </summary>
              <div className="mt-4 mb-2">
                <CardGrid>
                  {tierCards.map((c) => (
                    <CardItem
                      key={c.id}
                      cardCode={c.cardCode}
                      nameJp={c.nameJp}
                      nameEn={c.nameEn}
                      rarity={c.rarity}
                      isParallel={c.isParallel}
                      imageUrl={c.imageUrl}
                      priceJpy={c.latestPriceJpy ?? undefined}
                      priceThb={c.latestPriceThb ?? undefined}
                      priceChange7d={c.priceChange7d}
                      setCode={c.set.code}
                      pullChancePerBox={perBox ?? undefined}
                    />
                  ))}
                </CardGrid>
              </div>
            </details>
          );
        })
      )}
    </div>
  );
}
