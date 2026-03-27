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

/* ------------------------------------------------------------------ */
/*  Rarity ordering: Leader first, then rare → common, SP last        */
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

const ACCENT: Record<string, string> = {
  TR: "border-l-red-500",
  L: "border-l-orange-500", "P-L": "border-l-orange-500",
  SEC: "border-l-amber-500", "P-SEC": "border-l-amber-500",
  SP: "border-l-pink-500", "P-SP": "border-l-pink-500",
  SR: "border-l-purple-500", "P-SR": "border-l-purple-500",
  R: "border-l-blue-500", "P-R": "border-l-blue-500",
  UC: "border-l-emerald-500", "P-UC": "border-l-emerald-500",
  C: "border-l-neutral-400", "P-C": "border-l-neutral-400",
  DON: "border-l-red-500",
};

const BG: Record<string, string> = {
  TR: "bg-red-500/5",
  SEC: "bg-amber-500/5", "P-SEC": "bg-amber-500/5",
  SP: "bg-pink-500/5", "P-SP": "bg-pink-500/5",
  SR: "bg-purple-500/5", "P-SR": "bg-purple-500/5",
  R: "bg-blue-500/5", "P-R": "bg-blue-500/5",
  DON: "bg-red-500/5",
};

const COLLAPSED = new Set<string>();

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
  const withPrice = cards.filter((c) => c.latestPriceJpy != null && c.latestPriceJpy > 0);
  const totalValue = withPrice.reduce((s, c) => s + (c.latestPriceJpy ?? 0), 0);
  const avgPrice = withPrice.length > 0 ? Math.round(totalValue / withPrice.length) : 0;
  const topCard = withPrice.length > 0
    ? withPrice.reduce((a, b) => (a.latestPriceJpy ?? 0) > (b.latestPriceJpy ?? 0) ? a : b)
    : null;

  const dropRateMap = new Map(set.dropRates.map((dr) => [dr.rarity, dr]));

  // Group cards by rarity and sort groups
  const groups = new Map<string, typeof cards>();
  for (const c of cards) {
    if (!groups.has(c.rarity)) groups.set(c.rarity, []);
    groups.get(c.rarity)!.push(c);
  }
  const sortedGroups = [...groups.entries()].sort(
    (a, b) => rarityRank(a[0]) - rarityRank(b[0])
  );

  const totalCount = sortedGroups.reduce((s, [, c]) => s + c.length, 0);

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Sets", href: "/sets" },
          { label: set.code.toUpperCase() },
        ]}
      />

      {/* Header + Stats — compact single row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-0.5 flex items-center gap-2 text-xs text-muted-foreground">
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
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{set.nameEn ?? set.name}</h1>
        </div>
        <div className="flex gap-4 text-sm">
          <Stat label="การ์ด" value={String(cards.length)} />
          <Stat label="มูลค่ารวม" value={<Price jpy={totalValue} />} />
          <Stat label="เฉลี่ย" value={<Price jpy={avgPrice} />} />
          {topCard && (
            <Stat label="แพงสุด" value={<Price jpy={topCard.latestPriceJpy ?? 0} />} sub={topCard.nameEn ?? topCard.nameJp} />
          )}
        </div>
      </div>

      {/* Pull Rates — collapsed */}
      {set.dropRates.length > 0 && (
        <details className="group panel">
          <summary className="flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-muted/30">
            Pull Rates & Distribution
            <span className="text-xs text-muted-foreground">({sortedGroups.length} rarities)</span>
            <span className="ml-auto text-muted-foreground transition-transform group-open:rotate-90">▸</span>
          </summary>
          <div className="px-4 pb-4">
            <PullRatesTable
              rows={sortedGroups
                .filter(([r]) => dropRateMap.get(r)?.avgPerBox)
                .map(([r, gc]): PullRateRow => {
                  const dr = dropRateMap.get(r)!;
                  return { rarity: r, cardCount: gc.length, avgPerBox: dr.avgPerBox!, ratePerPack: dr.ratePerPack ?? dr.avgPerBox! / PACKS_PER_BOX };
                })}
              packsPerBox={set.packsPerBox}
              cardsPerPack={set.cardsPerPack}
            />
          </div>
        </details>
      )}

      {/* ====== CARDS ====== */}
      {cards.length === 0 ? (
        <div className="panel py-16 text-center text-sm text-muted-foreground">ยังไม่มีการ์ดในชุดนี้</div>
      ) : (
        <div className="space-y-3">
          {sortedGroups.map(([rarity, tierCards]) => (
            <RaritySection
              key={rarity}
              rarity={rarity}
              cards={tierCards}
              dropRateMap={dropRateMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-mono text-lg font-bold tabular-nums leading-tight">{value}</p>
      {sub && <p className="max-w-[120px] truncate text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-bold">{title}</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{count}</span>
      </div>
      {children}
    </div>
  );
}

type CardRow = {
  id: number;
  cardCode: string;
  nameJp: string;
  nameEn: string | null;
  rarity: string;
  isParallel: boolean;
  imageUrl: string | null;
  latestPriceJpy: number | null;
  latestPriceThb: number | null;
  priceChange7d: number | null;
  set: { code: string };
};

function RaritySection({
  rarity,
  cards,
  dropRateMap,
}: {
  rarity: string;
  cards: CardRow[];
  dropRateMap: Map<string, { avgPerBox: number | null; ratePerPack: number | null }>;
}) {
  const dr = dropRateMap.get(rarity);
  const n = cards.length;
  const perBox = dr?.avgPerBox && n > 0 ? pullChance(dr.avgPerBox, n) : null;
  const info = RARITIES.find((r) => r.code === rarity);
  const accent = ACCENT[rarity] ?? "border-l-neutral-400";
  const bg = BG[rarity] ?? "";
  const collapsed = COLLAPSED.has(rarity);

  return (
    <details open={!collapsed} className="group">
      <summary className={`flex cursor-pointer items-center gap-3 rounded-lg border-l-3 ${accent} ${bg} px-4 py-2.5 transition-colors hover:bg-muted/50`}>
        <RarityBadge rarity={rarity} size="md" />
        <span className="text-sm font-semibold">{info?.name ?? rarity}</span>
        <span className="text-xs text-muted-foreground">{n}</span>
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          {dr?.avgPerBox != null && (
            <span className="hidden font-mono tabular-nums sm:inline">~{dr.avgPerBox < 1 ? dr.avgPerBox.toFixed(2) : dr.avgPerBox.toFixed(1)}/box</span>
          )}
          {perBox != null && (
            <span className="font-mono font-semibold tabular-nums text-primary">{formatPct(perBox)}/box</span>
          )}
        </div>
        <span className="text-muted-foreground transition-transform group-open:rotate-90">▸</span>
      </summary>
      <div className="mt-3 mb-1">
        <CardGrid>
          {cards.map((c) => (
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
}
