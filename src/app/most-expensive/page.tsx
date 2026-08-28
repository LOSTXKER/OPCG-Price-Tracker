import type { Metadata } from "next"

import { AdPageContentReady } from "@/components/ads/ad-audience-provider"
import { MostExpensiveClient } from "@/components/most-expensive/most-expensive-client"
import { FaqSection } from "@/components/shared/faq-section"
import { RelatedPages } from "@/components/shared/related-pages"
import { getMostExpensiveData } from "@/lib/data/most-expensive"
import { getCardName } from "@/lib/i18n"
import { JsonLd } from "@/lib/seo/json-ld-script"
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/json-ld"
import { buildPageMetadata } from "@/lib/seo/page-metadata"
import {
  mostExpensiveFaq,
  mostExpensiveMeta,
  mostExpensiveSectionHeadings,
  mostExpensiveTitle,
} from "@/lib/seo/copy/most-expensive"
import { Layers, LineChart, Sparkles } from "lucide-react"

/**
 * "การ์ดวันพีชที่แพงที่สุด" — the Thai SERP for this query is held by frozen news
 * listicles, so the whole point of this page is that it is regenerated from live
 * price data. ISR (not dynamic) so crawlers get cached HTML with a fast TTFB.
 */
export const revalidate = 1800

const FALLBACK_META = {
  title: "การ์ดวันพีชที่แพงที่สุด",
  // Description carries the second spelling "วันพีซ" (dual coverage), same as
  // mostExpensiveMeta. No "ทุกวัน" claim (owner ruling 2026-08-28) — prices
  // are not scraped on a schedule (demo site).
  description:
    "อันดับการ์ดวันพีซที่ราคาแพงที่สุดตอนนี้ จัดอันดับจากราคาตลาดจริง พร้อมเปลี่ยนแปลง 30 วัน",
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getMostExpensiveData()
  const top = data.cards[0]

  const meta = top
    ? mostExpensiveMeta({
        topName: getCardName("TH", top),
        topCode: top.baseCode ?? top.cardCode,
        topPriceJpy: top.priceJpy,
        count: data.cards.length,
      })
    : FALLBACK_META

  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    canonical: "/opcg/most-expensive",
    // Share preview shows today's #1 most expensive card instead of the
    // generic site-wide OG image (SEO round 2 — every share used to look
    // identical on LINE/Facebook).
    ogImage: top?.imageUrl ?? null,
  })
}

export default async function MostExpensivePage() {
  const data = await getMostExpensiveData()
  const top = data.cards[0]

  // Formatted on the server so the copy interpolates one stable date string
  // (React 19 forbids Date work during a client render).
  const updatedLabel = data.lastUpdated
    ? new Date(data.lastUpdated).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  const headings = mostExpensiveSectionHeadings("TH")
  const faqItems = top
    ? mostExpensiveFaq("TH", {
        topName: getCardName("TH", top),
        topCode: top.baseCode ?? top.cardCode,
        topPriceJpy: top.priceJpy,
        updatedLabel,
      })
    : []

  return (
    <>
      <AdPageContentReady />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "หน้าแรก", href: "/" },
          { name: mostExpensiveTitle("TH"), href: "/opcg/most-expensive" },
        ])}
      />
      {data.cards.length > 0 && (
        <JsonLd
          data={itemListJsonLd(
            mostExpensiveTitle("TH"),
            data.cards.map((card) => ({
              // Display name carries the PUBLIC code; the URL keeps the full
              // cardCode because that is the variant's real address.
              name: `${getCardName("TH", card)} (${card.baseCode ?? card.cardCode})`,
              url: `/opcg/cards/${card.cardCode}`,
              image: card.imageUrl,
            }))
          )}
        />
      )}

      <MostExpensiveClient data={data} updatedLabel={updatedLabel} />

      {faqItems.length > 0 && <FaqSection title={headings.faq} items={faqItems} />}

      <RelatedPages
        items={[
          {
            href: "/opcg/trending",
            icon: LineChart,
            title: "การ์ดมาแรงวันนี้",
            description: "ราคาขึ้น-ลงแรงสุดใน 24 ชั่วโมง 7 วัน และ 30 วัน",
          },
          {
            href: "/opcg/sets",
            icon: Layers,
            title: "ชุดการ์ดวันพีชทั้งหมด",
            description: "เลือกชุดแล้วดูราคาการ์ดทุกใบในชุดนั้น",
          },
          {
            href: "/guide/rarities",
            icon: Sparkles,
            title: "ความหายากการ์ดวันพีช",
            description: "SEC · Treasure Rare · Parallel ต่างกันยังไง แล้วทำไมราคาต่างกัน",
          },
        ]}
      />
    </>
  )
}
