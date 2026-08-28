"use client"

import { type Language } from "@/lib/i18n"
import { buildHomeHeroHeading } from "@/lib/seo/copy/home"
import { formatCount } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

/**
 * The compact hero both variants share: same H1 as production, but the 4-5 line
 * lead paragraph splits into ONE short sentence plus a tabular meta line — the
 * counts and the freshness date stay visible, they just stop costing ~100px.
 * Copy here is proto-local; the real migration re-derives it under the SEO
 * copy rules in lib/seo/copy/home.ts.
 */

const LEAD: Record<Language, string> = {
  TH: "ราคากลาง Raw และ PSA 10 อ้างอิงตลาดญี่ปุ่น",
  EN: "Raw and PSA 10 market prices, based on the Japanese market",
  JP: "Raw／PSA 10相場・日本市場ベース",
}

function metaLine(
  lang: Language,
  totalCards: number,
  totalSets: number,
  updated: string | null,
): string {
  const cards = formatCount(totalCards)
  const sets = formatCount(totalSets)
  switch (lang) {
    case "EN":
      return `${cards} cards · ${sets} sets${updated ? ` · Updated ${updated}` : ""}`
    case "JP":
      return `全${sets}弾・${cards}枚${updated ? ` · 最終更新 ${updated}` : ""}`
    default:
      return `${cards} ใบ · ${sets} ชุด${updated ? ` · อัปเดตล่าสุด ${updated}` : ""}`
  }
}

export function ProtoHero({
  totalCards,
  totalSets,
  updatedLabels,
}: {
  totalCards: number
  totalSets: number
  updatedLabels: Record<Language, string> | null
}) {
  const lang = useUIStore((s) => s.language)

  return (
    <section className="pt-4">
      <h1 className="text-h1 text-foreground">{buildHomeHeroHeading(lang)}</h1>
      <p className="mt-1 text-body-sm text-muted-foreground">{LEAD[lang]}</p>
      <p className="mt-1.5 text-meta tabular-nums">
        {metaLine(lang, totalCards, totalSets, updatedLabels?.[lang] ?? null)}
      </p>
    </section>
  )
}
