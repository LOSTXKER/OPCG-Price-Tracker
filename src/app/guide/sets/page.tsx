import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Box, Layers, Package, Star, Trophy } from "lucide-react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { Surface } from "@/components/ui/surface";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PageHeader } from "@/components/layout/page-header";
import { GuideSourceList } from "@/components/guide/guide-source-list";
import { GuideCallout } from "@/components/guide/guide-callout";
import { GuidePrevNext } from "@/components/guide/guide-prev-next";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/json-ld";
import { t, getSetName, type Language } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";
import {
  GUIDE_META,
  guideSetH1,
  guideSetLatestHeading,
  guideSetLatestIntro,
  guideSetLead,
  guideSetListHeading,
  guideSetListIntro,
  guideSetReleaseLabel,
  guideSetSeeAll,
} from "@/lib/seo/copy/guide";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: GUIDE_META.sets.title,
  description: GUIDE_META.sets.description,
  canonical: "/guide/sets",
  ogType: "article",
});

/* ------------------------------------------------------------------ */
/*  Set type config                                                    */
/* ------------------------------------------------------------------ */

function buildSetTypeInfo(
  lang: Language
): Record<
  string,
  { label: string; icon: typeof Layers; description: string }
> {
  return {
    BOOSTER: {
      label: t(lang, "guideSetTypeBoosterLabel"),
      icon: Package,
      description: t(lang, "guideSetTypeBoosterDesc"),
    },
    STARTER: {
      label: t(lang, "guideSetTypeStarterLabel"),
      icon: Star,
      description: t(lang, "guideSetTypeStarterDesc"),
    },
    EXTRA_BOOSTER: {
      label: t(lang, "guideSetTypeExtraLabel"),
      icon: Trophy,
      description: t(lang, "guideSetTypeExtraDesc"),
    },
    PROMO: {
      label: t(lang, "guideSetTypePromoLabel"),
      icon: Layers,
      description: t(lang, "guideSetTypePromoDesc"),
    },
    OTHER: {
      label: t(lang, "guideSetTypeOtherLabel"),
      icon: Box,
      description: t(lang, "guideSetTypeOtherDesc"),
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Pack structure + card code config                                  */
/* ------------------------------------------------------------------ */

function buildPackSizes(lang: Language) {
  return [
    {
      label: t(lang, "guideSetPackPackLabel"),
      value: t(lang, "guideSetPackPackValue"),
    },
    {
      label: t(lang, "guideSetPackBoxLabel"),
      value: t(lang, "guideSetPackBoxValue"),
    },
    {
      label: t(lang, "guideSetPackCaseLabel"),
      value: t(lang, "guideSetPackCaseValue"),
    },
  ];
}

function buildCardCodes(lang: Language) {
  return [
    {
      code: "OP09-001",
      desc: t(lang, "guideSetCodeBoosterDesc"),
    },
    {
      code: "OP09-001_p1",
      desc: t(lang, "guideSetCodeParallelDesc"),
    },
    {
      code: "ST01-001",
      desc: t(lang, "guideSetCodeStarterDesc"),
    },
    {
      code: "EB01-001",
      desc: t(lang, "guideSetCodeExtraDesc"),
    },
  ];
}

function buildSources(lang: Language) {
  return [
    {
      label: t(lang, "guideSetSourceOfficialLabel"),
      desc: t(lang, "guideSetSourceOfficialDesc"),
      url: "https://en.onepiece-cardgame.com/products/",
    },
    {
      label: t(lang, "guideSetSourceMeecardLabel"),
      desc: t(lang, "guideSetSourceMeecardDesc"),
      url: "/opcg/sets",
      internal: true,
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  DB query                                                           */
/* ------------------------------------------------------------------ */

type SetRow = {
  code: string;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  type: string;
  cardCount: number;
  releaseDate: Date | null;
  boxImageUrl: string | null;
};

/** How many recent sets this guide lists before deferring to /opcg/sets. */
const RECENT_SET_LIMIT = 12;

/**
 * Recent sets only. The full 50+ row list used to render here, which made this
 * guide compete with the real set index (`/opcg/sets`) for the same queries —
 * now it highlights what people are actually searching for and links out.
 */
const getSetsData = unstable_cache(
  async (): Promise<{ recent: SetRow[]; total: number }> => {
    try {
      const [recent, total] = await Promise.all([
        prisma.cardSet.findMany({
          select: {
            code: true,
            name: true,
            nameEn: true,
            nameTh: true,
            type: true,
            cardCount: true,
            releaseDate: true,
            boxImageUrl: true,
          },
          orderBy: [{ releaseDate: { sort: "desc", nulls: "last" } }, { code: "desc" }],
          take: RECENT_SET_LIMIT,
        }),
        prisma.cardSet.count(),
      ]);
      return { recent, total };
    } catch {
      return { recent: [], total: 0 };
    }
  },
  ["guide-sets-recent"],
  { revalidate: 3600, tags: ["guide-sets"] }
);

function formatReleaseDate(date: Date | null, lang: Language): string | null {
  if (!date) return null;
  const locale = lang === "TH" ? "th-TH" : lang === "JP" ? "ja-JP" : "en-US";
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function GuideSetsPage() {
  const lang = await getServerLanguage();
  const { recent, total } = await getSetsData();
  const setTypeInfo = buildSetTypeInfo(lang);
  const packSizes = buildPackSizes(lang);
  const cardCodes = buildCardCodes(lang);
  const sources = buildSources(lang);
  const latest = recent.slice(0, 2);

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t(lang, "guideSetBreadcrumbHome"), href: "/" },
          { name: t(lang, "guideSetBreadcrumbGuide"), href: "/guide" },
          { name: t(lang, "guideSetBreadcrumbSets"), href: "/guide/sets" },
        ])}
      />
      {recent.length > 0 && (
        <JsonLd
          data={itemListJsonLd(
            GUIDE_META.sets.title,
            recent.map((set) => ({
              name: `${set.code} ${getSetName(lang, set)}`.trim(),
              url: `/opcg/sets/${set.code}`,
              image: set.boxImageUrl,
            }))
          )}
        />
      )}

      {/* ── 1. Hero + Intro ── */}
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t(lang, "guideSetBreadcrumbHome"), href: "/" },
              { label: t(lang, "guideSetBreadcrumbGuide"), href: "/guide" },
              { label: t(lang, "guideSetBreadcrumbSets") },
            ]}
            hideMobileBack
          />
        }
        back={{ href: "/guide", label: t(lang, "guideSetBreadcrumbGuide") }}
        title={guideSetH1(lang)}
        description={guideSetLead(lang)}
      />

      {/* ── 1b. ชุดล่าสุด — the query that spikes every time a set drops ── */}
      {latest.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-h2">{guideSetLatestHeading(lang)}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {guideSetLatestIntro(lang)}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {latest.map((set) => {
              const released = formatReleaseDate(set.releaseDate, lang);
              return (
                <Link
                  key={set.code}
                  href={`/opcg/sets/${set.code}`}
                  className="group"
                >
                  <Surface
                    variant="panel"
                    className="flex h-full items-center gap-4 p-5 motion-base"
                  >
                    {set.boxImageUrl ? (
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={set.boxImageUrl}
                          alt={set.code}
                          fill
                          className="object-contain"
                          sizes="64px"
                        />
                      </div>
                    ) : (
                      <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                        {set.code}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-eyebrow">{set.code}</p>
                      <h3 className="text-h4 motion-base group-hover:text-primary">
                        {getSetName(lang, set)}
                      </h3>
                      <p className="mt-0.5 text-meta">
                        {released
                          ? `${guideSetReleaseLabel(lang)} ${released} · `
                          : ""}
                        {t(lang, "guideSetCardCount").replace(
                          "{n}",
                          String(set.cardCount)
                        )}
                      </p>
                    </div>
                  </Surface>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 2. Set Types ── */}
      <section className="space-y-4">
        <h2 className="text-h2">{t(lang, "guideSetTypesHeading")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {["BOOSTER", "STARTER", "EXTRA_BOOSTER", "PROMO"].map((type) => {
            const info = setTypeInfo[type];
            if (!info) return null;
            const Icon = info.icon;
            return (
              <Surface
                key={type}
                variant="outline"
                className="p-4"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-4.5 text-muted-foreground" />
                </div>
                <h3 className="mt-3 text-h4">{info.label}</h3>
                <p className="mt-1 text-body-sm leading-relaxed text-muted-foreground">
                  {info.description}
                </p>
              </Surface>
            );
          })}
        </div>
      </section>

      {/* ── 3. Pack Structure ── */}
      <section className="space-y-4">
        <h2 className="text-h2">
          {t(lang, "guideSetPackHeading")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(lang, "guideSetPackIntro")}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {packSizes.map((item) => (
            <Surface
              key={item.label}
              variant="outline"
              className="p-4 text-center"
            >
              <p className="text-xl font-bold text-foreground">
                {item.value}
              </p>
              <p className="mt-1 text-meta">
                {item.label}
              </p>
            </Surface>
          ))}
        </div>
        <GuideCallout tone="blue">
          <p className="text-sm text-muted-foreground">
            {t(lang, "guideSetPackEnNoteA")}
            <strong className="text-foreground">{t(lang, "guideSetPackEnNoteStrong")}</strong>
            {t(lang, "guideSetPackEnNoteB")}
          </p>
        </GuideCallout>
      </section>

      {/* ── 4. Card Code Format ── */}
      <section className="space-y-4">
        <h2 className="text-h2">{t(lang, "guideSetCodeHeading")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(lang, "guideSetCodeIntro")}
        </p>
        <div className="space-y-2">
          {cardCodes.map((item) => (
            <Surface
              key={item.code}
              variant="outline"
              className="flex items-center gap-3 px-4 py-3"
            >
              <code className="shrink-0 rounded-md bg-muted px-2 py-1 font-mono text-sm font-bold text-foreground">
                {item.code}
              </code>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </Surface>
          ))}
        </div>
      </section>

      {/* ── 5. Recent sets (trimmed) — the full index lives at /opcg/sets ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-h2">{guideSetListHeading(lang)}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {guideSetListIntro(lang, { shown: recent.length, total })}
          </p>
        </div>

        {recent.length > 0 ? (
          <>
            <Surface variant="outline" className="divide-y divide-hair">
              {recent.map((set) => {
                const info = setTypeInfo[set.type] ?? setTypeInfo.OTHER!;
                const released = formatReleaseDate(set.releaseDate, lang);
                return (
                  <Link
                    key={set.code}
                    href={`/opcg/sets/${set.code}`}
                    className="flex items-center gap-3 px-4 py-3 motion-base hover:bg-muted/70"
                  >
                    {set.boxImageUrl ? (
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={set.boxImageUrl}
                          alt={set.code}
                          fill
                          className="object-contain"
                          sizes="40px"
                        />
                      </div>
                    ) : (
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                        {set.code.split("-")[0]}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {getSetName(lang, set)}
                      </p>
                      <p className="text-meta">
                        {set.code}
                        {" · "}
                        {info?.label}
                        {released ? ` · ${released}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {t(lang, "guideSetCardCount").replace(
                        "{n}",
                        String(set.cardCount)
                      )}
                    </span>
                  </Link>
                );
              })}
            </Surface>
            <Link
              href="/opcg/sets"
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary motion-base hover:bg-primary/10"
            >
              {guideSetSeeAll(lang, { total })}
            </Link>
          </>
        ) : (
          <div className="rounded-xl border border-dashed py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {t(lang, "guideSetEmpty")}
            </p>
          </div>
        )}
      </section>

      {/* ── 6. Sources ── */}
      <GuideSourceList heading={t(lang, "guideSetSourcesHeading")} sources={sources} />

      {/* ── Navigation ── */}
      <GuidePrevNext
        prev={{ href: "/guide/colors", label: t(lang, "guideSetNavPrev") }}
        next={{ href: "/guide/buying", label: t(lang, "guideSetNavNext") }}
      />
    </div>
  );
}
