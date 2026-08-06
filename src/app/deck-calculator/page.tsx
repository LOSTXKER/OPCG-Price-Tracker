import type { Metadata } from "next";
import Link from "next/link";
import { Dices, GitCompareArrows, Layers } from "lucide-react";

import { LocalizedBreadcrumb } from "@/components/shared/localized-breadcrumb";
import { FaqSection } from "@/components/shared/faq-section";
import { RelatedPages } from "@/components/shared/related-pages";
import { Surface } from "@/components/ui/surface";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import {
  TOOL_PAGE_METADATA,
  buildDeckCalculatorCopy,
  buildDeckCalculatorFaq,
} from "@/lib/seo/copy/tools";
import DeckCalculatorClient from "./deck-calculator-client";

// Thai-first crawler copy; reading the language cookie here would opt this
// static route into dynamic rendering for no SEO gain.
const SEO_LANG = "TH" as const;

export const metadata: Metadata = buildPageMetadata({
  title: TOOL_PAGE_METADATA.deckCalculator.title,
  description: TOOL_PAGE_METADATA.deckCalculator.description,
  canonical: TOOL_PAGE_METADATA.deckCalculator.canonical,
});

export default function DeckCalculatorPage() {
  const copy = buildDeckCalculatorCopy(SEO_LANG);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Deck Calculator", href: "/opcg/deck-calculator" }])} />
      <LocalizedBreadcrumb items={[{ labelKey: "home", href: "/" }, { labelKey: "deckCalculatorNav" }]} />
      <DeckCalculatorClient />

      {/* Server-rendered context — the tool alone is numbers without meaning. */}
      <section className="mt-12 space-y-3">
        <h2 className="text-h2">{copy.costTitle}</h2>
        {copy.costParagraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 24)} className="text-body leading-relaxed">
            {paragraph}
          </p>
        ))}
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-h2">{copy.rulesTitle}</h2>
        <Surface variant="outline" className="divide-y divide-hair overflow-hidden">
          {copy.rules.map((rule) => (
            <div key={rule.term} className="px-5 py-4">
              <h3 className="text-h5">{rule.term}</h3>
              <p className="mt-1 text-body-sm text-muted-foreground">{rule.detail}</p>
            </div>
          ))}
        </Surface>
        <div className="space-y-1.5">
          <p className="text-body-sm text-muted-foreground">{copy.readNextIntro}</p>
          <ul className="space-y-1.5 text-body-sm">
            {copy.readNext.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-primary hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FaqSection items={buildDeckCalculatorFaq(SEO_LANG)} />

      <RelatedPages
        items={[
          { href: "/opcg/drop-calculator", icon: Dices, title: "คำนวณโอกาสออกการ์ด", description: "โอกาสเปิดเจอต่อซอง / กล่อง / คาตัน" },
          { href: "/opcg/sets", icon: Layers, title: "ชุดการ์ด", description: "ราคาการ์ดทุกใบแยกตามชุด" },
          { href: "/opcg/compare", icon: GitCompareArrows, title: "เปรียบเทียบ", description: "เทียบราคาการ์ดหลายใบ" },
        ]}
      />
    </>
  );
}
