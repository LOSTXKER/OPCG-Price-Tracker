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
  BOOSTER: "Booster",
  EXTRA_BOOSTER: "Extra Booster",
  STARTER: "Starter Deck",
  PROMO: "Promo",
  OTHER: "Other",
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
    <div className="space-y-8">
      <div>
        <h1 className="font-sans text-2xl font-bold tracking-tight">Sets</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">ชุดการ์ดทั้งหมด — คลิกเพื่อดูการ์ดในชุด</p>
      </div>

      {dbError ? (
        <ErrorBanner />
      ) : setsRaw.length === 0 ? (
        <KumaEmptyState title="ยังไม่มีชุดการ์ดในระบบ" />
      ) : (
        <>
          {mostValuable.length > 0 && (
            <div className="panel overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-semibold">
                <Crown className="size-4 text-foreground" />
                ชุดที่มีมูลค่ามากที่สุด
              </div>
              <table className="w-full text-left text-sm">
                <tbody>
                  {mostValuable.map((s, i) => (
                    <tr key={s.id} className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2.5 align-middle">
                        <span className={`flex size-5 items-center justify-center rounded font-mono text-[10px] font-bold ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 align-middle">
                        <Link href={`/sets/${s.code}`} className="font-medium hover:text-primary">
                          {s.code.toUpperCase()}
                        </Link>
                      </td>
                      <td className="hidden py-2.5 pr-3 align-middle text-xs text-muted-foreground sm:table-cell">
                        {s.nameEn ?? s.name}
                      </td>
                      <td className="py-2.5 pr-3 text-right align-middle font-mono text-xs text-muted-foreground">
                        {s.productCardCount} ใบ
                      </td>
                      <td className="px-4 py-2.5 text-right align-middle font-price text-sm font-semibold">
                        <Price jpy={s.totalValue} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="space-y-10">
            {TYPE_ORDER.map((type) => {
              const list = grouped.get(type) ?? [];
              if (list.length === 0) return null;
              return (
                <section key={type} className="space-y-4">
                  <div className="flex items-baseline gap-2">
                    <h2 className="font-sans text-lg font-semibold tracking-tight">{TYPE_LABEL[type]}</h2>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{list.length}</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((s) => (
                      <Link key={s.id} href={`/sets/${s.code}`} className="group block">
                        <div className="panel overflow-hidden transition-shadow hover:shadow-md">
                          {s.topCard?.imageUrl ? (
                            <div className="relative h-40 w-full overflow-hidden bg-muted">
                              <Image src={s.topCard.imageUrl} alt={s.nameEn ?? s.name} fill className="object-contain transition-transform duration-300 group-hover:scale-[1.03]" sizes="(max-width: 640px) 100vw, 33vw" />
                            </div>
                          ) : (
                            <div className="flex h-28 items-center justify-center bg-muted">
                              <Package className="size-8 text-muted-foreground/20" />
                            </div>
                          )}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold leading-tight">{s.nameEn ?? s.name}</p>
                              <span className="font-price text-xs text-muted-foreground">{s.productCardCount} cards</span>
                            </div>
                            {s.releaseDate && (
                              <p className="mt-1 text-xs text-muted-foreground">{new Date(s.releaseDate).toLocaleDateString("th-TH", { year: "numeric", month: "short" })}</p>
                            )}
                          </div>
                        </div>
                      </Link>
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
