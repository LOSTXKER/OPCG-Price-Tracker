import type { Metadata } from "next";
import { LocalizedBreadcrumb } from "@/components/shared/localized-breadcrumb";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { FaqSection } from "@/components/shared/faq-section";
import { TIER_LIMITS, TRIAL_DAYS } from "@/lib/billing";
import { t } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";
import PricingClient from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing Plans",
  description:
    "Choose a Meecard plan that fits your needs. Free, Pro and Pro+ tiers with price alerts, portfolio analytics and more.",
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

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Pricing", href: "/pricing" }])} />
      <LocalizedBreadcrumb items={[{ labelKey: "home", href: "/" }, { labelKey: "pricing" }]} />
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
      ]} />
    </>
  );
}
