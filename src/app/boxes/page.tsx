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
  BOOSTER: "บูสเตอร์",
  EXTRA_BOOSTER: "เอ็กซ์ตร้าบูสเตอร์",
  STARTER: "สตาร์เตอร์เด็ค",
  PROMO: "โปรโม",
  OTHER: "อื่นๆ",
};

type SetWithStats = {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  type: SetType;
  cardCount: number;
  packsPerBox: number | null;
  cardsPerPack: number | null;
  releaseDate: Date | null;
  topCard: { imageUrl: string | null; latestPriceJpy: number | null } | null;
  totalValue: number;
};

export default async function BoxesPage() {
  let setsRaw: SetWithStats[] = [];
  let dbError = false;

  try {
    const sets = await prisma.cardSet.findMany({
      orderBy: [{ releaseDate: "desc" }, { code: "desc" }],
    });

    const setIds = sets.map((s) => s.id);

    const [topCards, valueSums] = await Promise.all([
      prisma.card.findMany({
        where: {
          setId: { in: setIds },
          latestPriceJpy: { not: null, gt: 0 },
          imageUrl: { not: null },
        },
        orderBy: { latestPriceJpy: "desc" },
        select: { setId: true, imageUrl: true, latestPriceJpy: true },
      }),
      prisma.card.groupBy({
        by: ["setId"],
        where: { setId: { in: setIds }, latestPriceJpy: { gt: 0 } },
        _sum: { latestPriceJpy: true },
      }),
    ]);

    const topCardMap = new Map<number, { imageUrl: string | null; latestPriceJpy: number | null }>();
    for (const tc of topCards) {
      if (!topCardMap.has(tc.setId)) {
        topCardMap.set(tc.setId, { imageUrl: tc.imageUrl, latestPriceJpy: tc.latestPriceJpy });
      }
    }

    const valueMap = new Map<number, number>();
    for (const vs of valueSums) {
      valueMap.set(vs.setId, vs._sum.latestPriceJpy ?? 0);
    }

    setsRaw = sets.map((s) => ({
      ...s,
      topCard: topCardMap.get(s.id) ?? null,
      totalValue: valueMap.get(s.id) ?? 0,
    }));
  } catch (error) {
    console.error("Failed to fetch sets:", error);
    dbError = true;
  }

  const grouped = new Map<SetType, SetWithStats[]>();
  for (const t of TYPE_ORDER) grouped.set(t, []);
  for (const s of setsRaw) {
    const list = grouped.get(s.type) ?? [];
    list.push(s);
    grouped.set(s.type, list);
  }

  const mostValuable = [...setsRaw].sort((a, b) => b.totalValue - a.totalValue).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-xl font-bold tracking-tight">ชุดการ์ด</h1>
        <p className="text-xs text-muted-foreground">
          ดูชุดการ์ดทั้งหมด ตรวจสอบจำนวนและมูลค่าโดยประมาณ
        </p>
      </div>

      {dbError ? (
        <ErrorBanner />
      ) : setsRaw.length === 0 ? (
        <KumaEmptyState title="ไม่พบชุดการ์ด" />
      ) : (
        <>
          {/* Top sets by value */}
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
                        <Link href={`/boxes/${s.code}`} className="font-medium hover:text-primary">
                          {s.code.toUpperCase()}
                        </Link>
                      </td>
                      <td className="hidden py-2.5 pr-3 align-middle text-xs text-muted-foreground sm:table-cell">
                        {s.nameEn ?? s.name}
                      </td>
                      <td className="py-2.5 pr-3 text-right align-middle font-mono text-xs text-muted-foreground">
                        {s.cardCount} ใบ
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

          {/* Sets grouped by type */}
          <div className="space-y-8">
            {TYPE_ORDER.map((type) => {
              const list = grouped.get(type) ?? [];
              if (list.length === 0) return null;
              return (
                <section key={type} className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <h2 className="font-sans text-sm font-semibold tracking-tight">{TYPE_LABEL[type]}</h2>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {list.length}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {list.map((s) => (
                      <Link key={s.id} href={`/boxes/${s.code}`} className="group block">
                        <div className="panel flex items-start gap-3 p-3 transition-colors hover:border-primary/30">
                          <div className="relative size-16 shrink-0 overflow-hidden rounded bg-muted">
                            {s.topCard?.imageUrl ? (
                              <Image
                                src={s.topCard.imageUrl}
                                alt={s.nameEn ?? s.name}
                                fill
                                className="object-contain"
                                sizes="64px"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center">
                                <Package className="size-5 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-price text-xs font-bold text-foreground">
                              {s.code.toUpperCase()}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">{s.nameEn ?? s.name}</p>
                            <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="font-price">{s.cardCount} ใบ</span>
                              {s.totalValue > 0 && (
                                <>
                                  <span>&middot;</span>
                                  <span className="font-price font-semibold text-foreground">
                                    <Price jpy={s.totalValue} />
                                  </span>
                                </>
                              )}
                            </div>
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
