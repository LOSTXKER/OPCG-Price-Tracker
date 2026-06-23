import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  ChevronRight,
  GitCompareArrows,
  Layers,
  Palette,
  ShoppingCart,
  Sparkles,
  Store,
  Swords,
  Wrench,
} from "lucide-react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { FaqSection } from "@/components/shared/faq-section";
import { PageHeader } from "@/components/layout/page-header";
import { Surface } from "@/components/ui/surface";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { t, type Language } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";

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
  ];
}

function buildTools(lang: Language): Array<{
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}> {
  return [
    {
      href: "/drop-calculator",
      icon: Calculator,
      title: t(lang, "guideHomeToolDropTitle"),
      description: t(lang, "guideHomeToolDropDesc"),
    },
    {
      href: "/deck-calculator",
      icon: Calculator,
      title: t(lang, "guideHomeToolDeckTitle"),
      description: t(lang, "guideHomeToolDeckDesc"),
    },
    {
      href: "/compare",
      icon: GitCompareArrows,
      title: t(lang, "guideHomeToolCompareTitle"),
      description: t(lang, "guideHomeToolCompareDesc"),
    },
    {
      href: "/marketplace",
      icon: Store,
      title: t(lang, "guideHomeToolMarketplaceTitle"),
      description: t(lang, "guideHomeToolMarketplaceDesc"),
    },
  ];
}

function buildFaq(lang: Language): Array<{ question: string; answer: string }> {
  return [
    {
      question: t(lang, "guideHomeFaqQ1"),
      answer: t(lang, "guideHomeFaqA1"),
    },
    {
      question: t(lang, "guideHomeFaqQ2"),
      answer: t(lang, "guideHomeFaqA2"),
    },
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
    {
      question: t(lang, "guideHomeFaqQ6"),
      answer: t(lang, "guideHomeFaqA6"),
    },
  ];
}

export default async function GuideLandingPage() {
  const lang = await getServerLanguage();
  const guides = buildGuides(lang);
  const tools = buildTools(lang);
  const featured = guides[0];
  const rest = guides.slice(1);
  const FeaturedIcon = featured.icon;

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
              { label: "Home", href: "/" },
              { label: "Guide" },
            ]}
          />
        }
        title={t(lang, "guideHomeTitle")}
        description={t(lang, "guideHomeDescription")}
      />

      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href={featured.href}
            className="group relative row-span-1 sm:row-span-1 lg:row-span-2"
          >
            <Surface
              variant="panel"
              padding="none"
              className="flex h-full flex-col justify-between p-6 transition-colors group-hover:border-primary/30 sm:p-7"
            >
              <div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <FeaturedIcon className="size-6 text-primary" />
                </div>
                <h2 className="mt-4 text-h3 transition-colors group-hover:text-primary">
                  {featured.title}
                </h2>
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
                  className="flex h-full items-start gap-4 p-5 transition-colors group-hover:bg-muted/40"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-h4 transition-colors group-hover:text-primary">
                      {guide.title}
                    </h2>
                    <p className="mt-1 text-meta">{guide.description}</p>
                  </div>
                  <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                </Surface>
              </Link>
            );
          })}
        </div>
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
                  className="flex h-full flex-col gap-3 p-5 transition-colors group-hover:bg-muted/40"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-h5 transition-colors group-hover:text-primary">
                      {tool.title}
                    </h3>
                    <p className="mt-1 text-meta">{tool.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
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
          <h2 className="text-h3">{t(lang, "guideHomeFaqHeading")}</h2>
          <p className="mt-1 page-subtitle">
            {t(lang, "guideHomeFaqSubtitle")}
          </p>
        </div>
        <FaqSection title="" items={buildFaq(lang)} />
      </section>
    </div>
  );
}