import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Box, Layers, Package, Star, Trophy } from "lucide-react";
import { prisma } from "@/lib/db";
import { Surface } from "@/components/ui/surface";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PageHeader } from "@/components/layout/page-header";
import { GuideSourceList } from "@/components/guide/guide-source-list";
import { GuideCallout } from "@/components/guide/guide-callout";
import { GuidePrevNext } from "@/components/guide/guide-prev-next";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { t, type Language } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ชุดการ์ด (Sets) — คู่มือ OPCG",
  description:
    "คู่มือระบบชุดการ์ด One Piece Card Game: Booster Pack, Starter Deck, Extra Booster, Premium Booster รูปแบบ Card Code และรายชื่อชุดทั้งหมด",
  alternates: { canonical: "/guide/sets" },
};

/* ------------------------------------------------------------------ */
/*  Set type config                                                    */
/* ------------------------------------------------------------------ */

function buildSetTypeInfo(
  lang: Language
): Record<
  string,
  { label: string; icon: typeof Layers; color: string; description: string }
> {
  return {
    BOOSTER: {
      label: t(lang, "guideSetTypeBoosterLabel"),
      icon: Package,
      color: "#3B82F6",
      description: t(lang, "guideSetTypeBoosterDesc"),
    },
    STARTER: {
      label: t(lang, "guideSetTypeStarterLabel"),
      icon: Star,
      color: "#22C55E",
      description: t(lang, "guideSetTypeStarterDesc"),
    },
    EXTRA_BOOSTER: {
      label: t(lang, "guideSetTypeExtraLabel"),
      icon: Trophy,
      color: "#F59E0B",
      description: t(lang, "guideSetTypeExtraDesc"),
    },
    PROMO: {
      label: t(lang, "guideSetTypePromoLabel"),
      icon: Layers,
      color: "#8B5CF6",
      description: t(lang, "guideSetTypePromoDesc"),
    },
    OTHER: {
      label: t(lang, "guideSetTypeOtherLabel"),
      icon: Box,
      color: "#6B7280",
      description: t(lang, "guideSetTypeOtherDesc"),
    },
  };
}

const TYPE_ORDER = ["BOOSTER", "STARTER", "EXTRA_BOOSTER", "PROMO", "OTHER"];

/* ------------------------------------------------------------------ */
/*  Pack structure + card code config                                  */
/* ------------------------------------------------------------------ */

function buildPackSizes(lang: Language) {
  return [
    {
      label: t(lang, "guideSetPackPackLabel"),
      value: t(lang, "guideSetPackPackValue"),
      color: "#3B82F6",
    },
    {
      label: t(lang, "guideSetPackBoxLabel"),
      value: t(lang, "guideSetPackBoxValue"),
      color: "#8B5CF6",
    },
    {
      label: t(lang, "guideSetPackCaseLabel"),
      value: t(lang, "guideSetPackCaseValue"),
      color: "#F59E0B",
    },
  ];
}

function buildCardCodes(lang: Language) {
  return [
    {
      code: "OP09-001",
      desc: t(lang, "guideSetCodeBoosterDesc"),
      color: "#3B82F6",
    },
    {
      code: "OP09-001_p1",
      desc: t(lang, "guideSetCodeParallelDesc"),
      color: "#8B5CF6",
    },
    {
      code: "ST01-001",
      desc: t(lang, "guideSetCodeStarterDesc"),
      color: "#22C55E",
    },
    {
      code: "EB01-001",
      desc: t(lang, "guideSetCodeExtraDesc"),
      color: "#F59E0B",
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
      url: "/sets",
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
  type: string;
  cardCount: number;
  releaseDate: Date | null;
  boxImageUrl: string | null;
};

async function getSetsGrouped(): Promise<Record<string, SetRow[]>> {
  try {
    const sets = await prisma.cardSet.findMany({
      select: {
        code: true,
        name: true,
        nameEn: true,
        type: true,
        cardCount: true,
        releaseDate: true,
        boxImageUrl: true,
      },
      orderBy: { code: "asc" },
    });

    const grouped: Record<string, SetRow[]> = {};
    for (const s of sets) {
      const key = s.type;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(s);
    }
    return grouped;
  } catch {
    return {};
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function GuideSetsPage() {
  const lang = await getServerLanguage();
  const grouped = await getSetsGrouped();
  const setTypeInfo = buildSetTypeInfo(lang);
  const packSizes = buildPackSizes(lang);
  const cardCodes = buildCardCodes(lang);
  const sources = buildSources(lang);

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Guide", href: "/guide" },
          { name: "Sets", href: "/guide/sets" },
        ])}
      />

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
        back={{ href: "/guide", label: "Guide" }}
        title={t(lang, "guideSetTitle")}
        description={t(lang, "guideSetIntro")}
      />

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
                <div
                  className="flex size-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${info.color}15` }}
                >
                  <Icon
                    className="size-4.5"
                    style={{ color: info.color }}
                  />
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
              <p
                className="text-xl font-bold"
                style={{ color: item.color }}
              >
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
              <code
                className="shrink-0 rounded-md px-2 py-1 font-mono text-sm font-bold"
                style={{
                  color: item.color,
                  backgroundColor: `${item.color}10`,
                }}
              >
                {item.code}
              </code>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </Surface>
          ))}
        </div>
      </section>

      {/* ── 5. Set List from DB ── */}
      <section className="space-y-6">
        <div>
          <h2 className="text-h2">{t(lang, "guideSetListHeading")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(lang, "guideSetListIntroA")}
            <Link
              href="/sets"
              className="font-medium text-primary hover:underline"
            >
              {t(lang, "guideSetListIntroLink")}
            </Link>
            {t(lang, "guideSetListIntroB")}
          </p>
        </div>

        {TYPE_ORDER.map((type) => {
          const sets = grouped[type];
          if (!sets || sets.length === 0) return null;
          const info = setTypeInfo[type] ?? setTypeInfo.OTHER!;

          return (
            <div key={type} className="space-y-2">
              <h3
                className="text-sm font-semibold"
                style={{ color: info.color }}
              >
                {info.label} ({sets.length})
              </h3>
              <Surface variant="outline" className="divide-y divide-[var(--p-hair)]">
                {sets.map((set) => (
                  <Link
                    key={set.code}
                    href={`/sets/${set.code}`}
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
                      <div
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: info.color }}
                      >
                        {set.code.split("-")[0]}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {set.nameEn ?? set.name}
                      </p>
                      <p className="text-meta">
                        {set.code}
                        {set.releaseDate && (
                          <>
                            {" · "}
                            {new Date(set.releaseDate).toLocaleDateString(
                              "th-TH",
                              { year: "numeric", month: "short" }
                            )}
                          </>
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {t(lang, "guideSetCardCount").replace(
                        "{n}",
                        String(set.cardCount)
                      )}
                    </span>
                  </Link>
                ))}
              </Surface>
            </div>
          );
        })}

        {Object.keys(grouped).length === 0 && (
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
