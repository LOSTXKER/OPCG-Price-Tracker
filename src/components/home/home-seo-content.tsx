"use client";

import Link from "next/link";
import {
  Briefcase,
  Calculator,
  ChevronRight,
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
import { Surface } from "@/components/ui/surface";
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
    <div className="space-y-10 pt-6 sm:space-y-14">
      {/* Features */}
      <section className="space-y-5">
        <div>
          <h2 className="text-h3">{t(lang, "seoFeaturesHeading")}</h2>
          <p className="mt-1.5 text-meta">{t(lang, "seoFeaturesSub")}</p>
        </div>
        {/* Same grammar as the "สำรวจเพิ่มเติม" grid below (related-pages.tsx):
            canonical Surface, icon on the left in a primary-tinted tile, title
            over description. These used to hand-roll `surface-1 hairline
            rounded-xl p-6` — which is `Surface variant="hero"`, reserved for one
            hero per page — with the icon stacked above the text in its own
            circle. Two blocks doing the same job in two visual languages, 64px
            apart, is what made the tail read as bolted on. */}
        <div className="grid gap-3 sm:grid-cols-3">
          {features.map((f) => (
            <Surface
              as={Link}
              variant="outline"
              interactive
              key={f.href}
              href={f.href}
              className="group ease-chrome flex items-start gap-3 p-4"
            >
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="size-[18px] text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-h5 motion-base group-hover:text-primary">
                  {f.title}
                </p>
                <p className="mt-0.5 text-meta leading-relaxed">
                  {f.description}
                </p>
              </div>
              <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
            </Surface>
          ))}
        </div>
      </section>

      {/* Price explainer — plain prose, no panel. Boxing three paragraphs of
          body copy made the only genuinely editorial block on the page read as
          an ad unit, and it was the fourth bordered surface in a row. The
          measure cap is the real readability fix: unbounded, these lines ran
          the full 1400px container on desktop. */}
      <section className="space-y-4">
        <SectionHead title={t(lang, "seoPriceExplainTitle")} />
        <div className="max-w-3xl space-y-3 text-body-sm leading-relaxed text-muted-foreground">
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
          {/* One string, no embedded brand name — the source is named only in
              the FAQ answer that directly asks where prices come from
              (`seoFaq2A`, owner decision 2026-08-06). */}
          <p>{t(lang, "seoPriceP2")}</p>
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
