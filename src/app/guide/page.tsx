import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { unstable_cache } from "next/cache";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Dices,
  ChevronRight,
  Flame,
  GitCompareArrows,
  Globe,
  Layers,
  LineChart,
  Palette,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Swords,
  Wrench,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { ArrowLink } from "@/components/shared/arrow-link";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { FaqSection } from "@/components/shared/faq-section";
import { PageHeader } from "@/components/layout/page-header";
import { RelatedPageCard } from "@/components/shared/related-pages";
import { Surface } from "@/components/ui/surface";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { isMarketplaceEnabled } from "@/lib/marketplace/feature-flag";
import { t, getSetName, type Language } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";
import {
  guideHubChaptersHeading,
  guideHubExtraFaq,
  guideHubH1,
  guideHubIntroHeading,
  guideHubIntroParagraphs,
  guideHubLead,
  guideHubMarketLinkDesc,
  guideHubMarketLinkTitle,
  guideHubPricesAllSets,
  guideHubPricesHeading,
  guideHubPricesIntro,
  guideHubTrendingLinkDesc,
  guideHubTrendingLinkTitle,
} from "@/lib/seo/copy/guide";
import { guideAuthH1, guideAuthLead } from "@/lib/seo/copy/guide-authenticity";
import { guideVersionsH1, guideVersionsLead } from "@/lib/seo/copy/guide-versions";

export const dynamic = "force-dynamic";

interface GuideItem {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  featured?: boolean;
}

function buildGuides(lang: Language): GuideItem[] {
  return [
    {
      href: "/guide/getting-started",
      icon: BookOpen,
      title: t(lang, "guideHomeGuideGettingStartedTitle"),
      description: t(lang, "guideHomeGuideGettingStartedDesc"),
      featured: true,
    },
    {
      href: "/guide/card-types",
      icon: Swords,
      title: t(lang, "guideHomeGuideCardTypesTitle"),
      description: t(lang, "guideHomeGuideCardTypesDesc"),
    },
    {
      href: "/guide/rarities",
      icon: Sparkles,
      title: t(lang, "guideHomeGuideRaritiesTitle"),
      description: t(lang, "guideHomeGuideRaritiesDesc"),
    },
    {
      href: "/guide/colors",
      icon: Palette,
      title: t(lang, "guideHomeGuideColorsTitle"),
      description: t(lang, "guideHomeGuideColorsDesc"),
    },
    {
      href: "/guide/sets",
      icon: Layers,
      title: t(lang, "guideHomeGuideSetsTitle"),
      description: t(lang, "guideHomeGuideSetsDesc"),
    },
    {
      href: "/guide/buying",
      icon: ShoppingCart,
      title: t(lang, "guideHomeGuideBuyingTitle"),
      description: t(lang, "guideHomeGuideBuyingDesc"),
    },
    // Copy for these two lives in their own modules rather than the shared
    // dictionary — see src/lib/seo/copy/guide-authenticity.ts / guide-versions.ts.
    {
      href: "/guide/authenticity",
      icon: ShieldCheck,
      title: guideAuthH1(lang),
      description: guideAuthLead(lang),
    },
    {
      href: "/guide/versions",
      icon: Globe,
      title: guideVersionsH1(lang),
      description: guideVersionsLead(lang),
    },
  ];
}

function buildTools(
  lang: Language,
  marketplaceEnabled: boolean
): Array<{
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}> {
  return [
    {
      href: "/opcg/drop-calculator",
      // Odds of pulling a card, not arithmetic — keep Calculator for the deck
      // cost tool so one icon keeps one meaning across the site.
      icon: Dices,
      title: t(lang, "guideHomeToolDropTitle"),
      description: t(lang, "guideHomeToolDropDesc"),
    },
    {
      href: "/opcg/deck-calculator",
      icon: Calculator,
      title: t(lang, "guideHomeToolDeckTitle"),
      description: t(lang, "guideHomeToolDeckDesc"),
    },
    {
      href: "/opcg/compare",
      icon: GitCompareArrows,
      title: t(lang, "guideHomeToolCompareTitle"),
      description: t(lang, "guideHomeToolCompareDesc"),
    },
    // The marketplace ships behind a flag; while it is off the route 404s, so
    // the tile links to the live trending page instead of dead-ending users
    // and crawlers.
    marketplaceEnabled
      ? {
          href: "/marketplace",
          icon: Store,
          title: t(lang, "guideHomeToolMarketplaceTitle"),
          description: t(lang, "guideHomeToolMarketplaceDesc"),
        }
      : {
          href: "/opcg/trending",
          icon: Flame,
          title: guideHubTrendingLinkTitle(lang),
          description: guideHubTrendingLinkDesc(lang),
        },
  ];
}

// SEO round 1 trimmed this list from 6 dictionary items to 3: the old Q1
// ("what is OPCG") restated the intro paragraph right above it, Q2 ("what do
// I need to start") answered the same thing as the extra FAQ's cost question,
// and Q6 (price methodology) now lives once at /about#methodology — restating
// them here only duplicated intent inside one FAQPage JSON-LD block.
function buildFaq(lang: Language): Array<{ question: string; answer: string }> {
  return [
    {
      question: t(lang, "guideHomeFaqQ3"),
      answer: t(lang, "guideHomeFaqA3"),
    },
    {
      question: t(lang, "guideHomeFaqQ4"),
      answer: t(lang, "guideHomeFaqA4"),
    },
    {
      question: t(lang, "guideHomeFaqQ5"),
      answer: t(lang, "guideHomeFaqA5"),
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  DB query — money-page links (cached: the set list changes rarely)   */
/* ------------------------------------------------------------------ */

type HubSet = {
  code: string;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  releaseDate: Date | null;
  cardCount?: number;
  boxImageUrl?: string | null;
  /** Stand-in cover art when a set has no box art — see `getHubSetData`. */
  coverUrl?: string | null;
};

const getHubSetData = unstable_cache(
  async (): Promise<{ sets: HubSet[]; setCount: number; cardCount: number }> => {
    try {
      const [sets, setCount, cardCount] = await Promise.all([
        prisma.cardSet.findMany({
          select: {
            id: true,
            code: true,
            name: true,
            nameEn: true,
            nameTh: true,
            releaseDate: true,
            cardCount: true,
            boxImageUrl: true,
          },
          orderBy: [{ releaseDate: { sort: "desc", nulls: "last" } }, { code: "desc" }],
          take: 8,
        }),
        prisma.cardSet.count(),
        prisma.card.count(),
      ]);

      // A cover picture per set. Real box art covers every set except the DON!!
      // collection, which was never sold as a boxed product — for that one the
      // set's own priciest card with artwork stands in. Scoped to these 8 sets.
      const needCover = sets.filter((s) => !s.boxImageUrl).map((s) => s.id);
      const covers = await prisma.card.findMany({
        where: { setId: { in: needCover }, imageUrl: { not: null } },
        select: { setId: true, imageUrl: true },
        orderBy: { latestPriceJpy: { sort: "desc", nulls: "last" } },
      });
      const coverBySet = new Map<number, string>();
      for (const card of covers) {
        if (card.setId != null && card.imageUrl && !coverBySet.has(card.setId)) {
          coverBySet.set(card.setId, card.imageUrl);
        }
      }

      return {
        sets: sets.map((s) => ({ ...s, coverUrl: coverBySet.get(s.id) ?? null })),
        setCount,
        cardCount,
      };
    } catch {
      return { sets: [], setCount: 0, cardCount: 0 };
    }
  },
  ["guide-hub-sets-v3"],
  { revalidate: 3600, tags: ["guide-sets"] }
);

export default async function GuideLandingPage() {
  const lang = await getServerLanguage();
  const [{ sets, setCount, cardCount }, marketplaceEnabled] = await Promise.all([
    getHubSetData(),
    isMarketplaceEnabled(),
  ]);
  const guides = buildGuides(lang);
  const tools = buildTools(lang, marketplaceEnabled);
  const featured = guides[0];
  const rest = guides.slice(1);
  const FeaturedIcon = featured.icon;

  const latestSetLabel = sets[0]
    ? `${sets[0].code} ${getSetName(lang, sets[0])}`.trim()
    : null;
  const faqItems = [
    ...buildFaq(lang),
    ...guideHubExtraFaq(lang, { latestSetLabel, setCount }),
  ];

  return (
    <div className="space-y-10">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t(lang, "home"), href: "/" },
          { name: t(lang, "guideBreadcrumbGuide"), href: "/guide" },
        ])}
      />

      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t(lang, "home"), href: "/" },
              { label: t(lang, "guideBreadcrumbGuide") },
            ]}
          />
        }
        title={guideHubH1(lang)}
        description={guideHubLead(lang)}
      />

      {/* ── Chapters grid FIRST — this is what visitors come to the hub for.
          The old order buried it under ~1.5 screens of intro prose on mobile
          (SEO round 3 audit finding #1). ── */}
      <section className="space-y-4">
        <h2 className="text-h2">{guideHubChaptersHeading(lang)}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href={featured.href}
            className="group relative row-span-1 sm:row-span-1 lg:row-span-2"
          >
            <Surface
              variant="panel"
              padding="none"
              className="flex h-full flex-col justify-between p-6 motion-base sm:p-7"
            >
              <div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <FeaturedIcon className="size-6 text-primary" />
                </div>
                <h3 className="mt-4 text-h3 motion-base group-hover:text-primary">
                  {featured.title}
                </h3>
                <p className="mt-2 text-body-sm text-muted-foreground">
                  {featured.description}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary">
                {t(lang, "guideHomeStartNow")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Surface>
          </Link>

          {rest.map((guide) => {
            const Icon = guide.icon;
            return (
              <Link key={guide.href} href={guide.href} className="group">
                <Surface
                  variant="outline"
                  padding="none"
                  className="flex h-full items-start gap-4 p-5 motion-base group-hover:bg-muted/70"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-h4 motion-base group-hover:text-primary">
                      {guide.title}
                    </h3>
                    <p className="mt-1 text-meta">{guide.description}</p>
                  </div>
                  <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                </Surface>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Intro prose — the pillar's own body copy, kept but trimmed to 2
          short paragraphs (was 4) and moved below the chapter grid. Width
          capped for line length (matches the reading column subpages get via
          ROUTE_WIDTH in main-chrome.tsx — the hub route isn't matched by that
          regex, so the cap is applied locally) but LEFT-ALIGNED like every
          other section heading on this page: centering it (`mx-auto`) made
          the lone block float mid-page while its sibling H2s hug the left
          margin (owner call, เบส 2026-08-07). ── */}
      {/* Full-width two-column intro (owner call เบส 2026-08-07: the single
          narrow prose column left half the page empty). Paragraph 1 (what the
          game is) reads as prose; paragraph 2 (Meecard's role) becomes a
          Surface card with the methodology deep-link — fills the row AND adds
          the guide→about internal link. Stacks on phones. */}
      <section className="space-y-4">
        <h2 className="text-h2">{guideHubIntroHeading(lang)}</h2>
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-8">
          <p className="text-body leading-relaxed text-muted-foreground">
            {guideHubIntroParagraphs(lang)[0]}
          </p>
          <Surface
            variant="outline"
            className="flex flex-col items-start gap-3 self-start p-5"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <LineChart className="size-[18px] text-primary" />
            </div>
            <p className="text-body-sm leading-relaxed text-muted-foreground">
              {guideHubIntroParagraphs(lang)[1]}
            </p>
            <ArrowLink href="/about#methodology">
              {lang === "TH" ? "วิธีคิดราคากลางของ Meecard" : "How Meecard prices work"}
            </ArrowLink>
          </Surface>
        </div>
      </section>

      {/* ── Knowledge → price: send readers (and crawl equity) to the money pages ── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-h2">{guideHubPricesHeading(lang)}</h2>
          <p className="mt-1 text-body-sm leading-relaxed text-muted-foreground">
            {guideHubPricesIntro(lang, { setCount, cardCount })}
          </p>
        </div>

        {/* Component Kit: these were hand-rolled copies of RelatedPageCard,
            differing only by a missing chevron. */}
        <div className="grid gap-3 sm:grid-cols-2">
          <RelatedPageCard
            item={{
              href: "/",
              icon: LineChart,
              title: guideHubMarketLinkTitle(lang),
              description: guideHubMarketLinkDesc(lang),
            }}
          />
          <RelatedPageCard
            item={{
              href: "/opcg/trending",
              icon: Flame,
              title: guideHubTrendingLinkTitle(lang),
              description: guideHubTrendingLinkDesc(lang),
            }}
          />
        </div>

        {sets.length > 0 && (
          <div className="space-y-3">
            {/* Was a row of text-only chips on the one guide page with no imagery
                at all. Each tile now carries the set's packaging art, so a reader
                who does not yet know a set by its code can recognise it by sight.
                The slot is square because the art is a square canvas with the
                pack sitting inside it — a card-shaped slot would letterbox it. */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {sets.map((set) => {
                const art = set.boxImageUrl ?? set.coverUrl;
                return (
                  <Link
                    key={set.code}
                    href={`/opcg/sets/${set.code}`}
                    className="group rounded-lg border border-hair bg-muted/40 p-2.5 motion-base hover:bg-muted"
                  >
                    <div className="relative mx-auto aspect-square w-16 overflow-hidden rounded bg-muted">
                      {art && (
                        <Image
                          src={art}
                          alt=""
                          fill
                          className="object-contain"
                          sizes="64px"
                        />
                      )}
                    </div>
                    <p className="mt-2 text-center text-h5 uppercase">{set.code}</p>
                    <p className="line-clamp-2 text-center text-meta">{getSetName(lang, set)}</p>
                  </Link>
                );
              })}
            </div>
            <ArrowLink href="/opcg/sets">{guideHubPricesAllSets(lang)}</ArrowLink>
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="size-5 text-muted-foreground" />
            <h2 className="text-h3">{t(lang, "guideHomeToolsHeading")}</h2>
          </div>
          <p className="mt-1 page-subtitle">
            {t(lang, "guideHomeToolsSubtitle")}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.href} href={tool.href} className="group">
                <Surface
                  variant="outline"
                  padding="none"
                  className="flex h-full flex-col gap-3 p-5 motion-base group-hover:bg-muted/70"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-h5 motion-base group-hover:text-primary">
                      {tool.title}
                    </h3>
                    <p className="mt-1 text-meta">{tool.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground motion-base group-hover:text-primary">
                    {t(lang, "guideHomeOpenTool")}
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Surface>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-h2">{t(lang, "guideHomeFaqHeading")}</h2>
          <p className="mt-1 page-subtitle">
            {t(lang, "guideHomeFaqSubtitle")}
          </p>
        </div>
        <FaqSection title="" items={faqItems} />
      </section>

    </div>
  );
}
