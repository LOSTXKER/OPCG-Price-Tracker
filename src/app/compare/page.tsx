import type { Metadata } from "next";
import { Dices, LayoutGrid, Layers } from "lucide-react";

import { RelatedPages } from "@/components/shared/related-pages";
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
          Paragraphs render as paragraphs — they were <li> bullets before,
          which dressed three full sentences as a list (audit finding). */}
      <section className="mt-12 max-w-3xl space-y-3">
        <h2 className="text-h2">{copy.howTitle}</h2>
        <p className="text-body-sm leading-relaxed text-muted-foreground">{copy.intro}</p>
        {copy.howParagraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 24)} className="text-body-sm leading-relaxed text-muted-foreground">
            {paragraph}
          </p>
        ))}
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
