import Link from "next/link";
import type { Metadata } from "next";
import {
  ImageIcon,
  Package,
  Printer,
  Sparkles,
  Swords,
  Users,
} from "lucide-react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { jpyToThb } from "@/lib/utils/currency";
import { formatSnapshotDate, formatTierPriceLabel, type TierPriceStats } from "./rarity-price-format";
import { Surface } from "@/components/ui/surface";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { FaqSection } from "@/components/shared/faq-section";
import { PageHeader } from "@/components/layout/page-header";
import { GuideSourceList } from "@/components/guide/guide-source-list";
import { GuideCallout } from "@/components/guide/guide-callout";
import { GuidePrevNext } from "@/components/guide/guide-prev-next";
import { CardThumbStrip } from "@/components/guide/card-thumb-strip";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { t, type Language } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";
import {
  GUIDE_META,
  guideFaqHeading,
  guideRarityBoxHeading,
  guideRarityFactorsHeading,
  guideRarityFaq,
  guideRarityH1,
  rarityAnchorId,
} from "@/lib/seo/copy/guide";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: GUIDE_META.rarities.title,
  description: GUIDE_META.rarities.description,
  canonical: "/guide/rarities",
  ogType: "article",
});

/* ------------------------------------------------------------------ */
/*  Rarity data                                                        */
/* ------------------------------------------------------------------ */

interface RarityTier {
  code: string;
  name: string;
  color: string;
  perSet: string;
  description: string;
  prominent?: boolean;
}

/** Base rarity tier codes shown on this page — matches `Card.rarity` in the DB
 *  (Parallel variants use a separate `P-*` rarity and are covered by
 *  `buildParallelTiers` / the parallel comparison below, not here). */
const RARITY_TIER_CODES = ["TR", "SP", "SEC", "SR", "R", "UC", "C", "L", "DON", "P"] as const;

function buildRarityTiers(lang: Language): RarityTier[] {
  return [
    {
      code: "TR",
      name: "Treasure Rare",
      color: "#EF4444",
      perSet: t(lang, "guideRarityTrPerSet"),
      description: t(lang, "guideRarityTrDesc"),
      prominent: true,
    },
    {
      code: "SP",
      name: "Special",
      color: "#EC4899",
      perSet: t(lang, "guideRaritySpPerSet"),
      description: t(lang, "guideRaritySpDesc"),
      prominent: true,
    },
    {
      code: "SEC",
      name: "Secret Rare",
      color: "#F59E0B",
      perSet: t(lang, "guideRaritySecPerSet"),
      description: t(lang, "guideRaritySecDesc"),
      prominent: true,
    },
    {
      code: "SR",
      name: "Super Rare",
      color: "#8B5CF6",
      perSet: t(lang, "guideRaritySrPerSet"),
      description: t(lang, "guideRaritySrDesc"),
    },
    {
      code: "R",
      name: "Rare",
      color: "#3B82F6",
      perSet: t(lang, "guideRarityRPerSet"),
      description: t(lang, "guideRarityRDesc"),
    },
    {
      code: "UC",
      name: "Uncommon",
      color: "#22C55E",
      perSet: t(lang, "guideRarityUcPerSet"),
      description: t(lang, "guideRarityUcDesc"),
    },
    {
      code: "C",
      name: "Common",
      color: "#6B7280",
      perSet: t(lang, "guideRarityCPerSet"),
      description: t(lang, "guideRarityCDesc"),
    },
    {
      code: "L",
      name: "Leader",
      color: "#F97316",
      perSet: t(lang, "guideRarityLPerSet"),
      description: t(lang, "guideRarityLDesc"),
    },
    {
      code: "DON",
      name: "DON!!",
      color: "#EA580C",
      perSet: t(lang, "guideRarityDonPerSet"),
      description: t(lang, "guideRarityDonDesc"),
    },
    {
      code: "P",
      name: "Promo",
      color: "#06B6D4",
      perSet: t(lang, "guideRarityPPerSet"),
      description: t(lang, "guideRarityPDesc"),
    },
  ];
}

/** A true same-card SEC → Parallel → Super Parallel price example, found live
 *  in the catalogue by `getRarityPriceStats` (see below) instead of the
 *  hand-typed ¥500 / ¥1,480 / ¥198,000 this section used to show. */
type ParallelTriple = {
  name: string;
  base: { code: string; thb: number };
  parallel: { code: string; thb: number };
  superParallel: { code: string; thb: number };
} | null;

function buildParallelComparison(lang: Language, triple: ParallelTriple) {
  if (!triple) return null;
  return [
    {
      label: t(lang, "guideRarityCompareSecLabel"),
      href: `/opcg/cards/${triple.base.code}`,
      priceThb: triple.base.thb,
      color: "#F59E0B",
      sub: t(lang, "guideRarityCompareSecSub"),
    },
    {
      label: t(lang, "guideRarityComparePsecLabel"),
      href: `/opcg/cards/${triple.parallel.code}`,
      priceThb: triple.parallel.thb,
      color: "#F59E0B",
      sub: t(lang, "guideRarityComparePsecSub"),
    },
    {
      label: t(lang, "guideRarityCompareSuperLabel"),
      href: `/opcg/cards/${triple.superParallel.code}`,
      priceThb: triple.superParallel.thb,
      color: "#EC4899",
      sub: t(lang, "guideRarityCompareSuperSub"),
    },
  ];
}

function buildParallelTiers(lang: Language) {
  return [
    { code: "P-C", name: t(lang, "guideRarityParallelCommon"), color: "#6B7280" },
    { code: "P-UC", name: t(lang, "guideRarityParallelUncommon"), color: "#22C55E" },
    { code: "P-R", name: t(lang, "guideRarityParallelRare"), color: "#3B82F6" },
    { code: "P-SR", name: t(lang, "guideRarityParallelSuperRare"), color: "#8B5CF6" },
    { code: "P-SEC", name: t(lang, "guideRarityParallelSecretRare"), color: "#F59E0B" },
    { code: "P-L", name: t(lang, "guideRarityParallelLeader"), color: "#F97316" },
  ];
}

function buildPriceFactors(lang: Language) {
  return [
    {
      icon: Sparkles,
      title: t(lang, "guideRarityFactorRarityTitle"),
      desc: t(lang, "guideRarityFactorRarityDesc"),
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
    },
    {
      icon: Users,
      title: t(lang, "guideRarityFactorPopularTitle"),
      desc: t(lang, "guideRarityFactorPopularDesc"),
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
    },
    {
      icon: Swords,
      title: t(lang, "guideRarityFactorMetaTitle"),
      desc: t(lang, "guideRarityFactorMetaDesc"),
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
    },
    {
      icon: ImageIcon,
      title: t(lang, "guideRarityFactorArtTitle"),
      desc: t(lang, "guideRarityFactorArtDesc"),
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
    },
    {
      icon: Package,
      title: t(lang, "guideRarityFactorSupplyTitle"),
      desc: t(lang, "guideRarityFactorSupplyDesc"),
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
    },
    {
      icon: Printer,
      title: t(lang, "guideRarityFactorOopTitle"),
      desc: t(lang, "guideRarityFactorOopDesc"),
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
    },
  ];
}

function buildSources(lang: Language) {
  return [
    {
      label: "Official Rules",
      desc: t(lang, "guideRaritySourceRulesDesc"),
      url: "https://en.onepiece-cardgame.com/rules/",
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  DB query                                                           */
/* ------------------------------------------------------------------ */

type ExampleCard = {
  cardCode: string;
  nameEn: string | null;
  nameJp: string;
  imageUrl: string | null;
};

/**
 * Only the prominent tiers (TR / SP / SEC) render example thumbnails, so we ask
 * for four cards per tier instead of scanning the whole card table on every
 * request. Cached for an hour — the examples are illustrative, not live data.
 */
const EXAMPLE_RARITIES = ["TR", "SP", "SEC"] as const;

const getExampleCards = unstable_cache(
  async (): Promise<{
    byRarity: Record<string, ExampleCard[]>;
    parallels: ExampleCard[];
  }> => {
    try {
      const select = {
        cardCode: true,
        nameEn: true,
        nameJp: true,
        imageUrl: true,
      } as const;

      const [tiers, parallels] = await Promise.all([
        Promise.all(
          EXAMPLE_RARITIES.map((rarity) =>
            prisma.card.findMany({
              where: { imageUrl: { not: null }, isParallel: false, rarity },
              select,
              orderBy: { cardCode: "asc" },
              take: 4,
            })
          )
        ),
        prisma.card.findMany({
          where: { imageUrl: { not: null }, isParallel: true },
          select,
          orderBy: { cardCode: "asc" },
          take: 6,
        }),
      ]);

      const byRarity: Record<string, ExampleCard[]> = {};
      EXAMPLE_RARITIES.forEach((rarity, i) => {
        byRarity[rarity] = tiers[i] ?? [];
      });

      return { byRarity, parallels };
    } catch {
      return { byRarity: {}, parallels: [] };
    }
  },
  ["guide-rarity-examples"],
  { revalidate: 3600, tags: ["guide-cards"] }
);

type RaritySecCard = { cardCode: string; nameEn: string | null; nameJp: string; latestPriceJpy: number | null };
type RarityParallelCard = { cardCode: string; baseCode: string | null; parallelIndex: number | null; latestPriceJpy: number | null };

/**
 * Real per-tier price ranges (min/median/max, THB) + a real same-card
 * SEC → Parallel → Super Parallel example, computed from `Card.latestPriceJpy`
 * (same denormalized field the rest of the site already treats as the
 * current price — see `lib/data/most-expensive.ts`) instead of the
 * hand-typed numbers this page used to ship. Cached for an hour, same
 * pattern as `getExampleCards` above — this is a snapshot for an
 * illustrative guide page, not a live price feed.
 */
const getRarityPriceStats = unstable_cache(
  async (): Promise<{
    tiers: Record<string, TierPriceStats | null>;
    triple: ParallelTriple;
    snapshotAt: string | null;
  }> => {
    const emptyTiers = Object.fromEntries(RARITY_TIER_CODES.map((code) => [code, null])) as Record<
      string,
      TierPriceStats | null
    >;
    try {
      const [priced, secCards, pSecCards, latestPrice] = await Promise.all([
        prisma.card.findMany({
          where: { rarity: { in: [...RARITY_TIER_CODES] }, latestPriceJpy: { not: null, gt: 0 } },
          select: { rarity: true, latestPriceJpy: true },
        }),
        prisma.card.findMany({
          where: { rarity: "SEC", isParallel: false, latestPriceJpy: { not: null, gt: 0 } },
          select: { cardCode: true, nameEn: true, nameJp: true, latestPriceJpy: true },
        }),
        prisma.card.findMany({
          where: { rarity: "P-SEC", isParallel: true, baseCode: { not: null }, latestPriceJpy: { not: null, gt: 0 } },
          select: { cardCode: true, baseCode: true, parallelIndex: true, latestPriceJpy: true },
        }),
        prisma.cardPrice.findFirst({ orderBy: { scrapedAt: "desc" }, select: { scrapedAt: true } }),
      ]);

      const grouped: Record<string, number[]> = {};
      for (const row of priced) {
        if (row.latestPriceJpy == null) continue;
        (grouped[row.rarity] ??= []).push(row.latestPriceJpy);
      }

      const tiers: Record<string, TierPriceStats | null> = { ...emptyTiers };
      for (const code of RARITY_TIER_CODES) {
        const values = grouped[code];
        if (!values || values.length === 0) continue;
        values.sort((a, b) => a - b);
        const min = values[0]!;
        const max = values[values.length - 1]!;
        tiers[code] = {
          count: values.length,
          minThb: Math.round(jpyToThb(min)),
          maxThb: Math.round(jpyToThb(max)),
        };
      }

      // Find the real same-card SEC -> Parallel -> Super Parallel triple with
      // the largest gap (most illustrative of what "Parallel art" buys you) —
      // `baseCode` links a Parallel row back to its standard printing, and
      // `parallelIndex` orders multiple Parallel versions of the same card.
      const secByCode = new Map<string, RaritySecCard>(secCards.map((c) => [c.cardCode, c]));
      const parallelsByBase = new Map<string, RarityParallelCard[]>();
      for (const p of pSecCards) {
        if (!p.baseCode) continue;
        const list = parallelsByBase.get(p.baseCode) ?? [];
        list.push(p);
        parallelsByBase.set(p.baseCode, list);
      }

      let triple: ParallelTriple = null;
      let bestSuperJpy = -1;
      for (const [baseCode, group] of parallelsByBase) {
        const base = secByCode.get(baseCode);
        if (!base || base.latestPriceJpy == null || group.length < 2) continue;
        const sorted = [...group].sort((a, b) => (a.parallelIndex ?? 0) - (b.parallelIndex ?? 0));
        const parallelCard = sorted[0]!;
        const superCard = sorted[sorted.length - 1]!;
        if (parallelCard.cardCode === superCard.cardCode) continue;
        if (parallelCard.latestPriceJpy == null || superCard.latestPriceJpy == null) continue;
        if (superCard.latestPriceJpy <= bestSuperJpy) continue;
        bestSuperJpy = superCard.latestPriceJpy;
        triple = {
          name: base.nameEn ?? base.nameJp,
          base: { code: base.cardCode, thb: Math.round(jpyToThb(base.latestPriceJpy)) },
          parallel: { code: parallelCard.cardCode, thb: Math.round(jpyToThb(parallelCard.latestPriceJpy)) },
          superParallel: { code: superCard.cardCode, thb: Math.round(jpyToThb(superCard.latestPriceJpy)) },
        };
      }

      return {
        tiers,
        triple,
        snapshotAt: latestPrice?.scrapedAt ? latestPrice.scrapedAt.toISOString() : null,
      };
    } catch {
      return { tiers: emptyTiers, triple: null, snapshotAt: null };
    }
  },
  ["guide-rarity-price-stats"],
  { revalidate: 3600, tags: ["guide-cards"] }
);

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function RaritiesPage() {
  const lang = await getServerLanguage();
  const [{ byRarity, parallels }, { tiers: priceStats, triple, snapshotAt }] = await Promise.all([
    getExampleCards(),
    getRarityPriceStats(),
  ]);
  const rarityTiers = buildRarityTiers(lang);
  const prominent = rarityTiers.filter((r) => r.prominent);
  const regular = rarityTiers.filter((r) => !r.prominent);

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t(lang, "home"), href: "/" },
          { name: t(lang, "guideBreadcrumbGuide"), href: "/guide" },
          { name: t(lang, "guideRarityBreadcrumb"), href: "/guide/rarities" },
        ])}
      />

      {/* ── 1. Hero + Intro ── */}
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t(lang, "home"), href: "/" },
              { label: t(lang, "guideBreadcrumbGuide"), href: "/guide" },
              { label: t(lang, "guideRarityBreadcrumb") },
            ]}
            hideMobileBack
          />
        }
        back={{ href: "/guide", label: t(lang, "guideBreadcrumbGuide") }}
        title={guideRarityH1(lang)}
        description={
          <>
            {t(lang, "guideRarityIntroA")}
            <strong className="text-foreground">Common</strong>
            {t(lang, "guideRarityIntroB")}{" "}
            <strong className="text-foreground">Treasure Rare</strong>
            {t(lang, "guideRarityIntroC")}
          </>
        }
      />

      {/* ── 2. Rarity Tiers ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-h2">{t(lang, "guideRarityTiersHeading")}</h2>
          <p className="text-sm text-muted-foreground">
            {t(lang, "guideRarityTiersIntro")}
          </p>
          {formatSnapshotDate(lang, snapshotAt) && (
            <p className="mt-1 text-meta">{formatSnapshotDate(lang, snapshotAt)}</p>
          )}
        </div>

        {/* Prominent tiers: TR, SP, SEC */}
        <div className="space-y-3">
          {prominent.map((rarity) => {
            const examples = byRarity[rarity.code] ?? [];
            const stats = priceStats[rarity.code] ?? null;
            return (
              <div
                key={rarity.code}
                id={rarityAnchorId(rarity.code)}
                className="scroll-mt-24 overflow-hidden rounded-2xl border bg-card"
                style={{ borderColor: `${rarity.color}30` }}
              >
                <div className="flex items-start gap-4 p-5">
                  <div
                    className="flex size-14 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white"
                    style={{ backgroundColor: rarity.color }}
                  >
                    {rarity.code}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h3 className="text-h4">{rarity.name}</h3>
                      <span className="text-meta">{rarity.perSet}</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {rarity.description}
                    </p>
                    <p className="mt-2 text-sm">
                      <span className="text-muted-foreground">{t(lang, "guideRarityMarketPriceLabel")}</span>
                      <span className="font-mono font-semibold" style={{ color: rarity.color }}>
                        {formatTierPriceLabel(lang, stats)}
                      </span>
                    </p>
                    {stats && (
                      <p className="mt-0.5 text-meta">
                        {t(lang, "guideRarityPriceCountLabel").replace("{n}", stats.count.toLocaleString())}
                      </p>
                    )}
                  </div>
                </div>
                {examples.length > 0 && (
                  <div className="border-t px-5 py-3" style={{ borderColor: `${rarity.color}15` }}>
                    <p className="mb-2 text-eyebrow">{t(lang, "guideRarityExampleCards")}</p>
                    <CardThumbStrip
                      size="md"
                      cards={examples.map((card) => ({
                        cardCode: card.cardCode,
                        name: card.nameEn ?? card.nameJp,
                        imageUrl: card.imageUrl,
                      }))}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Regular tiers */}
        <div className="grid gap-2 sm:grid-cols-2">
          {regular.map((rarity) => {
            const stats = priceStats[rarity.code] ?? null;
            return (
              <Surface
                key={rarity.code}
                id={rarityAnchorId(rarity.code)}
                variant="outline"
                className="flex scroll-mt-24 items-start gap-3 p-4"
              >
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: rarity.color }}
                >
                  {rarity.code}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-h4">{rarity.name}</h3>
                    <span className="text-meta">{rarity.perSet}</span>
                  </div>
                  <p className="mt-0.5 text-body-sm leading-relaxed text-muted-foreground">
                    {rarity.description}
                  </p>
                  <p className="mt-1 font-mono text-xs font-medium" style={{ color: rarity.color }}>
                    {formatTierPriceLabel(lang, stats)}
                  </p>
                  {stats && (
                    <p className="mt-0.5 text-meta">
                      {t(lang, "guideRarityPriceCountLabel").replace("{n}", stats.count.toLocaleString())}
                    </p>
                  )}
                </div>
              </Surface>
            );
          })}
        </div>
      </section>

      {/* ── 3. Parallel Art ── */}
      <section className="space-y-4">
        <h2 className="text-h2">{t(lang, "guideRarityParallelHeading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t(lang, "guideRarityParallelP1a")}{" "}
          <strong className="text-foreground">Parallel</strong>
          {t(lang, "guideRarityParallelP1b")}{" "}
          <strong className="text-foreground">{t(lang, "guideRarityParallelP1Strong")}</strong>
          {t(lang, "guideRarityParallelP1c")}
        </p>

        {/* Price comparison example — a real same-card SEC/Parallel/Super
            Parallel triple (see getRarityPriceStats), not hand-typed numbers.
            Each box links to the actual card page. */}
        {(() => {
          const comparison = buildParallelComparison(lang, triple);
          if (!comparison) {
            return (
              <Surface variant="outline" className="p-4 text-center text-sm text-muted-foreground">
                {t(lang, "guideRarityCompareNoData")}
              </Surface>
            );
          }
          return (
            <Surface variant="outline" className="overflow-hidden">
              <div className="border-b border-hair px-4 py-2 text-eyebrow">
                {t(lang, "guideRarityCompareTitle")}
              </div>
              <div className="grid grid-cols-1 divide-y divide-hair sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {comparison.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block p-4 text-center motion-base hover:bg-muted/50"
                  >
                    <p className="text-eyebrow">{item.label}</p>
                    <p className="mt-1 font-mono text-lg font-bold" style={{ color: item.color }}>
                      {item.priceThb.toLocaleString("en-US")} ฿
                    </p>
                    <p className="mt-0.5 text-meta">{item.sub}</p>
                  </Link>
                ))}
              </div>
              {triple && (
                <p className="border-t border-hair px-4 py-2 text-meta">
                  {t(lang, "guideRarityCompareRealExample")
                    .replace("{name}", triple.name)
                    .replace("{code}", triple.base.code)}
                  {formatSnapshotDate(lang, snapshotAt) ? ` · ${formatSnapshotDate(lang, snapshotAt)}` : ""}
                </p>
              )}
            </Surface>
          );
        })()}

        {/* Parallel tiers list */}
        <div className="flex flex-wrap gap-2">
          {buildParallelTiers(lang).map((p) => (
            <div
              key={p.code}
              className="flex items-center gap-2 rounded-lg border border-transparent dark:border-hair bg-muted px-3 py-1.5"
            >
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-xs font-semibold">{p.code}</span>
              <span className="text-meta">{p.name}</span>
            </div>
          ))}
        </div>

        {/* Parallel example cards */}
        {parallels.length > 0 && (
          <div>
            <p className="mb-2 text-eyebrow">{t(lang, "guideRarityParallelExamples")}</p>
            <CardThumbStrip
              size="lg"
              showCaption
              scroll
              cards={parallels.map((card) => ({
                cardCode: card.cardCode,
                name: card.nameEn ?? card.nameJp,
                imageUrl: card.imageUrl,
              }))}
            />
          </div>
        )}
      </section>

      {/* ── 4. SP Reprint ── */}
      <section className="space-y-4">
        <h2 className="text-h2">{t(lang, "guideRaritySpReprintHeading")}</h2>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">SP (Special)</strong>
            {t(lang, "guideRaritySpReprintP1a")}{" "}
            <strong className="text-foreground">{t(lang, "guideRaritySpReprintP1Strong")}</strong>
            {t(lang, "guideRaritySpReprintP1b")}
          </p>
          <p>
            {t(lang, "guideRaritySpReprintP2a")}{" "}
            <strong className="text-foreground">{t(lang, "guideRaritySpReprintP2Strong")}</strong>
            {t(lang, "guideRaritySpReprintP2b")}
          </p>
        </div>

        <GuideCallout tone="pink">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{t(lang, "guideRaritySpReprintCardCodeLabel")}</strong>{" "}
            {t(lang, "guideRaritySpReprintCardCodeBody")}
          </p>
        </GuideCallout>
      </section>

      {/* ── 5. Box Pattern ── */}
      <section className="space-y-6">
        <div>
          <h2 className="text-h2">{guideRarityBoxHeading(lang)}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(lang, "guideRarityBoxIntro")}
          </p>
        </div>

        {/* ทุกกล่องได้ */}
        <Surface variant="outline" className="p-5">
          <p className="text-sm font-semibold">{t(lang, "guideRarityBoxEveryHeading")}</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10">
                <span className="text-xs font-bold text-purple-500">SR</span>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{t(lang, "guideRarityBoxSr")}</strong>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10">
                <span className="text-xs font-bold text-blue-500">R</span>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{t(lang, "guideRarityBoxR")}</strong>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-orange-500/10">
                <span className="text-xs font-bold text-orange-500">L</span>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{t(lang, "guideRarityBoxL")}</strong>
              </p>
            </div>
          </div>
        </Surface>

        {/* อธิบาย SEC vs Parallel */}
        <div className="rounded-xl border border-transparent dark:border-hair bg-muted/20 p-5 text-sm leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">{t(lang, "guideRarityBoxSecVsParallelHeading")}</p>
          <p className="mt-2">
            {t(lang, "guideRarityBoxSecVsParallelP1a")}{" "}
            <strong className="text-foreground">SEC</strong> (Secret Rare){" "}
            {t(lang, "guideRarityBoxSecVsParallelP1Or")}{" "}
            <strong className="text-foreground">Parallel</strong> ({t(lang, "guideRarityBoxSecVsParallelP1ParallelNote")}){" "}
            {t(lang, "guideRarityBoxSecVsParallelP1b")}<strong className="text-foreground">{t(lang, "guideRarityBoxSecVsParallelP1Strong")}</strong>
          </p>
          <p className="mt-3">
            {t(lang, "guideRarityBoxSecVsParallelP2")}
          </p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-sm bg-amber-500 text-xs font-bold text-white">1</span>
              <span>{t(lang, "guideRarityBox3Box1a")}<strong className="text-foreground">SEC</strong>{t(lang, "guideRarityBox3Box1b")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-sm bg-purple-500 text-xs font-bold text-white">2</span>
              <span>{t(lang, "guideRarityBox3Box2a")}<strong className="text-foreground">Parallel</strong>{t(lang, "guideRarityBox3Box2b")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-sm bg-blue-500 text-xs font-bold text-white">3</span>
              <span>{t(lang, "guideRarityBox3Box3a")}<strong className="text-foreground">Parallel</strong>{t(lang, "guideRarityBox3Box3b")}</span>
            </div>
          </div>
        </div>

        {/* 3 รูปแบบ */}
        <div>
          <p className="text-sm font-medium">{t(lang, "guideRarityOddsHeading")}</p>
          <p className="mt-0.5 text-meta">
            {t(lang, "guideRarityOddsNote")}
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-4 rounded-xl border border-purple-500/25 bg-purple-500/[0.03] px-5 py-4">
            <p className="w-14 shrink-0 text-2xl font-bold tabular-nums text-purple-600 dark:text-purple-400">42%</p>
            <div>
              <p className="text-sm font-semibold">{t(lang, "guideRarityOddsParallel1Title")}</p>
              <p className="text-meta">{t(lang, "guideRarityOddsParallel1Desc")}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.03] px-5 py-4">
            <p className="w-14 shrink-0 text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">33%</p>
            <div>
              <p className="text-sm font-semibold">{t(lang, "guideRarityOddsSecTitle")}</p>
              <p className="text-meta">{t(lang, "guideRarityOddsSecDesc")}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-blue-500/25 bg-blue-500/[0.03] px-5 py-4">
            <p className="w-14 shrink-0 text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400">25%</p>
            <div>
              <p className="text-sm font-semibold">{t(lang, "guideRarityOddsParallel2Title")}</p>
              <p className="text-meta">{t(lang, "guideRarityOddsParallel2Desc")}</p>
            </div>
          </div>
        </div>

        {/* SP */}
        <GuideCallout tone="pink">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{t(lang, "guideRarityBoxSpLabel")}</strong>{" "}
            {t(lang, "guideRarityBoxSpBodyA")}{" "}
            <Link href="/opcg/drop-calculator" className="font-medium text-primary hover:underline">
              Drop Calculator
            </Link>
            {t(lang, "guideRarityBoxSpBodyB")}
          </p>
        </GuideCallout>
      </section>

      {/* ── 6. Price Factors ── */}
      <section className="space-y-4">
        <h2 className="text-h2">{guideRarityFactorsHeading(lang)}</h2>
        <p className="text-sm text-muted-foreground">
          {t(lang, "guideRarityFactorsIntro")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {buildPriceFactors(lang).map((factor) => (
            <Surface key={factor.title} variant="outline" className="p-4">
              <div className={`flex size-9 items-center justify-center rounded-lg ${factor.iconBg}`}>
                <factor.icon className={`size-4.5 ${factor.iconColor}`} />
              </div>
              <h3 className="mt-3 text-sm font-semibold">{factor.title}</h3>
              <p className="mt-1 text-body-sm leading-relaxed text-muted-foreground">
                {factor.desc}
              </p>
            </Surface>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {t(lang, "guideRarityFactorsMostExpP1a")}{" "}
          <Link href="/opcg/most-expensive" className="font-medium text-primary hover:underline">
            {t(lang, "guideRarityFactorsMostExpLink")}
          </Link>
        </p>
      </section>

      {/* ── 7. FAQ — owns "SEC คือ" / "Parallel คือ" (+ FAQPage JSON-LD) ── */}
      <FaqSection title={guideFaqHeading(lang)} items={guideRarityFaq(lang)} />

      {/* ── 8. Sources ── */}
      <GuideSourceList heading={t(lang, "guideRaritySourcesHeading")} sources={buildSources(lang)} />

      {/* ── Navigation ── */}
      <GuidePrevNext
        prev={{ href: "/guide/card-types", label: t(lang, "guideRarityNavPrev") }}
        next={{ href: "/guide/colors", label: t(lang, "guideRarityNavNext") }}
      />
    </div>
  );
}
