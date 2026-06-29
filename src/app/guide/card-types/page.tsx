import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  Crown,
  ExternalLink,
  Hash,
  Heart,
  Info,
  Map,
  Shield,
  Sparkles,
  Swords,
  Users,
  Zap,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { t, type Language } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";
import { Surface } from "@/components/ui/surface";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ประเภทการ์ด (Card Types) — คู่มือ OPCG",
  description:
    "เรียนรู้การ์ด 5 ประเภทใน One Piece Card Game: Leader, Character, Event, Stage และ DON!! พร้อมค่าสถานะ คีย์เวิร์ดสำคัญ และผังการ์ด อ้างอิงจากกฎ Bandai",
  alternates: { canonical: "/guide/card-types" },
};

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
/*  Keywords data                                                      */
/* ------------------------------------------------------------------ */

function buildKeywords(lang: Language) {
  return [
    { keyword: "[Blocker]", desc: t(lang, "guideTypeKwBlocker"), color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    { keyword: "[Rush]", desc: t(lang, "guideTypeKwRush"), color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
    { keyword: "[Double Attack]", desc: t(lang, "guideTypeKwDoubleAttack"), color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    { keyword: "[Banish]", desc: t(lang, "guideTypeKwBanish"), color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
    { keyword: "[Counter]", desc: t(lang, "guideTypeKwCounter"), color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    { keyword: "[On Play]", desc: t(lang, "guideTypeKwOnPlay"), color: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
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

async function getExampleCardsByType(): Promise<Record<string, ExampleCard[]>> {
  try {
    const cards = await prisma.card.findMany({
      where: { imageUrl: { not: null }, isParallel: false },
      select: {
        cardCode: true,
        nameEn: true,
        nameJp: true,
        imageUrl: true,
        cardType: true,
      },
      orderBy: { cardCode: "asc" },
    });

    const byType: Record<string, ExampleCard[]> = {};
    for (const c of cards) {
      const key = c.cardType;
      if (!byType[key]) byType[key] = [];
      if (byType[key].length < 4) byType[key].push(c);
    }
    return byType;
  } catch {
    return {};
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function CardTypesPage() {
  const lang = await getServerLanguage();
  const cardExamples = await getExampleCardsByType();
  const cardTypes = buildCardTypes(lang);
  const stats = buildStats(lang);
  const keywords = buildKeywords(lang);
  const featured = cardTypes[0]; // Leader
  const rest = cardTypes.slice(1);

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Guide", href: "/guide" },
          { name: "Card Types", href: "/guide/card-types" },
        ])}
      />

      {/* ── 1. Hero + Intro ── */}
      <div className="space-y-3">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Guide", href: "/guide" },
            { label: t(lang, "guideTypeBreadcrumb") },
          ]}
        />
        <h1 className="text-h1">
          {t(lang, "guideTypeTitle")}
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          {t(lang, "guideTypeIntroP1a")}
          <strong className="text-foreground">{t(lang, "guideTypeIntroP1Strong")}</strong>
          {t(lang, "guideTypeIntroP1b")}
        </p>
      </div>

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
                    <div className="flex gap-2">
                      {examples.map((card) => (
                        <Link key={card.cardCode} href={`/cards/${card.cardCode}`} className="group shrink-0">
                          <div className="relative aspect-[63/88] w-12 overflow-hidden rounded-lg bg-muted">
                            {card.imageUrl && (
                              <Image src={card.imageUrl} alt={card.nameEn ?? card.nameJp} fill className="object-contain" sizes="48px" />
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
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
          <div className="border-b border-[var(--p-hair)] px-4 py-2 text-eyebrow">
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
                  <span className="rounded border border-dashed border-purple-500/40 bg-purple-500/10 px-1.5 py-0.5 text-overlay text-purple-500">
                    Type
                  </span>
                  <span className="rounded border border-dashed border-primary/30 bg-primary/5 px-1.5 py-0.5 text-overlay text-primary">
                    Color
                  </span>
                </div>
                <div className="rounded border border-dashed border-foreground/20 bg-foreground/5 px-1.5 py-0.5 text-xs font-semibold text-foreground/70">
                  Name
                </div>
                <div className="rounded border border-dashed border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-overlay text-emerald-500">
                  {t(lang, "guideTypeAnatomyTrait")}
                </div>
              </div>

              {/* Bottom row: Effect area + Rarity/Block */}
              <div className="mt-1.5 flex items-end justify-between">
                <div className="flex-1 rounded border border-dashed border-orange-500/40 bg-orange-500/5 px-1.5 py-1 text-overlay leading-tight text-orange-500">
                  Effect / Trigger
                </div>
                <div className="ml-1.5 flex items-center gap-1">
                  <span className="rounded border border-dashed border-amber-500/40 bg-amber-500/10 px-1 py-0.5 text-overlay text-amber-500">
                    R
                  </span>
                  <span className="flex size-5 items-center justify-center rounded border border-dashed border-muted-foreground/30 bg-muted/30 text-overlay text-muted-foreground">
                    2
                  </span>
                </div>
              </div>
            </div>

            {/* Labels outside */}
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-meta">
              <span className="rounded bg-muted px-2 py-0.5">{t(lang, "guideTypeAnatomyLegendRarity")}</span>
              <span className="rounded bg-muted px-2 py-0.5">{t(lang, "guideTypeAnatomyLegendBlock")}</span>
              <span className="rounded bg-muted px-2 py-0.5">{t(lang, "guideTypeAnatomyLegendAttr")}</span>
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

      {/* ── 5. Common Keywords ── */}
      <section className="space-y-4">
        <h2 className="text-h2">{t(lang, "guideTypeKeywordsHeading")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(lang, "guideTypeKeywordsDesc")}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {keywords.map((kw) => (
            <Surface key={kw.keyword} variant="outline" className="flex items-start gap-3 px-4 py-3">
              <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${kw.color}`}>
                {kw.keyword}
              </span>
              <p className="text-body-sm leading-relaxed text-muted-foreground">
                {kw.desc}
              </p>
            </Surface>
          ))}
        </div>
      </section>

      {/* ── 6. Trigger Callout ── */}
      <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <Info className="mt-0.5 size-4 shrink-0 text-amber-500" />
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
      </div>

      {/* ── 7. Sources ── */}
      <section className="space-y-3">
        <h2 className="text-h2">{t(lang, "guideTypeSourcesHeading")}</h2>
        <Surface variant="outline" className="divide-y divide-[var(--p-hair)] text-sm">
          {[
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
          ].map((src) => (
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
          href="/guide/getting-started"
          className="group inline-flex items-center gap-2 text-sm text-muted-foreground motion-base hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          {t(lang, "guideTypeNavPrev")}
        </Link>
        <Link
          href="/guide/rarities"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          {t(lang, "guideTypeNavNext")}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
