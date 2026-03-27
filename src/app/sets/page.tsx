import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Crown, Package } from "lucide-react";

import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { SetType } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { Price } from "@/components/shared/price-inline";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ชุดการ์ด — ดูกล่องบูสเตอร์และเด็ค",
  description: "ดูชุดการ์ดทั้งหมด ตรวจสอบจำนวนและมูลค่าโดยประมาณ",
};

const TYPE_ORDER: SetType[] = ["BOOSTER", "EXTRA_BOOSTER", "STARTER", "PROMO", "OTHER"];
const TYPE_LABEL: Record<SetType, string> = {
  BOOSTER: "Booster Pack",
  EXTRA_BOOSTER: "Extra Booster",
  STARTER: "Starter Deck",
  PROMO: "Promo",
  OTHER: "Other",
};
const TYPE_EMOJI: Record<SetType, string> = {
  BOOSTER: "📦",
  EXTRA_BOOSTER: "✨",
  STARTER: "🃏",
  PROMO: "🏷️",
  OTHER: "📋",
};

type SetWithCard = {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  type: SetType;
  cardCount: number;
  productCardCount: number;
  releaseDate: Date | null;
  boxImageUrl: string | null;
  topCard: { imageUrl: string | null; latestPriceJpy: number | null } | null;
  totalValue: number;
};

export default async function SetsIndexPage() {
  let setsRaw: SetWithCard[] = [];
  let dbError = false;

  try {
    const sets = await prisma.cardSet.findMany({
      orderBy: [{ type: "asc" }, { code: "asc" }],
    });

    const [products, topCards, valueSums] = await Promise.all([
      prisma.product.findMany({
        select: { code: true, _count: { select: { cards: true } } },
      }),
      prisma.card.findMany({
        where: { setId: { in: sets.map((s) => s.id) }, imageUrl: { not: null } },
        orderBy: { cardCode: "asc" },
        select: { setId: true, imageUrl: true, latestPriceJpy: true },
      }),
      prisma.card.groupBy({
        by: ["setId"],
        where: { setId: { in: sets.map((s) => s.id) }, latestPriceJpy: { gt: 0 } },
        _sum: { latestPriceJpy: true },
      }),
    ]);

    const productCountMap = new Map(products.map((p) => [p.code, p._count.cards]));
    const topCardMap = new Map<number, { imageUrl: string | null; latestPriceJpy: number | null }>();
    for (const tc of topCards) {
      if (!topCardMap.has(tc.setId)) topCardMap.set(tc.setId, { imageUrl: tc.imageUrl, latestPriceJpy: tc.latestPriceJpy });
    }
    const valueMap = new Map<number, number>();
    for (const vs of valueSums) {
      valueMap.set(vs.setId, vs._sum.latestPriceJpy ?? 0);
    }

    setsRaw = sets.map((s) => ({
      ...s,
      productCardCount: productCountMap.get(s.code) ?? s.cardCount,
      topCard: topCardMap.get(s.id) ?? null,
      totalValue: valueMap.get(s.id) ?? 0,
    }));
  } catch (error) {
    console.error("Failed to fetch sets:", error);
    dbError = true;
  }

  const grouped = new Map<SetType, SetWithCard[]>();
  for (const t of TYPE_ORDER) grouped.set(t, []);
  for (const s of setsRaw) {
    const list = grouped.get(s.type) ?? [];
    list.push(s);
    grouped.set(s.type, list);
  }

  const mostValuable = [...setsRaw]
    .filter((s) => s.totalValue > 0)
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5);

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div>
        <h1 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">ชุดการ์ด</h1>
        <p className="mt-1 text-sm text-muted-foreground">เลือกชุดการ์ดเพื่อดูรายละเอียดและราคา</p>
      </div>

      {dbError ? (
        <ErrorBanner />
      ) : setsRaw.length === 0 ? (
        <KumaEmptyState title="ยังไม่มีชุดการ์ดในระบบ" />
      ) : (
        <>
          {/* Top 5 most valuable */}
          {mostValuable.length > 0 && (
            <section className="panel overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-border/60 px-5 py-3.5">
                <Crown className="size-4 text-amber-500" />
                <h2 className="text-sm font-semibold">ชุดที่มีมูลค่ามากที่สุด</h2>
              </div>
              <div className="divide-y divide-border/40">
                {mostValuable.map((s, i) => (
                  <Link
                    key={s.id}
                    href={`/sets/${s.code}`}
                    className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/30"
                  >
                    <span className={`flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${i < 3 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-muted text-muted-foreground"}`}>
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-primary">
                          {s.code.toUpperCase()}
                        </span>
                        <span className="truncate text-sm font-medium">{s.nameEn ?? s.name}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{s.productCardCount} ใบ</span>
                    <span className="shrink-0 font-price text-sm font-semibold">
                      <Price jpy={s.totalValue} />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Sets grouped by type */}
          <div className="space-y-12">
            {TYPE_ORDER.map((type) => {
              const list = grouped.get(type) ?? [];
              if (list.length === 0) return null;
              return (
                <section key={type} className="space-y-5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{TYPE_EMOJI[type]}</span>
                    <h2 className="font-sans text-lg font-bold tracking-tight">{TYPE_LABEL[type]}</h2>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                      {list.length}
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {list.map((s) => (
                      <SetCard key={s.id} set={s} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SetCard({ set }: { set: SetWithCard }) {
  const imageUrl = set.boxImageUrl ?? set.topCard?.imageUrl;

  return (
    <Link href={`/sets/${set.code}`} className="group block">
      <div className="panel flex h-full flex-col overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20">
        {/* Image area */}
        <div className="relative h-36 w-full overflow-hidden bg-gradient-to-b from-muted/80 to-muted/40">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={set.nameEn ?? set.name}
              fill
              className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="size-10 text-muted-foreground/15" />
            </div>
          )}
          {/* Set code badge overlaid on image */}
          <div className="absolute left-2.5 top-2.5">
            <span className="rounded-md bg-background/90 px-2 py-1 font-mono text-xs font-bold text-foreground shadow-sm backdrop-blur-sm">
              {set.code.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <p className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {set.nameEn ?? set.name}
          </p>

          {/* Meta row */}
          <div className="mt-auto flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{set.productCardCount} ใบ</span>
              {set.releaseDate && (
                <>
                  <span className="text-border">·</span>
                  <span>
                    {new Date(set.releaseDate).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "short",
                    })}
                  </span>
                </>
              )}
            </div>
            {set.totalValue > 0 && (
              <span className="font-price text-xs font-semibold text-primary">
                <Price jpy={set.totalValue} />
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
