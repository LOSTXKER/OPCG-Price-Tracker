import type { Metadata } from "next";
import { Dices, LayoutGrid, Layers } from "lucide-react";

import { RelatedPages } from "@/components/shared/related-pages";
import { Surface } from "@/components/ui/surface";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { TOOL_PAGE_METADATA, buildCompareCopy } from "@/lib/seo/copy/tools";
import CompareClient from "./compare-client";

// Thai-first crawler copy; reading the language cookie here would opt this
// static route into dynamic rendering for no SEO gain.
const SEO_LANG = "TH" as const;

export const metadata: Metadata = buildPageMetadata({
  title: TOOL_PAGE_METADATA.compare.title,
  description: TOOL_PAGE_METADATA.compare.description,
  canonical: TOOL_PAGE_METADATA.compare.canonical,
});

export default function ComparePage() {
  const copy = buildCompareCopy(SEO_LANG);

  return (
    <>
      {/* Thai labels = what the visible Breadcrumb in CompareClient renders
          for the crawler's TH default — schema must match the UI. */}
      <JsonLd data={breadcrumbJsonLd([{ name: "หน้าแรก", href: "/" }, { name: "เปรียบเทียบการ์ด", href: "/opcg/compare" }])} />
      <CompareClient />

      {/* Server-rendered context: the tool is empty until the visitor picks
          cards, so without this the route had no crawlable copy at all.
          Full-width card row — the narrow prose column left half the page
          empty (owner call เบส 2026-08-07; same treatment as trending). */}
      <section className="mt-12 space-y-4">
        <div>
          <h2 className="text-h2">{copy.howTitle}</h2>
          <p className="mt-1.5 text-body-sm leading-relaxed text-muted-foreground">
            {copy.intro}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {copy.howTips.map((tip) => (
            <Surface key={tip.title} variant="outline" className="p-4">
              <p className="text-h5">{tip.title}</p>
              <p className="mt-1.5 text-body-sm leading-relaxed text-muted-foreground">
                {tip.body}
              </p>
            </Surface>
          ))}
        </div>
      </section>

      <RelatedPages
        items={[
          { href: "/opcg/sets", icon: Layers, title: "ชุดการ์ด", description: "ราคาการ์ดทุกใบแยกตามชุด" },
          { href: "/opcg/deck-calculator", icon: LayoutGrid, title: "สร้างเด็ค", description: "คำนวณราคาเด็ครวม" },
          { href: "/opcg/drop-calculator", icon: Dices, title: "คำนวณโอกาสออกการ์ด", description: "โอกาสเปิดเจอต่อกล่อง" },
        ]}
      />
    </>
  );
}
