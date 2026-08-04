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
import {
  buildHomeFaqLinks,
  buildHomeLongTailFaq,
} from "@/lib/seo/copy/home";
import { useUIStore } from "@/stores/ui-store";

function buildFeatures(lang: Language) {
  return [
    {
      icon: LineChart,
      title: t(lang, "seoFeatPriceTitle"),
      description: t(lang, "seoFeatPriceDesc"),
      href: "/opcg/market-overview",
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
      href: "/opcg/drop-calculator",
    },
  ];
}

function buildExploreItems(lang: Language): RelatedPageItem[] {
  return [
    {
      icon: Layers,
      href: "/opcg/sets",
      title: t(lang, "seoExploreSetsTitle"),
      description: t(lang, "seoExploreSetsDesc"),
    },
    {
      icon: TrendingUp,
      href: "/opcg/trending",
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
      href: "/opcg/compare",
      title: t(lang, "seoExploreCompareTitle"),
      description: t(lang, "seoExploreCompareDesc"),
    },
    {
      icon: ShoppingCart,
      href: "/opcg/deck-calculator",
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
    // Long-tail questions from real Thai search behaviour (SEO plan §3.1).
    // They live in lib/seo/copy/home.ts because they are full paragraphs, not
    // dictionary labels. Same FaqSection ⇒ one FAQPage JSON-LD covering all 11.
    ...buildHomeLongTailFaq(lang),
  ];
}

export function HomeSeoContent() {
  const lang = useUIStore((s) => s.language);
  const features = buildFeatures(lang);
  const exploreItems = buildExploreItems(lang);
  const faqItems = buildFaqItems(lang);
  const faqLinks = buildHomeFaqLinks(lang);

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
      <div>
        <FaqSection items={faqItems} />

        {/* Destinations for the four long-tail answers above. They sit here as
            a real link list because FaqSection takes `answer: string` — an
            anchor cannot be embedded inside an answer without editing a shared
            component this area does not own. */}
        <nav className="mt-4" aria-label={faqLinks.heading}>
          <p className="text-eyebrow">{faqLinks.heading}</p>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
            {faqLinks.links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
