"use client";

import Link from "next/link";
import {
  Briefcase,
  Calculator,
  GitCompareArrows,
  Layers,
  LineChart,
  ShoppingCart,
  Sparkles,
  Store,
  TrendingUp,
} from "lucide-react";
import { FaqSection, type FaqItem } from "@/components/shared/faq-section";
import {
  RelatedPages,
  type RelatedPageItem,
} from "@/components/shared/related-pages";
import { SectionHead } from "@/components/shared/section-head";
import { t, type Language } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

function buildFeatures(lang: Language) {
  return [
    {
      icon: LineChart,
      title: t(lang, "seoFeatPriceTitle"),
      description: t(lang, "seoFeatPriceDesc"),
      href: "/market-overview",
    },
    {
      icon: Briefcase,
      title: t(lang, "seoFeatPortfolioTitle"),
      description: t(lang, "seoFeatPortfolioDesc"),
      href: "/portfolio",
    },
    {
      icon: Calculator,
      title: t(lang, "seoFeatDropTitle"),
      description: t(lang, "seoFeatDropDesc"),
      href: "/drop-calculator",
    },
  ];
}

function buildExploreItems(lang: Language): RelatedPageItem[] {
  return [
    {
      icon: Layers,
      href: "/sets",
      title: t(lang, "seoExploreSetsTitle"),
      description: t(lang, "seoExploreSetsDesc"),
    },
    {
      icon: TrendingUp,
      href: "/trending",
      title: t(lang, "seoExploreTrendingTitle"),
      description: t(lang, "seoExploreTrendingDesc"),
    },
    {
      icon: Store,
      href: "/marketplace",
      title: t(lang, "seoExploreMarketTitle"),
      description: t(lang, "seoExploreMarketDesc"),
    },
    {
      icon: Sparkles,
      href: "/guide",
      title: t(lang, "seoExploreGuideTitle"),
      description: t(lang, "seoExploreGuideDesc"),
    },
    {
      icon: GitCompareArrows,
      href: "/compare",
      title: t(lang, "seoExploreCompareTitle"),
      description: t(lang, "seoExploreCompareDesc"),
    },
    {
      icon: ShoppingCart,
      href: "/deck-calculator",
      title: t(lang, "seoExploreDeckTitle"),
      description: t(lang, "seoExploreDeckDesc"),
    },
  ];
}

function buildFaqItems(lang: Language): FaqItem[] {
  return [
    { question: t(lang, "seoFaq1Q"), answer: t(lang, "seoFaq1A") },
    { question: t(lang, "seoFaq2Q"), answer: t(lang, "seoFaq2A") },
    { question: t(lang, "seoFaq3Q"), answer: t(lang, "seoFaq3A") },
    { question: t(lang, "seoFaq4Q"), answer: t(lang, "seoFaq4A") },
    { question: t(lang, "seoFaq5Q"), answer: t(lang, "seoFaq5A") },
    { question: t(lang, "seoFaq6Q"), answer: t(lang, "seoFaq6A") },
    { question: t(lang, "seoFaq7Q"), answer: t(lang, "seoFaq7A") },
  ];
}

export function HomeSeoContent() {
  const lang = useUIStore((s) => s.language);
  const features = buildFeatures(lang);
  const exploreItems = buildExploreItems(lang);
  const faqItems = buildFaqItems(lang);

  return (
    <div className="space-y-16 pt-6">
      {/* Features */}
      <section className="space-y-5">
        <div>
          <h2 className="text-h3">{t(lang, "seoFeaturesHeading")}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t(lang, "seoFeaturesSub")}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="surface-1 ease-chrome group flex flex-col gap-4 rounded-xl p-6 hairline hover:bg-muted/70"
            >
              <div className="flex size-11 items-center justify-center rounded-full bg-foreground/[0.05] text-foreground">
                <f.icon className="size-5" />
              </div>
              <div>
                <p className="ease-chrome text-h5 group-hover:text-foreground">
                  {f.title}
                </p>
                <p className="mt-1.5 text-meta leading-relaxed">
                  {f.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Price explainer */}
      <section className="surface-1 hairline space-y-4 rounded-xl p-6">
        <SectionHead title={t(lang, "seoPriceExplainTitle")} />
        <div className="space-y-3 text-body-sm leading-relaxed text-muted-foreground">
          <p>
            {t(lang, "seoPriceP1a")}{" "}
            <Link
              href="/guide/rarities"
              className="font-medium text-primary hover:underline"
            >
              {t(lang, "seoPriceP1Link")}
            </Link>{" "}
            {t(lang, "seoPriceP1b")}
          </p>
          <p>
            {t(lang, "seoPriceP2a")} <strong>Yuyu-tei</strong>
            {t(lang, "seoPriceP2b")}
          </p>
          <p>
            {t(lang, "seoPriceP3a")}{" "}
            <Link
              href="/guide/buying"
              className="font-medium text-primary hover:underline"
            >
              {t(lang, "seoPriceP3Link1")}
            </Link>{" "}
            {t(lang, "seoPriceP3mid")}{" "}
            <Link
              href="/guide/getting-started"
              className="font-medium text-primary hover:underline"
            >
              {t(lang, "seoPriceP3Link2")}
            </Link>
          </p>
        </div>
      </section>

      {/* Explore CTA grid */}
      <RelatedPages title={t(lang, "seoExploreTitle")} items={exploreItems} />

      {/* FAQ */}
      <FaqSection items={faqItems} />
    </div>
  );
}
