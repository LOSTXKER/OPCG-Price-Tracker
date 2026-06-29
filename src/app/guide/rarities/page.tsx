import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ImageIcon,
  Info,
  Package,
  Printer,
  Sparkles,
  Swords,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Surface } from "@/components/ui/surface";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { t, type Language } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ความหายาก (Rarities) — คู่มือ OPCG",
  description:
    "คู่มือระดับความหายากของ One Piece Card Game ครบทุก Rarity: C, UC, R, SR, SEC, SP, TR พร้อม Parallel, Box Pattern, ปัจจัยราคา อ้างอิงจาก Bandai",
  alternates: { canonical: "/guide/rarities" },
};

/* ------------------------------------------------------------------ */
/*  Rarity data                                                        */
/* ------------------------------------------------------------------ */

interface RarityTier {
  code: string;
  name: string;
  color: string;
  perSet: string;
  priceJpy: string;
  description: string;
  prominent?: boolean;
}

function buildRarityTiers(lang: Language): RarityTier[] {
  return [
    {
      code: "TR",
      name: "Treasure Rare",
      color: "#EF4444",
      perSet: t(lang, "guideRarityTrPerSet"),
      priceJpy: "¥100,000-1,000,000+",
      description: t(lang, "guideRarityTrDesc"),
      prominent: true,
    },
    {
      code: "SP",
      name: "Special",
      color: "#EC4899",
      perSet: t(lang, "guideRaritySpPerSet"),
      priceJpy: "¥3,000-600,000+",
      description: t(lang, "guideRaritySpDesc"),
      prominent: true,
    },
    {
      code: "SEC",
      name: "Secret Rare",
      color: "#F59E0B",
      perSet: t(lang, "guideRaritySecPerSet"),
      priceJpy: "¥500-5,000",
      description: t(lang, "guideRaritySecDesc"),
      prominent: true,
    },
    {
      code: "SR",
      name: "Super Rare",
      color: "#8B5CF6",
      perSet: t(lang, "guideRaritySrPerSet"),
      priceJpy: "¥80-2,000",
      description: t(lang, "guideRaritySrDesc"),
    },
    {
      code: "R",
      name: "Rare",
      color: "#3B82F6",
      perSet: t(lang, "guideRarityRPerSet"),
      priceJpy: "¥80-200",
      description: t(lang, "guideRarityRDesc"),
    },
    {
      code: "UC",
      name: "Uncommon",
      color: "#22C55E",
      perSet: t(lang, "guideRarityUcPerSet"),
      priceJpy: "¥80",
      description: t(lang, "guideRarityUcDesc"),
    },
    {
      code: "C",
      name: "Common",
      color: "#6B7280",
      perSet: t(lang, "guideRarityCPerSet"),
      priceJpy: "¥30",
      description: t(lang, "guideRarityCDesc"),
    },
    {
      code: "L",
      name: "Leader",
      color: "#F97316",
      perSet: t(lang, "guideRarityLPerSet"),
      priceJpy: "¥50",
      description: t(lang, "guideRarityLDesc"),
    },
    {
      code: "DON",
      name: "DON!!",
      color: "#EA580C",
      perSet: t(lang, "guideRarityDonPerSet"),
      priceJpy: "¥100-50,000+",
      description: t(lang, "guideRarityDonDesc"),
    },
    {
      code: "P",
      name: "Promo",
      color: "#06B6D4",
      perSet: t(lang, "guideRarityPPerSet"),
      priceJpy: t(lang, "guideRarityPPrice"),
      description: t(lang, "guideRarityPDesc"),
    },
  ];
}

function buildParallelComparison(lang: Language) {
  return [
    { label: t(lang, "guideRarityCompareSecLabel"), price: "¥500", color: "#F59E0B", sub: t(lang, "guideRarityCompareSecSub") },
    { label: t(lang, "guideRarityComparePsecLabel"), price: "¥1,480", color: "#F59E0B", sub: t(lang, "guideRarityComparePsecSub") },
    { label: t(lang, "guideRarityCompareSuperLabel"), price: "¥198,000", color: "#EC4899", sub: t(lang, "guideRarityCompareSuperSub") },
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
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-500",
    },
    {
      icon: Users,
      title: t(lang, "guideRarityFactorPopularTitle"),
      desc: t(lang, "guideRarityFactorPopularDesc"),
      iconBg: "bg-rose-500/10",
      iconColor: "text-rose-500",
    },
    {
      icon: Swords,
      title: t(lang, "guideRarityFactorMetaTitle"),
      desc: t(lang, "guideRarityFactorMetaDesc"),
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
    },
    {
      icon: ImageIcon,
      title: t(lang, "guideRarityFactorArtTitle"),
      desc: t(lang, "guideRarityFactorArtDesc"),
      iconBg: "bg-pink-500/10",
      iconColor: "text-pink-500",
    },
    {
      icon: Package,
      title: t(lang, "guideRarityFactorSupplyTitle"),
      desc: t(lang, "guideRarityFactorSupplyDesc"),
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-500",
    },
    {
      icon: Printer,
      title: t(lang, "guideRarityFactorOopTitle"),
      desc: t(lang, "guideRarityFactorOopDesc"),
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
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
    {
      label: "Yuyu-tei",
      desc: t(lang, "guideRaritySourceYuyuteiDesc"),
      url: "https://yuyu-tei.jp/",
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

async function getExampleCards(): Promise<{
  byRarity: Record<string, ExampleCard[]>;
  parallels: ExampleCard[];
}> {
  try {
    const [cards, parallels] = await Promise.all([
      prisma.card.findMany({
        where: { imageUrl: { not: null }, isParallel: false },
        select: {
          cardCode: true,
          nameEn: true,
          nameJp: true,
          imageUrl: true,
          rarity: true,
        },
        orderBy: { cardCode: "asc" },
      }),
      prisma.card.findMany({
        where: { imageUrl: { not: null }, isParallel: true },
        select: {
          cardCode: true,
          nameEn: true,
          nameJp: true,
          imageUrl: true,
          rarity: true,
        },
        orderBy: { cardCode: "asc" },
        take: 6,
      }),
    ]);

    const byRarity: Record<string, ExampleCard[]> = {};
    for (const c of cards) {
      if (!byRarity[c.rarity]) byRarity[c.rarity] = [];
      if (byRarity[c.rarity].length < 4) {
        byRarity[c.rarity].push(c);
      }
    }

    return { byRarity, parallels };
  } catch {
    return { byRarity: {}, parallels: [] };
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function RaritiesPage() {
  const lang = await getServerLanguage();
  const { byRarity, parallels } = await getExampleCards();
  const rarityTiers = buildRarityTiers(lang);
  const prominent = rarityTiers.filter((r) => r.prominent);
  const regular = rarityTiers.filter((r) => !r.prominent);

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Guide", href: "/guide" },
          { name: "Rarities", href: "/guide/rarities" },
        ])}
      />

      {/* ── 1. Hero + Intro ── */}
      <div className="space-y-3">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Guide", href: "/guide" },
            { label: t(lang, "guideRarityBreadcrumb") },
          ]}
        />
        <h1 className="text-h1">
          {t(lang, "guideRarityTitle")}
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          {t(lang, "guideRarityIntroA")}
          <strong className="text-foreground">Common</strong>
          {t(lang, "guideRarityIntroB")}{" "}
          <strong className="text-foreground">Treasure Rare</strong>
          {t(lang, "guideRarityIntroC")}
        </p>
      </div>

      {/* ── 2. Rarity Tiers ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t(lang, "guideRarityTiersHeading")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(lang, "guideRarityTiersIntro")}
        </p>

        {/* Prominent tiers: TR, SP, SEC */}
        <div className="space-y-3">
          {prominent.map((rarity) => {
            const examples = byRarity[rarity.code] ?? [];
            return (
              <div
                key={rarity.code}
                className="overflow-hidden rounded-2xl border bg-card"
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
                      <h3 className="text-base font-bold">{rarity.name}</h3>
                      <span className="text-meta">{rarity.perSet}</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {rarity.description}
                    </p>
                    <p className="mt-2 text-sm">
                      <span className="text-muted-foreground">{t(lang, "guideRarityMarketPriceLabel")}</span>
                      <span className="font-mono font-semibold" style={{ color: rarity.color }}>
                        {rarity.priceJpy}
                      </span>
                    </p>
                  </div>
                </div>
                {examples.length > 0 && (
                  <div className="border-t px-5 py-3" style={{ borderColor: `${rarity.color}15` }}>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">{t(lang, "guideRarityExampleCards")}</p>
                    <div className="flex gap-2">
                      {examples.map((card) => (
                        <Link key={card.cardCode} href={`/cards/${card.cardCode}`} className="group shrink-0">
                          <div className="relative aspect-[63/88] w-14 overflow-hidden rounded-lg bg-muted">
                            {card.imageUrl && (
                              <Image src={card.imageUrl} alt={card.nameEn ?? card.nameJp} fill className="object-contain" sizes="56px" />
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Regular tiers */}
        <div className="grid gap-2 sm:grid-cols-2">
          {regular.map((rarity) => (
            <Surface
              key={rarity.code}
              variant="outline"
              className="flex items-start gap-3 p-4"
            >
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                style={{ backgroundColor: rarity.color }}
              >
                {rarity.code}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <h3 className="text-sm font-semibold">{rarity.name}</h3>
                  <span className="text-meta">{rarity.perSet}</span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {rarity.description}
                </p>
                <p className="mt-1 font-mono text-xs font-medium" style={{ color: rarity.color }}>
                  {rarity.priceJpy}
                </p>
              </div>
            </Surface>
          ))}
        </div>
      </section>

      {/* ── 3. Parallel Art ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t(lang, "guideRarityParallelHeading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t(lang, "guideRarityParallelP1a")}{" "}
          <strong className="text-foreground">Parallel</strong>
          {t(lang, "guideRarityParallelP1b")}{" "}
          <strong className="text-foreground">{t(lang, "guideRarityParallelP1Strong")}</strong>
          {t(lang, "guideRarityParallelP1c")}
        </p>

        {/* Price comparison example */}
        <Surface variant="outline" className="overflow-hidden">
          <div className="border-b border-[var(--p-hair)] px-4 py-2 text-xs font-medium text-muted-foreground">
            {t(lang, "guideRarityCompareTitle")}
          </div>
          <div className="grid grid-cols-1 divide-y divide-[var(--p-hair)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {buildParallelComparison(lang).map((item) => (
              <div key={item.label} className="p-4 text-center">
                <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-mono text-lg font-bold" style={{ color: item.color }}>
                  {item.price}
                </p>
                <p className="mt-0.5 text-meta">{item.sub}</p>
              </div>
            ))}
          </div>
        </Surface>

        {/* Parallel tiers list */}
        <div className="flex flex-wrap gap-2">
          {buildParallelTiers(lang).map((p) => (
            <div
              key={p.code}
              className="flex items-center gap-2 rounded-lg border border-transparent dark:border-[var(--p-hair)] bg-card px-3 py-1.5"
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
            <p className="mb-2 text-xs font-medium text-muted-foreground">{t(lang, "guideRarityParallelExamples")}</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {parallels.map((card) => (
                <Link key={card.cardCode} href={`/cards/${card.cardCode}`} className="group shrink-0">
                  <div className="relative aspect-[63/88] w-16 overflow-hidden rounded-lg bg-muted">
                    {card.imageUrl && (
                      <Image src={card.imageUrl} alt={card.nameEn ?? card.nameJp} fill className="object-contain" sizes="64px" />
                    )}
                  </div>
                  <p className="mt-1 max-w-16 truncate text-center text-meta">
                    {card.nameEn ?? card.nameJp}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── 4. SP Reprint ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t(lang, "guideRaritySpReprintHeading")}</h2>
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

        <div className="flex items-start gap-2.5 rounded-lg border border-pink-500/20 bg-pink-500/5 px-4 py-3">
          <Info className="mt-0.5 size-4 shrink-0 text-pink-500" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{t(lang, "guideRaritySpReprintCardCodeLabel")}</strong>{" "}
            {t(lang, "guideRaritySpReprintCardCodeBody")}
          </p>
        </div>
      </section>

      {/* ── 5. Box Pattern ── */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">{t(lang, "guideRarityBoxHeading")}</h2>
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
        <div className="rounded-xl border border-transparent dark:border-[var(--p-hair)] bg-muted/20 p-5 text-sm leading-relaxed text-muted-foreground">
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
              <span className="flex size-6 items-center justify-center rounded bg-amber-500 text-xs font-bold text-white">1</span>
              <span>{t(lang, "guideRarityBox3Box1a")}<strong className="text-foreground">SEC</strong>{t(lang, "guideRarityBox3Box1b")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded bg-purple-500 text-xs font-bold text-white">2</span>
              <span>{t(lang, "guideRarityBox3Box2a")}<strong className="text-foreground">Parallel</strong>{t(lang, "guideRarityBox3Box2b")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded bg-blue-500 text-xs font-bold text-white">3</span>
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
        <div className="flex items-start gap-2.5 rounded-lg border border-pink-500/20 bg-pink-500/5 px-4 py-3">
          <Info className="mt-0.5 size-4 shrink-0 text-pink-500" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{t(lang, "guideRarityBoxSpLabel")}</strong>{" "}
            {t(lang, "guideRarityBoxSpBodyA")}{" "}
            <Link href="/drop-calculator" className="font-medium text-primary hover:underline">
              Drop Calculator
            </Link>
            {t(lang, "guideRarityBoxSpBodyB")}
          </p>
        </div>
      </section>

      {/* ── 6. Price Factors ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t(lang, "guideRarityFactorsHeading")}</h2>
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
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {factor.desc}
              </p>
            </Surface>
          ))}
        </div>
      </section>

      {/* ── 7. Sources ── */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t(lang, "guideRaritySourcesHeading")}</h2>
        <Surface variant="outline" className="divide-y divide-[var(--p-hair)] text-sm">
          {buildSources(lang).map((src) => (
            <a
              key={src.url}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 motion-base hover:bg-muted/70"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{src.label}</p>
                <p className="text-meta">{src.desc}</p>
              </div>
              <ExternalLink className="size-4 shrink-0 text-muted-foreground/40" />
            </a>
          ))}
        </Surface>
      </section>

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <Link
          href="/guide/card-types"
          className="group inline-flex items-center gap-2 text-sm text-muted-foreground motion-base hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          {t(lang, "guideRarityNavPrev")}
        </Link>
        <Link
          href="/guide/colors"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          {t(lang, "guideRarityNavNext")}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
