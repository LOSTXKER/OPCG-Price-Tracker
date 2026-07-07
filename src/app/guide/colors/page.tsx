import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { Surface } from "@/components/ui/surface";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PageHeader } from "@/components/layout/page-header";
import { GuideSourceList } from "@/components/guide/guide-source-list";
import { GuideCallout } from "@/components/guide/guide-callout";
import { GuidePrevNext } from "@/components/guide/guide-prev-next";
import { CardThumbStrip } from "@/components/guide/card-thumb-strip";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { t, type Language } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "สี (Colors) — คู่มือ OPCG",
  description:
    "คู่มือระบบสีของ One Piece Card Game: Red, Blue, Green, Purple, Black, Yellow รวม Multicolor และกฎสร้างเด็ค อ้างอิงจาก Bandai",
  alternates: { canonical: "/guide/colors" },
};

/* ------------------------------------------------------------------ */
/*  Color data                                                         */
/* ------------------------------------------------------------------ */

interface ColorInfo {
  name: string;
  nameTh: string;
  hex: string;
  tagline: string;
  description: string;
}

function buildColors(lang: Language): ColorInfo[] {
  return [
    {
      name: "Red",
      nameTh: t(lang, "guideColorRedNameTh"),
      hex: "#DC2626",
      tagline: t(lang, "guideColorRedTagline"),
      description: t(lang, "guideColorRedDesc"),
    },
    {
      name: "Green",
      nameTh: t(lang, "guideColorGreenNameTh"),
      hex: "#22C55E",
      tagline: t(lang, "guideColorGreenTagline"),
      description: t(lang, "guideColorGreenDesc"),
    },
    {
      name: "Blue",
      nameTh: t(lang, "guideColorBlueNameTh"),
      hex: "#3B82F6",
      tagline: t(lang, "guideColorBlueTagline"),
      description: t(lang, "guideColorBlueDesc"),
    },
    {
      name: "Purple",
      nameTh: t(lang, "guideColorPurpleNameTh"),
      hex: "#8B5CF6",
      tagline: t(lang, "guideColorPurpleTagline"),
      description: t(lang, "guideColorPurpleDesc"),
    },
    {
      name: "Black",
      nameTh: t(lang, "guideColorBlackNameTh"),
      hex: "#374151",
      tagline: t(lang, "guideColorBlackTagline"),
      description: t(lang, "guideColorBlackDesc"),
    },
    {
      name: "Yellow",
      nameTh: t(lang, "guideColorYellowNameTh"),
      hex: "#EAB308",
      tagline: t(lang, "guideColorYellowTagline"),
      description: t(lang, "guideColorYellowDesc"),
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

type LeaderCard = {
  cardCode: string;
  nameEn: string | null;
  nameJp: string;
  imageUrl: string | null;
  colorEn: string | null;
};

function buildDeckSummary(lang: Language) {
  return [
    {
      label: t(lang, "guideColorDeckSummaryLeaderLabel"),
      value: t(lang, "guideColorDeckSummaryLeaderValue"),
      note: t(lang, "guideColorDeckSummaryLeaderNote"),
    },
    {
      label: t(lang, "guideColorDeckSummaryDeckLabel"),
      value: t(lang, "guideColorDeckSummaryDeckValue"),
      note: t(lang, "guideColorDeckSummaryDeckNote"),
    },
    {
      label: "DON!!",
      value: t(lang, "guideColorDeckSummaryDonValue"),
      note: t(lang, "guideColorDeckSummaryDonNote"),
    },
    {
      label: t(lang, "guideColorDeckSummaryDupLabel"),
      value: t(lang, "guideColorDeckSummaryDupValue"),
      note: t(lang, "guideColorDeckSummaryDupNote"),
    },
  ];
}

function buildSources(lang: Language) {
  return [
    {
      label: "Official Rules",
      desc: t(lang, "guideColorSourceRulesDesc"),
      url: "https://en.onepiece-cardgame.com/rules/",
    },
    {
      label: "Play Guide",
      desc: t(lang, "guideColorSourcePlayGuideDesc"),
      url: "https://en.onepiece-cardgame.com/play-guide/",
    },
  ];
}

async function getLeadersByColor(): Promise<Record<string, LeaderCard[]>> {
  try {
    const leaders = await prisma.card.findMany({
      where: {
        cardType: "LEADER",
        isParallel: false,
        imageUrl: { not: null },
      },
      select: {
        cardCode: true,
        nameEn: true,
        nameJp: true,
        imageUrl: true,
        colorEn: true,
      },
      orderBy: { cardCode: "asc" },
    });

    const map: Record<string, LeaderCard[]> = {};
    for (const leader of leaders) {
      const colors = (leader.colorEn ?? "").split("/");
      for (const c of colors) {
        const key = c.trim();
        if (!key) continue;
        if (!map[key]) map[key] = [];
        if (map[key].length < 6) {
          map[key].push(leader);
        }
      }
    }
    return map;
  } catch {
    return {};
  }
}

export default async function ColorsPage() {
  const lang = await getServerLanguage();
  const leadersByColor = await getLeadersByColor();
  const colors = buildColors(lang);
  const deckSummary = buildDeckSummary(lang);
  const sources = buildSources(lang);

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Guide", href: "/guide" },
          { name: "Colors", href: "/guide/colors" },
        ])}
      />

      {/* ── 1. Hero + Intro ── */}
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t(lang, "home"), href: "/" },
              { label: "Guide", href: "/guide" },
              { label: t(lang, "guideColorTitle") },
            ]}
            hideMobileBack
          />
        }
        back={{ href: "/guide", label: "Guide" }}
        title={t(lang, "guideColorTitle")}
        description={
          <>
            {t(lang, "guideColorIntroP1a")}
            <strong className="text-foreground">
              {t(lang, "guideColorIntroLeader")}
            </strong>
            {t(lang, "guideColorIntroP1b")}
          </>
        }
      />

      {/* ── 2. Six Colors ── */}
      <section className="space-y-4">
        <h2 className="text-h2">
          {t(lang, "guideColorSixColorsHeading")}
        </h2>
        <div className="space-y-5">
          {colors.map((color) => {
            const leaders = leadersByColor[color.name] ?? [];
            return (
              <Surface
                key={color.name}
                variant="outline"
                className="overflow-hidden"
                style={{ borderColor: `${color.hex}25` }}
              >
                <div className="flex">
                  <div
                    className="w-1.5 shrink-0"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="flex-1 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <div
                        className="flex size-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: color.hex }}
                      >
                        {color.name.charAt(0)}
                      </div>
                      <h3 className="text-h4">
                        {color.name}{" "}
                        <span className="font-normal text-muted-foreground">
                          ({color.nameTh})
                        </span>
                      </h3>
                    </div>
                    <p
                      className="mt-2 text-sm font-medium"
                      style={{ color: color.hex }}
                    >
                      {color.tagline}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {color.description}
                    </p>

                    {/* Leader card images */}
                    {leaders.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-eyebrow">
                          {t(lang, "guideColorLeaderExampleLabel")}
                        </p>
                        <CardThumbStrip
                          size="lg"
                          showCaption
                          scroll
                          cards={leaders.map((leader) => ({
                            cardCode: leader.cardCode,
                            name: leader.nameEn ?? leader.nameJp,
                            imageUrl: leader.imageUrl,
                          }))}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Surface>
            );
          })}
        </div>
      </section>

      {/* ── 3. Multicolor ── */}
      <section className="space-y-4">
        <h2 className="text-h2">
          {t(lang, "guideColorMulticolorHeading")}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t(lang, "guideColorMulticolorIntroP1a")}
          <strong className="text-foreground">
            {t(lang, "guideColorMulticolorIntro2Colors")}
          </strong>
          {t(lang, "guideColorMulticolorIntroP1b")}
        </p>

        <Surface variant="outline" className="overflow-hidden">
          <div className="border-b border-hair px-4 py-2 text-eyebrow">
            {t(lang, "guideColorCompareCaption")}
          </div>
          <div className="grid grid-cols-2 divide-x divide-hair">
            <div className="p-5 text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-red-500">
                <span className="text-sm font-bold text-white">R</span>
              </div>
              <p className="mt-2 text-sm font-semibold">
                {t(lang, "guideColorSingleColorLeader")}
              </p>
              <p className="mt-1 text-2xl font-bold">5 Life</p>
              <p className="mt-0.5 text-meta">
                {t(lang, "guideColorSingleColorNote")}
              </p>
            </div>
            <div className="p-5 text-center">
              <div className="mx-auto flex size-10 items-center justify-center overflow-hidden rounded-full">
                <span className="inline-block h-full w-1/2 bg-red-500" />
                <span className="inline-block h-full w-1/2 bg-green-500" />
              </div>
              <p className="mt-2 text-sm font-semibold">
                {t(lang, "guideColorTwoColorLeader")}
              </p>
              <p className="mt-1 text-2xl font-bold">4 Life</p>
              <p className="mt-0.5 text-meta">
                {t(lang, "guideColorTwoColorNote")}
              </p>
            </div>
          </div>
        </Surface>

        <div className="rounded-xl border border-transparent dark:border-hair bg-muted/20 p-5 text-sm leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">
            {t(lang, "guideColorExampleHeading")}
          </p>
          <p className="mt-2">
            {t(lang, "guideColorExampleP1a")}
            <strong className="text-foreground">
              {t(lang, "guideColorExampleRedGreen")}
            </strong>
            {t(lang, "guideColorExampleP1b")}
          </p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: "#DC2626" }}
              />
              <span>{t(lang, "guideColorExampleRedCard")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: "#22C55E" }}
              />
              <span>{t(lang, "guideColorExampleGreenCard")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex size-3 overflow-hidden rounded-full">
                <span className="w-1/2 bg-red-500" />
                <span className="w-1/2 bg-green-500" />
              </div>
              <span>{t(lang, "guideColorExampleMulticolorCard")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Deck Building Rule ── */}
      <section className="space-y-4">
        <h2 className="text-h2">
          {t(lang, "guideColorDeckBuildingHeading")}
        </h2>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">
              {t(lang, "guideColorDeckRuleP1Strong")}
            </strong>
            {t(lang, "guideColorDeckRuleP1b")}
          </p>
          <p>
            {t(lang, "guideColorDeckRuleP2a")}
            <strong className="text-foreground">
              {t(lang, "guideColorDeckRuleP2Strong")}
            </strong>
            {t(lang, "guideColorDeckRuleP2b")}
          </p>
        </div>

        <GuideCallout tone="red">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">
              {t(lang, "guideColorWrongColorStrong")}
            </strong>
            {t(lang, "guideColorWrongColorBody")}
          </p>
        </GuideCallout>

        <Surface variant="outline" className="p-5">
          <p className="text-sm font-semibold">
            {t(lang, "guideColorDeckSummaryHeading")}
          </p>
          <div className="mt-3 space-y-2">
            {deckSummary.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm font-medium">
                  {item.label}
                </span>
                <span className="text-sm font-semibold">{item.value}</span>
                <span className="text-meta">
                  {item.note}
                </span>
              </div>
            ))}
          </div>
        </Surface>
      </section>

      {/* ── 5. Sources ── */}
      <GuideSourceList heading={t(lang, "guideColorSourcesHeading")} sources={sources} />

      {/* ── Navigation ── */}
      <GuidePrevNext
        prev={{ href: "/guide/rarities", label: t(lang, "guideColorNavPrev") }}
        next={{ href: "/guide/sets", label: t(lang, "guideColorNavNext") }}
      />
    </div>
  );
}
