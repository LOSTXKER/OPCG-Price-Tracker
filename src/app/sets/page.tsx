import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";

import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { SetType } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

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
  releaseDate: Date | null;
  topCard: { imageUrl: string | null; latestPriceJpy: number | null } | null;
};

export default async function SetsIndexPage() {
  let setsRaw: SetWithCard[] = [];
  let dbError = false;

  try {
    const sets = await prisma.cardSet.findMany({
      orderBy: [{ type: "asc" }, { code: "asc" }],
    });
    const setIds = sets.map((s) => s.id);
    const topCards = await prisma.card.findMany({
      where: { setId: { in: setIds }, latestPriceJpy: { not: null, gt: 0 }, imageUrl: { not: null } },
      orderBy: { latestPriceJpy: "desc" },
      select: { setId: true, imageUrl: true, latestPriceJpy: true },
    });
    const topCardMap = new Map<number, { imageUrl: string | null; latestPriceJpy: number | null }>();
    for (const tc of topCards) {
      if (!topCardMap.has(tc.setId)) topCardMap.set(tc.setId, { imageUrl: tc.imageUrl, latestPriceJpy: tc.latestPriceJpy });
    }
    setsRaw = sets.map((s) => ({ ...s, topCard: topCardMap.get(s.id) ?? null }));
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
                            <span className="font-price text-xs text-muted-foreground">{s.cardCount} cards</span>
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
      )}
    </div>
  );
}
