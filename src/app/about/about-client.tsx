"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Database,
  Sparkles,
  Star,
  Store,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PageHeader } from "@/components/layout/page-header";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import {
  CONTACT_FACEBOOK_URL,
  buildAboutHeading,
  buildAboutMethodology,
} from "@/lib/seo/copy/site";

interface FeatureCard {
  icon: LucideIcon;
  titleKey:
    | "aboutFeaturePrices"
    | "aboutFeaturePortfolio"
    | "aboutFeatureMarketplace"
    | "aboutFeatureTools";
  descKey:
    | "aboutFeaturePricesDesc"
    | "aboutFeaturePortfolioDesc"
    | "aboutFeatureMarketplaceDesc"
    | "aboutFeatureToolsDesc";
  /** Page this blurb describes. Omitted when the feature has no live route. */
  href?: string;
}

const FEATURES: FeatureCard[] = [
  {
    icon: BarChart3,
    titleKey: "aboutFeaturePrices",
    descKey: "aboutFeaturePricesDesc",
    href: "/opcg/trending",
  },
  {
    icon: Star,
    titleKey: "aboutFeaturePortfolio",
    descKey: "aboutFeaturePortfolioDesc",
    href: "/portfolio",
  },
  {
    // No href: the marketplace ships behind `marketplaceEnabled=false` and its
    // route 404s, so linking here would be a broken internal link.
    icon: Store,
    titleKey: "aboutFeatureMarketplace",
    descKey: "aboutFeatureMarketplaceDesc",
  },
  {
    icon: Wrench,
    titleKey: "aboutFeatureTools",
    descKey: "aboutFeatureToolsDesc",
    href: "/opcg/drop-calculator",
  },
];

export default function AboutClient() {
  const lang = useUIStore((s) => s.language);
  const aboutHeading = buildAboutHeading(lang);
  const methodology = buildAboutMethodology(lang);

  return (
    <div className="space-y-10">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t(lang, "home"), href: "/" },
              { label: t(lang, "aboutUs") },
            ]}
          />
        }
        title={aboutHeading.title}
        description={t(lang, "aboutTagline")}
      />

      <section>
        <Surface variant="panel" padding="none" className="p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h2 className="text-h3">{t(lang, "aboutWhatTitle")}</h2>
          </div>
          <p className="mt-3 max-w-3xl text-body text-muted-foreground">
            {t(lang, "aboutWhatBody")}
          </p>
        </Surface>
      </section>

      <section className="space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="size-5 text-muted-foreground" />
            <h2 className="text-h3">{t(lang, "aboutFeaturesTitle")}</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Surface
                key={feature.titleKey}
                variant="outline"
                padding="none"
                className="flex h-full flex-col gap-3 p-5"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-h5">
                    {feature.href ? (
                      <Link
                        href={feature.href}
                        className="motion-base hover:text-primary hover:underline"
                      >
                        {t(lang, feature.titleKey)}
                      </Link>
                    ) : (
                      t(lang, feature.titleKey)
                    )}
                  </h3>
                  <p className="mt-1 text-meta">{t(lang, feature.descKey)}</p>
                </div>
              </Surface>
            );
          })}
        </div>
      </section>

      {/* Methodology — the site's trust anchor. Kept as prose + a definition
          list so answer engines can quote "where do the prices come from".
          `id` is the site-wide deep-link target: every other page's FAQ answers
          "where do prices come from" in one sentence + a link here instead of
          restating the methodology (SEO round 1 — dedupe boilerplate). */}
      <section id="methodology">
        <Surface variant="outline" padding="none" className="p-6 sm:p-7">
          <div className="flex items-center gap-2">
            <Database className="size-5 text-muted-foreground" />
            <h2 className="text-h3">{methodology.title}</h2>
          </div>
          <div className="mt-3 max-w-3xl space-y-2">
            {methodology.intro.map((paragraph) => (
              <p key={paragraph} className="text-body-sm text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {methodology.items.map((item) => (
              <div key={item.term} className="min-w-0">
                <dt className="text-h5">{item.term}</dt>
                <dd className="mt-1 text-body-sm leading-relaxed text-muted-foreground">
                  {item.detail}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-meta">
            {methodology.correctionsPrefix}{" "}
            <a
              href={CONTACT_FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              {methodology.correctionsLinkLabel}
            </a>
          </p>
        </Surface>
      </section>

      {/* Legal entity behind the site — a real registered company is an
          E-E-A-T signal the audit called out ("who is behind the site").
          Facts limited to what the owner's registry source confirms
          (name TH/EN + province); mirrored in organizationJsonLd. */}
      <section>
        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-muted-foreground" />
          <h2 className="text-h3">{t(lang, "aboutCompanyTitle")}</h2>
        </div>
        <p className="mt-3 max-w-3xl text-body-sm leading-relaxed text-muted-foreground">
          {t(lang, "aboutCompanyBody")}
        </p>
      </section>

      <section>
        <Surface
          variant="hero"
          padding="none"
          className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
        >
          <div className="min-w-0">
            <h2 className="text-h3">{t(lang, "aboutCtaTitle")}</h2>
            <p className="mt-2 max-w-xl text-body-sm text-muted-foreground">
              {t(lang, "aboutCtaDesc")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button render={<Link href="/register" />}>
              {t(lang, "aboutCtaPrimary")}
              <ArrowRight className="size-4" />
            </Button>
            <Button variant="outline" render={<Link href="/pricing" />}>
              {t(lang, "aboutCtaSecondary")}
            </Button>
          </div>
        </Surface>
      </section>
    </div>
  );
}
