import type { Metadata } from "next";
import { Suspense } from "react";
import { Layers, TrendingUp, GitCompareArrows } from "lucide-react";
import { LocalizedBreadcrumb } from "@/components/shared/localized-breadcrumb";
import { RelatedPages } from "@/components/shared/related-pages";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { prisma } from "@/lib/db";
import SearchClient from "./search-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search Cards",
  description:
    "Search the entire OPCG card database. Find cards by name, set, rarity, color and more.",
  alternates: { canonical: "/search" },
};

async function getSearchMeta() {
  const [sets, rarityRows] = await Promise.all([
    prisma.cardSet.findMany({
      select: {
        code: true,
        name: true,
        nameEn: true,
        nameTh: true,
        type: true,
        boxImageUrl: true,
        releaseDate: true,
      },
      orderBy: { code: "asc" },
    }),
    prisma.card.findMany({
      distinct: ["rarity"],
      select: { rarity: true },
      orderBy: { rarity: "asc" },
    }),
  ]);
  return {
    sets: sets.map((s) => ({
      code: s.code,
      name: s.name,
      nameEn: s.nameEn,
      nameTh: s.nameTh,
      type: s.type,
      imageUrl: s.boxImageUrl,
      releaseDate: s.releaseDate ? s.releaseDate.toISOString() : null,
    })),
    rarities: rarityRows.map((r) => r.rarity),
  };
}

export default async function SearchPage() {
  const { sets, rarities } = await getSearchMeta();

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Search", href: "/search" }])} />
      <LocalizedBreadcrumb items={[{ labelKey: "home", href: "/" }, { labelKey: "search" }]} />
      <Suspense>
        <SearchClient sets={sets} rarities={rarities} />
      </Suspense>
      <RelatedPages items={[
        { href: "/sets", icon: Layers, title: "ชุดการ์ด", description: "ดูทุกชุดการ์ดพร้อมมูลค่า" },
        { href: "/trending", icon: TrendingUp, title: "Trending", description: "การ์ดที่ราคาขยับมากที่สุด" },
        { href: "/compare", icon: GitCompareArrows, title: "เปรียบเทียบ", description: "เทียบการ์ดหลายใบ" },
      ]} />
    </>
  );
}
