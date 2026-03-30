import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Layers } from "lucide-react";
import { prisma } from "@/lib/db";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { RelatedPages } from "@/components/shared/related-pages";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sets — คู่มือ OPCG",
  description:
    "Browse all OPCG booster sets, starter decks and extra boosters. Release dates, card counts and notable cards for each set.",
  alternates: { canonical: "/guide/sets" },
};

export default async function GuideSetsPage() {
  let sets: { code: string; name: string; nameEn: string | null; cardCount: number; releaseDate: Date | null }[] = [];
  try {
    sets = await prisma.cardSet.findMany({
      select: { code: true, name: true, nameEn: true, cardCount: true, releaseDate: true },
      orderBy: { code: "asc" },
    });
  } catch {
    // DB error — show empty
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", href: "/" },
        { name: "Guide", href: "/guide" },
        { name: "Sets", href: "/guide/sets" },
      ])} />
      <div className="space-y-3">
        <Breadcrumb items={[
          { label: "Home", href: "/" },
          { label: "Guide", href: "/guide" },
          { label: "Sets" },
        ]} />
        <h1 className="font-sans text-3xl font-bold tracking-tight">
          Sets
        </h1>
        <p className="text-muted-foreground text-lg">
          ชุดการ์ดทั้งหมดของ OPCG ตั้งแต่เปิดตัว
        </p>
      </div>

      {sets.length > 0 ? (
        <div className="space-y-2">
          {sets.map((set) => (
            <Link
              key={set.code}
              href={`/sets/${set.code}`}
              className="panel flex items-center gap-4 p-3 transition-colors hover:bg-accent/50"
            >
              <span className="font-mono text-sm font-bold text-primary">
                {set.code}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{set.nameEn ?? set.name}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-sm text-muted-foreground">
                  {set.cardCount} ใบ
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <p className="text-muted-foreground text-sm">ยังไม่มีข้อมูลชุดในระบบ</p>
        </div>
      )}

      <RelatedPages
        items={[
          { href: "/sets", icon: Layers, title: "ดูชุดการ์ดทั้งหมด", description: "ราคาและข้อมูลชุดการ์ดแบบ real-time" },
        ]}
      />

      <div className="flex items-center justify-between border-t border-border pt-6">
        <Link
          href="/guide/colors"
          className="text-muted-foreground text-sm hover:text-foreground"
        >
          ← Colors
        </Link>
        <Link
          href="/guide/buying"
          className="group inline-flex items-center gap-2 font-sans text-sm font-semibold text-primary hover:underline"
        >
          บทต่อไป: Buying Guide
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
