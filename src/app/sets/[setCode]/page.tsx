import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { CardGrid } from "@/components/cards/card-grid";
import { CardItem } from "@/components/cards/card-item";
import { prisma } from "@/lib/db";

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
  if (!set) {
    return { title: "ไม่พบชุด" };
  }
  const title = `${set.code} ${set.name}`;
  return {
    title,
    description: `${set.cardCount.toLocaleString()} ใบ · ${set.name}${set.nameEn ? ` (${set.nameEn})` : ""}`,
  };
}

export default async function SetDetailPage(props: {
  params: Promise<{ setCode: string }>;
}) {
  const { setCode } = await props.params;
  const set = await getSet(setCode);
  if (!set) notFound();

  return (
    <div className="space-y-8">
      <nav
        className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span aria-hidden>/</span>
        <Link href="/sets" className="hover:text-foreground transition-colors">
          Sets
        </Link>
        <span aria-hidden>/</span>
        <span className="text-foreground font-mono">{set.code}</span>
      </nav>

      <header className="space-y-2">
        <p className="text-muted-foreground font-mono text-sm">{set.code}</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {set.name}
        </h1>
        {set.nameEn ? (
          <p className="text-muted-foreground text-sm">{set.nameEn}</p>
        ) : null}
        <div className="text-muted-foreground flex flex-wrap gap-3 text-sm">
          <span>{set.type.replaceAll("_", " ")}</span>
          {set.releaseDate ? (
            <span>
              วางจำหน่าย{" "}
              {set.releaseDate.toLocaleDateString("th-TH", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          ) : null}
          <span>{set.cards.length.toLocaleString()} ใบ</span>
        </div>
      </header>

      {set.cards.length === 0 ? (
        <p className="text-muted-foreground text-sm">ยังไม่มีการ์ดในชุดนี้</p>
      ) : (
        <CardGrid>
          {set.cards.map((c) => (
            <CardItem
              key={c.id}
              cardCode={c.cardCode}
              nameJp={c.nameJp}
              nameEn={c.nameEn}
              rarity={c.rarity}
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
