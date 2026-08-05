import type { Metadata } from "next";
import { LocalizedBreadcrumb } from "@/components/shared/localized-breadcrumb";
import { PageHeader } from "@/components/layout/page-header";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { FaqSection } from "@/components/shared/faq-section";
import { TIER_LIMITS, TRIAL_DAYS } from "@/lib/billing";
import { t } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";
import {
  SEO_PAGE_META,
  buildPricingFaq,
  buildPricingHeading,
  buildPricingIntro,
} from "@/lib/seo/copy/site";
import PricingClient from "./pricing-client";

export const metadata: Metadata = {
  title: SEO_PAGE_META.pricing.title,
  description: SEO_PAGE_META.pricing.description,
  alternates: { canonical: "/pricing" },
};

type PricingSearchParams = Promise<{
  checkout?: string | string[];
  selected?: string | string[];
  cancelled?: string | string[];
}>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : value?.[0];
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams: PricingSearchParams;
}) {
  const query = await searchParams;
  const lang = await getServerLanguage();
  const proAnswer = t(lang, "pricingFaqProA")
    .replace("{history}", String(TIER_LIMITS.PRO.priceHistoryDays))
    .replace("{cards}", String(TIER_LIMITS.PRO.portfolioCards))
    .replace("{portfolios}", String(TIER_LIMITS.PRO.portfolioCount))
    .replace("{alerts}", String(TIER_LIMITS.PRO.priceAlerts));

  // H1 + intro live here (server component) rather than inside PricingClient so
  // the keyword heading and the "what Meecard is" prose are in the first HTML
  // response for every user agent.
  const heading = buildPricingHeading(lang);
  const intro = buildPricingIntro(lang);
  const extraFaq = buildPricingFaq(lang, {
    freePortfolioCards: TIER_LIMITS.FREE.portfolioCards,
    freePortfolioCount: TIER_LIMITS.FREE.portfolioCount,
    freeWatchlistCards: TIER_LIMITS.FREE.watchlistCards,
    freePriceAlerts: TIER_LIMITS.FREE.priceAlerts,
    freePriceHistoryDays: TIER_LIMITS.FREE.priceHistoryDays,
  });

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Pricing", href: "/pricing" }])} />
      <LocalizedBreadcrumb items={[{ labelKey: "home", href: "/" }, { labelKey: "pricing" }]} />
      <PageHeader align="center" title={heading.title} description={heading.description} />
      <div className="mx-auto mb-10 max-w-2xl space-y-3 text-center">
        {intro.map((paragraph) => (
          <p key={paragraph} className="text-body-sm text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </div>
      <PricingClient
        checkoutPlan={firstParam(query.checkout)}
        selectedCheckoutPlan={firstParam(query.selected)}
        checkoutCancelled={firstParam(query.cancelled) === "true"}
      />
      <FaqSection title={t(lang, "guideHomeFaqHeading")} items={[
        {
          question: t(lang, "pricingFaqProQ"),
          answer: proAnswer,
        },
        { question: t(lang, "pricingFaqCancelQ"), answer: t(lang, "pricingFaqCancelA") },
        {
          question: t(lang, "pricingFaqTrialQ"),
          answer: t(lang, "pricingFaqTrialA").replace("{days}", String(TRIAL_DAYS)),
        },
        { question: t(lang, "pricingFaqFreeQ"), answer: t(lang, "pricingFaqFreeA") },
        ...extraFaq,
      ]} />
    </>
  );
}
