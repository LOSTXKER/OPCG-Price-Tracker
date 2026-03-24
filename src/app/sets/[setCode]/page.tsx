import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { CardGrid } from "@/components/cards/card-grid";
import { CardItem } from "@/components/cards/card-item";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { prisma } from "@/lib/db";
import { Price } from "@/components/shared/price-inline";

export const dynamic = "force-dynamic";

const getSet = cache(async (setCode: string) => {
  const code = decodeURIComponent(setCode);
  return prisma.cardSet.findUnique({
    where: { code },
    include: {
      cards: {
        orderBy: { cardCode: "asc" },
        include: { set: { select: { code: true } } },
      },
    },
  });
});

export async function generateMetadata(props: {
  params: Promise<{ setCode: string }>;
}): Promise<Metadata> {
  const { setCode } = await props.params;
  const set = await getSet(setCode);
  if (!set) return { title: "ไม่พบชุด" };
  return {
    title: `${set.code} — ${set.nameEn ?? set.name}`,
    description: `${set.cardCount.toLocaleString()} ใบ · ${set.nameEn ?? set.name}`,
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

  const rarityDist = new Map<string, number>();
  for (const c of cards) {
    rarityDist.set(c.rarity, (rarityDist.get(c.rarity) ?? 0) + 1);
  }
  const rarityEntries = [...rarityDist.entries()].sort((a, b) => b[1] - a[1]);
  const totalForBar = cards.length || 1;

  return (
    <div className="space-y-8">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Sets", href: "/sets" },
          { label: set.code },
        ]}
      />

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
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">การ์ดทั้งหมด</p>
          <p className="mt-1 font-sans text-2xl font-bold tabular-nums">{cards.length}</p>
        </div>
        <div className="panel p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">มูลค่ารวม</p>
          <p className="mt-1 font-sans text-2xl font-bold tabular-nums font-mono"><Price jpy={totalValue} /></p>
        </div>
        <div className="panel p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">ราคาเฉลี่ย</p>
          <p className="mt-1 font-sans text-2xl font-bold tabular-nums font-mono"><Price jpy={avgPrice} /></p>
        </div>
        <div className="panel p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">แพงที่สุด</p>
          <p className="mt-1 font-sans text-2xl font-bold tabular-nums font-mono">{mostExpensive ? <Price jpy={mostExpensive.latestPriceJpy ?? 0} /> : "—"}</p>
          {mostExpensive && <p className="mt-0.5 truncate text-xs text-muted-foreground">{mostExpensive.nameEn ?? mostExpensive.nameJp}</p>}
        </div>
      </div>

      {/* Rarity Distribution */}
      {rarityEntries.length > 0 && (
        <div className="panel p-5">
          <h2 className="mb-4 text-sm font-semibold">Rarity Distribution</h2>
          <div className="space-y-2.5">
            {rarityEntries.map(([rarity, count]) => {
              const pct = Math.round((count / totalForBar) * 100);
              return (
                <Link
                  key={rarity}
                  href={`/cards?set=${set.code}&rarity=${rarity}`}
                  className="group flex items-center gap-3 transition-opacity hover:opacity-70"
                >
                  <span className="w-12 shrink-0 font-mono text-sm font-medium">{rarity}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary/60" style={{ width: `${Math.max(pct, 4)}%` }} />
                  </div>
                  <span className="w-14 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">{count} ({pct}%)</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Cards */}
      {cards.length === 0 ? (
        <div className="panel py-16 text-center">
          <p className="text-sm text-muted-foreground">ยังไม่มีการ์ดในชุดนี้</p>
        </div>
      ) : (
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
            />
          ))}
        </CardGrid>
      )}
    </div>
  );
}
