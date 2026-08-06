import type { Metadata } from "next";

import { FaqSection } from "@/components/shared/faq-section";
import { prisma } from "@/lib/db";
import { raritySort } from "@/lib/constants/rarities";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import {
  TOOL_PAGE_METADATA,
  buildDropCalculatorFaq,
} from "@/lib/seo/copy/tools";
import DropCalculatorClient from "./drop-calculator-client";
import { DropRateExplainer, type AverageDropRate } from "./drop-rate-explainer";

// The averages below move only when a new set lands, so an hourly ISR window is
// plenty — and it keeps the DB out of the request path for crawlers.
export const revalidate = 3600;

// Thai-first crawler copy (doc/seo-content-plan.md §3.8): reading the language
// cookie here would opt this route out of ISR.
const SEO_LANG = "TH" as const;

export const metadata: Metadata = buildPageMetadata({
  title: TOOL_PAGE_METADATA.dropCalculator.title,
  description: TOOL_PAGE_METADATA.dropCalculator.description,
  canonical: TOOL_PAGE_METADATA.dropCalculator.canonical,
});

async function getAverageDropRates(): Promise<AverageDropRate[]> {
  const rows = await prisma.setDropRate.groupBy({
    by: ["rarity"],
    _avg: { avgPerBox: true, ratePerPack: true },
    _count: { _all: true },
  });

  return rows
    .map((row) => ({
      rarity: row.rarity,
      avgPerBox: row._avg.avgPerBox,
      ratePerPack: row._avg.ratePerPack,
      setCount: row._count._all,
    }))
    .sort((a, b) => raritySort(a.rarity, b.rarity));
}

export default async function DropCalculatorPage() {
  const rates = await getAverageDropRates();

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Drop Calculator", href: "/opcg/drop-calculator" }])} />
      <DropCalculatorClient />
      <DropRateExplainer lang={SEO_LANG} rates={rates} />
      <FaqSection items={buildDropCalculatorFaq(SEO_LANG)} />
    </>
  );
}
