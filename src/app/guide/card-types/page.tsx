import Link from "next/link";
import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  Crown,
  Hash,
  Heart,
  Map,
  Shield,
  Sparkles,
  Swords,
  Users,
  Zap,
} from "lucide-react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { t, type Language } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";
import {
  GUIDE_META,
  guideTypeH1,
  guideTypeKeywordGlossary,
  guideTypeKeywordsHeading,
  guideTypeKeywordsIntro,
} from "@/lib/seo/copy/guide";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { Surface } from "@/components/ui/surface";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PageHeader } from "@/components/layout/page-header";
import { CardThumbStrip } from "@/components/guide/card-thumb-strip";
import { GuideCallout } from "@/components/guide/guide-callout";
import { GuideSourceList } from "@/components/guide/guide-source-list";
import { GuidePrevNext } from "@/components/guide/guide-prev-next";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: GUIDE_META.cardTypes.title,
  description: GUIDE_META.cardTypes.description,
  canonical: "/guide/card-types",
  ogType: "article",
});

/* ------------------------------------------------------------------ */
/*  Card type data                                                     */
/* ------------------------------------------------------------------ */

interface CardTypeInfo {
  name: string;
  nameJp: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  stats: string[];
  role: string;
  rules: string[];
  featured?: boolean;
}

function buildCardTypes(lang: Language): CardTypeInfo[] {
  return [
    {
      name: "Leader",
      nameJp: "リーダー",
      icon: Crown,
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-500",
      borderColor: "border-orange-500/20",
      stats: [t(lang, "guideTypeStatLife45"), "Power 5000", "Color", "Effect"],
      role: t(lang, "guideTypeLeaderRole"),
      rules: [
        t(lang, "guideTypeLeaderRule1"),
        t(lang, "guideTypeLeaderRule2"),
        t(lang, "guideTypeLeaderRule3"),
      ],
      featured: true,
    },
    {
      name: "Character",
      nameJp: "キャラクター",
      icon: Swords,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
      borderColor: "border-blue-500/20",
      stats: ["Cost", "Power", "Counter", "Effect", "Trigger"],
      role: t(lang, "guideTypeCharacterRole"),
      rules: [
        t(lang, "guideTypeCharacterRule1"),
        t(lang, "guideTypeCharacterRule2"),
        t(lang, "guideTypeCharacterRule3"),
        t(lang, "guideTypeCharacterRule4"),
      ],
    },
    {
      name: "Event",
      nameJp: "イベント",
      icon: Sparkles,
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-500",
      borderColor: "border-purple-500/20",
      stats: ["Cost", "Effect", "Trigger"],
      role: t(lang, "guideTypeEventRole"),
      rules: [
        t(lang, "guideTypeEventRule1"),
        t(lang, "guideTypeEventRule2"),
        t(lang, "guideTypeEventRule3"),
      ],
    },
    {
      name: "Stage",
      nameJp: "ステージ",
      icon: Map,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-500",
      borderColor: "border-amber-500/20",
      stats: ["Cost", "Effect"],
      role: t(lang, "guideTypeStageRole"),
      rules: [
        t(lang, "guideTypeStageRule1"),
        t(lang, "guideTypeStageRule2"),
        t(lang, "guideTypeStageRule3"),
      ],
    },
    {
      name: "DON!!",
      nameJp: "ドン!!カード",
      icon: Zap,
      iconBg: "bg-rose-500/10",
      iconColor: "text-rose-500",
      borderColor: "border-rose-500/20",
      stats: ["+1000 Power", t(lang, "guideTypeStatDonMax10")],
      role: t(lang, "guideTypeDonRole"),
      rules: [
        t(lang, "guideTypeDonRule1"),
        t(lang, "guideTypeDonRule2"),
        t(lang, "guideTypeDonRule3"),
        t(lang, "guideTypeDonRule4"),
      ],
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Stats data                                                         */
/* ------------------------------------------------------------------ */

function buildStats(lang: Language) {
  return [
    { name: "Cost", desc: t(lang, "guideTypeStatCostDesc"), types: "Character, Event, Stage", icon: Zap },
    { name: "Power", desc: t(lang, "guideTypeStatPowerDesc"), types: "Leader, Character", icon: Swords },
    { name: "Counter", desc: t(lang, "guideTypeStatCounterDesc"), types: t(lang, "guideTypeStatCounterTypes"), icon: Shield },
    { name: "Life", desc: t(lang, "guideTypeStatLifeDesc"), types: "Leader", icon: Heart },
    { name: "Color", desc: t(lang, "guideTypeStatColorDesc"), types: t(lang, "guideTypeStatColorTypes"), icon: Hash },
    { name: "Attribute", desc: t(lang, "guideTypeStatAttributeDesc"), types: "Character", icon: Swords },
    { name: "Trait", desc: t(lang, "guideTypeStatTraitDesc"), types: "Leader, Character", icon: Users },
    { name: "Effect", desc: t(lang, "guideTypeStatEffectDesc"), types: t(lang, "guideTypeStatEffectTypes"), icon: Sparkles },
    { name: "Trigger", desc: t(lang, "guideTypeStatTriggerDesc"), types: "Character, Event, Stage", icon: Zap },
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

const CARD_TYPE_DB_MAP: Record<string, "LEADER" | "CHARACTER" | "EVENT" | "STAGE" | "DON"> = {
  Leader: "LEADER",
  Character: "CHARACTER",
  Event: "EVENT",
  Stage: "STAGE",
  "DON!!": "DON",
};

/**
 * Four example thumbnails per card type. One bounded query per type instead of
 * scanning the whole card table, and cached for an hour — these are
 * illustrative images, not live data.
 */
const getExampleCardsByType = unstable_cache(
  async (): Promise<Record<string, ExampleCard[]>> => {
    try {
      const types = Object.values(CARD_TYPE_DB_MAP);
      const results = await Promise.all(
        types.map((cardType) =>
          prisma.card.findMany({
            where: { imageUrl: { not: null }, isParallel: false, cardType },
            select: {
              cardCode: true,
              nameEn: true,
              nameJp: true,
              imageUrl: true,
            },
            orderBy: { cardCode: "asc" },
            take: 4,
          })
        )
      );

      const byType: Record<string, ExampleCard[]> = {};
      types.forEach((cardType, i) => {
        byType[cardType] = results[i] ?? [];
      });
      return byType;
    } catch {
      return {};
    }
  },
  ["guide-card-type-examples"],
  { revalidate: 3600, tags: ["guide-cards"] }
);

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function CardTypesPage() {
  const lang = await getServerLanguage();
  const cardExamples = await getExampleCardsByType();
  const cardTypes = buildCardTypes(lang);
  const stats = buildStats(lang);
  const keywords = guideTypeKeywordGlossary(lang);
  const featured = cardTypes[0]; // Leader
  const rest = cardTypes.slice(1);

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t(lang, "home"), href: "/" },
          { name: t(lang, "guideBreadcrumbGuide"), href: "/guide" },
          { name: t(lang, "guideTypeBreadcrumb"), href: "/guide/card-types" },
        ])}
      />

      {/* ── 1. Hero + Intro ── */}
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t(lang, "home"), href: "/" },
              { label: t(lang, "guideBreadcrumbGuide"), href: "/guide" },
              { label: t(lang, "guideTypeBreadcrumb") },
            ]}
            hideMobileBack
          />
        }
        back={{ href: "/guide", label: t(lang, "guideBreadcrumbGuide") }}
        title={guideTypeH1(lang)}
        description={
          <>
            {t(lang, "guideTypeIntroP1a")}
            <strong className="text-foreground">{t(lang, "guideTypeIntroP1Strong")}</strong>
            {t(lang, "guideTypeIntroP1b")}
          </>
        }
      />

      {/* ── 2. Card Types ── */}
      <section className="space-y-4">
        {/* Featured: Leader */}
        {(() => {
          const dbKey = CARD_TYPE_DB_MAP[featured.name];
          const examples = dbKey ? cardExamples[dbKey] ?? [] : [];
          return (
            <Surface variant="outline" className="overflow-hidden rounded-2xl">
              <div className="flex items-start gap-4 p-6">
                <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${featured.iconBg}`}>
                  <featured.icon className={`size-6 ${featured.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-xl font-semibold">{featured.name}</h2>
                    <span className="text-sm text-muted-foreground">{featured.nameJp}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {featured.stats.map((s) => (
                      <span key={s} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{featured.role}</p>
                  <ul className="mt-3 space-y-1.5">
                    {featured.rules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange-500" />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {examples.length > 0 && (
                <div className="border-t border-orange-500/10 px-6 py-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">{t(lang, "guideTypeExamplesLeader")}</p>
                  <CardThumbStrip
                    cards={examples.map((card) => ({
                      cardCode: card.cardCode,
                      name: card.nameEn ?? card.nameJp,
                      imageUrl: card.imageUrl,
                    }))}
                    size="md"
                  />
                </div>
              )}
            </Surface>
          );
        })()}

        {/* Rest: 2x2 grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {rest.map((type) => {
            const dbKey = CARD_TYPE_DB_MAP[type.name];
            const examples = dbKey ? cardExamples[dbKey] ?? [] : [];
            return (
              <Surface key={type.name} variant="outline" className="overflow-hidden rounded-2xl">
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${type.iconBg}`}>
                      <type.icon className={`size-5 ${type.iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <h2 className="text-xl font-semibold">{type.name}</h2>
                        <span className="text-meta">{type.nameJp}</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {type.stats.map((s) => (
                          <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-body-sm leading-relaxed text-muted-foreground">{type.role}</p>
                  <ul className="mt-2.5 space-y-1">
                    {type.rules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-meta">
                        <span className={`mt-1.5 size-1 shrink-0 rounded-full ${type.iconColor.replace("text-", "bg-")}`} />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
                {examples.length > 0 && (
                  <div className={`border-t px-5 py-3 ${type.borderColor}`}>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">{t(lang, "guideTypeExamples")}</p>
                    <CardThumbStrip
                      cards={examples.map((card) => ({
                        cardCode: card.cardCode,
                        name: card.nameEn ?? card.nameJp,
                        imageUrl: card.imageUrl,
                      }))}
                      size="sm"
                    />
                  </div>
                )}
              </Surface>
            );
          })}
        </div>
      </section>

      {/* ── 3. Card Anatomy Diagram ── */}
      <section className="space-y-4">
        <h2 className="text-h2">{t(lang, "guideTypeAnatomyHeading")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(lang, "guideTypeAnatomyDesc")}
        </p>
        <Surface variant="outline" className="overflow-hidden">
          <div className="border-b border-hair px-4 py-2 text-eyebrow">
            {t(lang, "guideTypeAnatomyCaption")}
          </div>
          <div className="relative mx-auto max-w-[280px] p-6">
            {/* Card frame */}
            <div className="aspect-[63/88] w-full rounded-xl border-2 border-border bg-muted/20 p-3">
              {/* Top row: Cost, Power, Attribute */}
              <div className="flex items-start justify-between">
                <div className="flex size-8 items-center justify-center rounded-lg border border-dashed border-blue-500/40 bg-blue-500/10 text-xs font-bold text-blue-500">
                  Cost
                </div>
                <div className="flex h-8 items-center justify-center rounded-lg border border-dashed border-rose-500/40 bg-rose-500/10 px-2 text-xs font-bold text-rose-500">
                  Power
                </div>
                <div className="flex size-8 items-center justify-center rounded-lg border border-dashed border-amber-500/40 bg-amber-500/10 text-overlay text-amber-500">
                  Attr
                </div>
              </div>

              {/* Art area */}
              <div className="mt-2 flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                <span className="text-meta text-muted-foreground/50">Art</span>
              </div>

              {/* Type + Name + Trait */}
              <div className="mt-2 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="rounded-sm border border-dashed border-purple-500/40 bg-purple-500/10 px-1.5 py-0.5 text-overlay text-purple-500">
                    Type
                  </span>
                  <span className="rounded-sm border border-dashed border-primary/30 bg-primary/5 px-1.5 py-0.5 text-overlay text-primary">
                    Color
                  </span>
                </div>
                <div className="rounded-sm border border-dashed border-foreground/20 bg-foreground/5 px-1.5 py-0.5 text-xs font-semibold text-foreground/70">
                  Name
                </div>
                <div className="rounded-sm border border-dashed border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-overlay text-emerald-500">
                  {t(lang, "guideTypeAnatomyTrait")}
                </div>
              </div>

              {/* Bottom row: Effect area + Rarity/Block */}
              <div className="mt-1.5 flex items-end justify-between">
                <div className="flex-1 rounded-sm border border-dashed border-orange-500/40 bg-orange-500/5 px-1.5 py-1 text-overlay leading-tight text-orange-500">
                  Effect / Trigger
                </div>
                <div className="ml-1.5 flex items-center gap-1">
                  <span className="rounded-sm border border-dashed border-amber-500/40 bg-amber-500/10 px-1 py-0.5 text-overlay text-amber-500">
                    R
                  </span>
                  <span className="flex size-5 items-center justify-center rounded-sm border border-dashed border-muted-foreground/30 bg-muted/30 text-overlay text-muted-foreground">
                    2
                  </span>
                </div>
              </div>
            </div>

            {/* Labels outside */}
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-meta">
              <span className="rounded-sm bg-muted px-2 py-0.5">{t(lang, "guideTypeAnatomyLegendRarity")}</span>
              <span className="rounded-sm bg-muted px-2 py-0.5">{t(lang, "guideTypeAnatomyLegendBlock")}</span>
              <span className="rounded-sm bg-muted px-2 py-0.5">{t(lang, "guideTypeAnatomyLegendAttr")}</span>
            </div>
          </div>
        </Surface>
      </section>

      {/* ── 4. Stats Reference ── */}
      <section className="space-y-4">
        <h2 className="text-h2">{t(lang, "guideTypeStatsHeading")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(lang, "guideTypeStatsDesc")}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {stats.map((stat) => (
            <Surface key={stat.name} variant="outline" className="flex items-start gap-3 px-4 py-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <stat.icon className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{stat.name}</p>
                <p className="text-body-sm leading-relaxed text-muted-foreground">{stat.desc}</p>
                <p className="mt-0.5 text-meta text-muted-foreground/60">
                  {stat.types}
                </p>
              </div>
            </Surface>
          ))}
        </div>
      </section>

      {/* ── 5. Keyword glossary — Thai players search these terms directly ── */}
      <section className="space-y-4">
        <h2 className="text-h2">{guideTypeKeywordsHeading(lang)}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {guideTypeKeywordsIntro(lang)}
        </p>

        {/* Jump list — each keyword has its own anchor so it can be linked directly. */}
        <nav aria-label={guideTypeKeywordsHeading(lang)} className="flex flex-wrap gap-1.5">
          {keywords.map((kw) => (
            <a
              key={kw.anchor}
              href={`#${kw.anchor}`}
              className={`rounded-md px-2 py-1 text-xs font-bold motion-base hover:opacity-80 ${kw.color}`}
            >
              {kw.keyword}
            </a>
          ))}
        </nav>

        <div className="space-y-3">
          {keywords.map((kw) => (
            <Surface
              key={kw.anchor}
              id={kw.anchor}
              variant="outline"
              className="scroll-mt-24 p-5"
            >
              <h3 className="flex items-center gap-2 text-h4">
                <span className={`rounded-md px-2 py-1 text-xs font-bold ${kw.color}`}>
                  {kw.keyword}
                </span>
              </h3>
              <div className="mt-2 space-y-1.5">
                {kw.body.map((paragraph, i) => (
                  <p key={i} className="text-body-sm leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
            </Surface>
          ))}
        </div>
      </section>

      {/* ── 6. Trigger Callout ── */}
      <GuideCallout tone="amber">
        <div className="text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Trigger:</strong>{" "}
            {t(lang, "guideTypeCalloutTrigger")}
          </p>
          <p className="mt-1.5">
            <strong className="text-foreground">DON!!</strong>{" "}
            {t(lang, "guideTypeCalloutDon")}
          </p>
        </div>
      </GuideCallout>

      {/* ── Closing link → rarities (audit: card-types had no outbound link
          in real prose, only in the footer nav) ── */}
      <p className="text-sm text-muted-foreground">
        {t(lang, "guideTypeClosingP1a")}{" "}
        <Link href="/guide/rarities" className="font-medium text-primary hover:underline">
          {t(lang, "guideTypeClosingLink")}
        </Link>
        {t(lang, "guideTypeClosingP1b")}
      </p>

      {/* ── 7. Sources ── */}
      <GuideSourceList
        heading={t(lang, "guideTypeSourcesHeading")}
        sources={[
          {
            label: "Official Rules",
            desc: t(lang, "guideTypeSourceRulesDesc"),
            url: "https://en.onepiece-cardgame.com/rules/",
          },
          {
            label: "Play Guide",
            desc: t(lang, "guideTypeSourcePlayGuideDesc"),
            url: "https://en.onepiece-cardgame.com/play-guide/",
          },
        ]}
      />

      {/* ── Navigation ── */}
      <GuidePrevNext
        prev={{ href: "/guide/getting-started", label: t(lang, "guideTypeNavPrev") }}
        next={{ href: "/guide/rarities", label: t(lang, "guideTypeNavNext") }}
      />
    </div>
  );
}
