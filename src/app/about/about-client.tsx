"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
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
}

const FEATURES: FeatureCard[] = [
  {
    icon: BarChart3,
    titleKey: "aboutFeaturePrices",
    descKey: "aboutFeaturePricesDesc",
  },
  {
    icon: Star,
    titleKey: "aboutFeaturePortfolio",
    descKey: "aboutFeaturePortfolioDesc",
  },
  {
    icon: Store,
    titleKey: "aboutFeatureMarketplace",
    descKey: "aboutFeatureMarketplaceDesc",
  },
  {
    icon: Wrench,
    titleKey: "aboutFeatureTools",
    descKey: "aboutFeatureToolsDesc",
  },
];

export default function AboutClient() {
  const lang = useUIStore((s) => s.language);

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
        title={t(lang, "aboutTitle")}
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
                  <h3 className="text-h5">{t(lang, feature.titleKey)}</h3>
                  <p className="mt-1 text-meta">{t(lang, feature.descKey)}</p>
                </div>
              </Surface>
            );
          })}
        </div>
      </section>

      <section>
        <Surface variant="outline" padding="none" className="p-6 sm:p-7">
          <div className="flex items-center gap-2">
            <Database className="size-5 text-muted-foreground" />
            <h2 className="text-h3">{t(lang, "aboutSourcesTitle")}</h2>
          </div>
          <p className="mt-3 max-w-3xl text-body-sm text-muted-foreground">
            {t(lang, "aboutSourcesBody")}
          </p>
        </Surface>
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
