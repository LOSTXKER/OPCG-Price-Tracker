import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SetType } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const TYPE_ORDER: SetType[] = [
  "BOOSTER",
  "EXTRA_BOOSTER",
  "STARTER",
  "PROMO",
  "OTHER",
];

const TYPE_LABELS: Record<SetType, string> = {
  BOOSTER: "Booster",
  EXTRA_BOOSTER: "Extra Booster",
  STARTER: "Starter",
  PROMO: "Promo",
  OTHER: "อื่น ๆ",
};

export default async function SetsIndexPage() {
  let sets: Awaited<ReturnType<typeof prisma.cardSet.findMany>> = [];
  let dbError = false;

  try {
    sets = await prisma.cardSet.findMany({
      orderBy: [{ type: "asc" }, { code: "asc" }],
    });
  } catch (error) {
    console.error("Failed to fetch sets:", error);
    dbError = true;
  }

  const grouped = new Map<SetType, typeof sets>();
  for (const t of TYPE_ORDER) {
    grouped.set(t, []);
  }
  for (const s of sets) {
    const list = grouped.get(s.type) ?? [];
    list.push(s);
    grouped.set(s.type, list);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          ชุดการ์ดทั้งหมด
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          แยกตามประเภทชุด — คลิกเพื่อดูการ์ดในชุด
        </p>
      </div>

      {dbError ? (
        <div className="rounded-xl border border-dashed border-destructive/50 py-12 text-center">
          <p className="text-destructive text-sm">ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่</p>
        </div>
      ) : sets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <p className="text-muted-foreground text-sm">ยังไม่มีชุดการ์ดในระบบ</p>
        </div>
      ) : (
        <div className="space-y-10">
          {TYPE_ORDER.map((type) => {
            const list = grouped.get(type) ?? [];
            if (list.length === 0) return null;
            return (
              <section key={type} className="space-y-3">
                <h2 className="font-heading text-lg font-semibold tracking-tight">
                  {TYPE_LABELS[type]}
                </h2>
                <ul className="grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((s) => (
                    <li key={s.id}>
                      <Link href={`/sets/${s.code}`} className="block h-full">
                        <Card className="h-full transition-colors hover:bg-muted/40">
                          <CardHeader className="pb-2">
                            <CardTitle className="font-mono text-base">
                              {s.code}
                            </CardTitle>
                            <CardDescription className="line-clamp-2">
                              {s.name}
                              {s.nameEn ? ` · ${s.nameEn}` : null}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground text-sm">
                              {s.cardCount.toLocaleString()} ใบในระบบ
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
