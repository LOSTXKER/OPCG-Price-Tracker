import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { unstable_cache } from "next/cache";
import {
  ArrowRight,
  BookOpen,
  Calculator,
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
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { FaqSection } from "@/components/shared/faq-section";
import { PageHeader } from "@/components/layout/page-header";
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
      icon: Calculator,
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
};

const getHubSetData = unstable_cache(
  async (): Promise<{ sets: HubSet[]; setCount: number; cardCount: number }> => {
    try {
      const [sets, setCount, cardCount] = await Promise.all([
        prisma.cardSet.findMany({
          select: {
            code: true,
            name: true,
            nameEn: true,
            nameTh: true,
            releaseDate: true,
          },
          orderBy: [{ releaseDate: { sort: "desc", nulls: "last" } }, { code: "desc" }],
          take: 8,
        }),
        prisma.cardSet.count(),
        prisma.card.count(),
      ]);
      return { sets, setCount, cardCount };
    } catch {
      return { sets: [], setCount: 0, cardCount: 0 };
    }
  },
  ["guide-hub-sets"],
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
          { name: "Home", href: "/" },
          { name: "Guide", href: "/guide" },
        ])}
      />

      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t(lang, "home"), href: "/" },
              { label: "Guide" },
            ]}
          />
        }
        title={guideHubH1(lang)}
        description={guideHubLead(lang)}
      />

      {/* ── Intro prose — the pillar's own body copy ── */}
      <section className="space-y-4">
        <h2 className="text-h2">{guideHubIntroHeading(lang)}</h2>
        <div className="space-y-3 text-body leading-relaxed text-muted-foreground">
          {guideHubIntroParagraphs(lang).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>

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

      {/* ── Knowledge → price: send readers (and crawl equity) to the money pages ── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-h2">{guideHubPricesHeading(lang)}</h2>
          <p className="mt-1 text-body-sm leading-relaxed text-muted-foreground">
            {guideHubPricesIntro(lang, { setCount, cardCount })}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Surface
            as={Link}
            href="/"
            variant="outline"
            interactive
            className="group flex items-start gap-3 p-4"
          >
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <LineChart className="size-[18px] text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-h5 motion-base group-hover:text-primary">
                {guideHubMarketLinkTitle(lang)}
              </p>
              <p className="mt-0.5 text-meta leading-relaxed">
                {guideHubMarketLinkDesc(lang)}
              </p>
            </div>
          </Surface>
          <Surface
            as={Link}
            href="/opcg/trending"
            variant="outline"
            interactive
            className="group flex items-start gap-3 p-4"
          >
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Flame className="size-[18px] text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-h5 motion-base group-hover:text-primary">
                {guideHubTrendingLinkTitle(lang)}
              </p>
              <p className="mt-0.5 text-meta leading-relaxed">
                {guideHubTrendingLinkDesc(lang)}
              </p>
            </div>
          </Surface>
        </div>

        {sets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sets.map((set) => (
              <Link
                key={set.code}
                href={`/opcg/sets/${set.code}`}
                className="rounded-lg border border-hair bg-muted/40 px-3 py-2 text-body-sm motion-base hover:bg-muted"
              >
                <span className="font-semibold">{set.code}</span>{" "}
                <span className="text-muted-foreground">{getSetName(lang, set)}</span>
              </Link>
            ))}
            <Link
              href="/opcg/sets"
              className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-body-sm font-medium text-primary motion-base hover:bg-primary/10"
            >
              {guideHubPricesAllSets(lang)}
              <ArrowRight className="size-3.5" />
            </Link>
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
