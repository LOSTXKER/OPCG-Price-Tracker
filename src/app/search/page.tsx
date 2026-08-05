import type { Metadata } from "next";
import { Suspense } from "react";
import { Layers, TrendingUp, GitCompareArrows } from "lucide-react";
import { LocalizedBreadcrumb } from "@/components/shared/localized-breadcrumb";
import { RelatedPages } from "@/components/shared/related-pages";
import { FaqSection } from "@/components/shared/faq-section";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/json-ld";
import { prisma } from "@/lib/db";
import { buildCardSetScope } from "@/lib/game/card-scope";
import { getServerGame } from "@/lib/game/server";
import { getServerLanguage } from "@/lib/i18n/server";
import { getCardName } from "@/lib/i18n";
import {
  TOOL_PAGE_METADATA,
  buildSearchCopy,
  buildSearchFaq,
} from "@/lib/seo/copy/tools";
import { CARDS_PAGE_SIZE } from "@/lib/constants/ui";
import SearchClient from "./search-client";
import {
  SearchBrowseBlocks,
  SearchSsrResults,
  type SsrSearchCard,
} from "./search-seo-blocks";
import { UntilHydrated } from "./until-hydrated";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: TOOL_PAGE_METADATA.search.title,
  description: TOOL_PAGE_METADATA.search.description,
  alternates: { canonical: TOOL_PAGE_METADATA.search.canonical },
};

/** Newest sets first for the crawlable browse list (NULL release dates last). */
const BROWSE_SET_COUNT = 12;

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

/**
 * Same shape of query the `/api/cards` handler runs for a plain search (name in
 * any language OR card code, scoped to the active game, most expensive first) —
 * run here on the server so `?q=` URLs answer with the results already in the
 * HTML instead of an empty shell.
 */
async function searchCards(
  query: string,
  game: string,
): Promise<{ cards: SsrSearchCard[]; total: number }> {
  const where = {
    set: buildCardSetScope(game),
    OR: [
      { nameJp: { contains: query, mode: "insensitive" as const } },
      { nameEn: { contains: query, mode: "insensitive" as const } },
      { nameTh: { contains: query, mode: "insensitive" as const } },
      { cardCode: { contains: query, mode: "insensitive" as const } },
    ],
  };

  const [rows, total] = await Promise.all([
    prisma.card.findMany({
      where,
      orderBy: { latestPriceJpy: { sort: "desc", nulls: "last" } },
      take: CARDS_PAGE_SIZE,
      select: {
        cardCode: true,
        nameJp: true,
        nameEn: true,
        nameTh: true,
        rarity: true,
        latestPriceJpy: true,
        imageUrl: true,
        set: { select: { code: true } },
      },
    }),
    prisma.card.count({ where }),
  ]);

  return {
    cards: rows.map((card) => ({
      cardCode: card.cardCode,
      nameJp: card.nameJp,
      nameEn: card.nameEn,
      nameTh: card.nameTh,
      rarity: card.rarity,
      latestPriceJpy: card.latestPriceJpy,
      imageUrl: card.imageUrl,
      setCode: card.set.code,
    })),
    total,
  };
}

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = firstParam(params.q).trim().slice(0, 100);
  const game = await getServerGame();
  const lang = await getServerLanguage();
  const [{ sets }, results] = await Promise.all([
    getSearchMeta(game),
    query ? searchCards(query, game) : Promise.resolve(null),
  ]);

  const copy = buildSearchCopy(lang);
  const browseSets = [...sets]
    .sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""))
    .slice(0, BROWSE_SET_COUNT);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Search", href: "/opcg/search" }])} />
      {results && results.cards.length > 0 && (
        <JsonLd
          data={itemListJsonLd(
            copy.resultsTitle(query, results.total),
            results.cards.map((card) => ({
              name: `${card.cardCode} ${getCardName(lang, card)}`,
              url: `/opcg/cards/${card.cardCode}`,
              image: card.imageUrl,
            })),
          )}
        />
      )}
      <LocalizedBreadcrumb items={[{ labelKey: "home", href: "/" }, { labelKey: "search" }]} />

      {/* The single visible H1 — it used to be an sr-only English string. */}
      <div className="mb-5 space-y-2">
        <h1 className="text-h1">{copy.h1}</h1>
        <p className="text-body-sm text-muted-foreground">{copy.intro}</p>
      </div>

      <Suspense>
        <SearchClient sets={sets} game={game} />
      </Suspense>

      {results && results.cards.length > 0 && (
        <div className="mt-6">
          <UntilHydrated>
            <SearchSsrResults
              lang={lang}
              query={query}
              total={results.total}
              cards={results.cards}
            />
          </UntilHydrated>
        </div>
      )}

      <div className="mt-10">
        <SearchBrowseBlocks lang={lang} sets={browseSets} />
      </div>

      <FaqSection items={buildSearchFaq(lang)} />

      <RelatedPages items={[
        { href: "/opcg/sets", icon: Layers, title: "ชุดการ์ด", description: "ดูทุกชุดการ์ดพร้อมมูลค่า" },
        { href: "/opcg/trending", icon: TrendingUp, title: "Trending", description: "การ์ดที่ราคาขยับมากที่สุด" },
        { href: "/opcg/compare", icon: GitCompareArrows, title: "เปรียบเทียบ", description: "เทียบการ์ดหลายใบ" },
      ]} />
    </>
  );
}
