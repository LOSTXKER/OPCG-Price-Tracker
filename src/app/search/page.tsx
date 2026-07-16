import type { Metadata } from "next";
import { Suspense } from "react";
import { Layers, TrendingUp, GitCompareArrows } from "lucide-react";
import { LocalizedBreadcrumb } from "@/components/shared/localized-breadcrumb";
import { RelatedPages } from "@/components/shared/related-pages";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { prisma } from "@/lib/db";
import { buildCardSetScope } from "@/lib/game/card-scope";
import { getServerGame } from "@/lib/game/server";
import SearchClient from "./search-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search Cards",
  description:
    "Search the entire OPCG card database. Find cards by name, set, rarity, color and more.",
  alternates: { canonical: "/opcg/search" },
};

async function getSearchMeta(game: string) {
  // Rarity options come from the game config (BASE only) in the client, so we no
  // longer query distinct DB rarities (which include "P-SEC" etc.). Sets only.
  const sets = await prisma.cardSet.findMany({
    where: buildCardSetScope(game),
    select: {
      id: true,
      code: true,
      name: true,
      nameEn: true,
      nameTh: true,
      type: true,
      boxImageUrl: true,
      releaseDate: true,
    },
    orderBy: { code: "asc" },
  });
  return {
    sets: sets.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      nameEn: s.nameEn,
      nameTh: s.nameTh,
      type: s.type,
      imageUrl: s.boxImageUrl,
      releaseDate: s.releaseDate ? s.releaseDate.toISOString() : null,
    })),
  };
}

export default async function SearchPage() {
  const game = await getServerGame();
  const { sets } = await getSearchMeta(game);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Search", href: "/opcg/search" }])} />
      <h1 className="sr-only">Search cards</h1>
      <LocalizedBreadcrumb items={[{ labelKey: "home", href: "/" }, { labelKey: "search" }]} />
      <Suspense>
        <SearchClient sets={sets} game={game} />
      </Suspense>
      <RelatedPages items={[
        { href: "/opcg/sets", icon: Layers, title: "ชุดการ์ด", description: "ดูทุกชุดการ์ดพร้อมมูลค่า" },
        { href: "/opcg/trending", icon: TrendingUp, title: "Trending", description: "การ์ดที่ราคาขยับมากที่สุด" },
        { href: "/opcg/compare", icon: GitCompareArrows, title: "เปรียบเทียบ", description: "เทียบการ์ดหลายใบ" },
      ]} />
    </>
  );
}
