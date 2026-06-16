"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"

import {
  CardListingsSection,
  type CardListing,
} from "@/components/cards/card-listings-section"
import { t, type Language } from "@/lib/i18n"
import { relativeTime } from "@/lib/utils/time"
import { cn } from "@/lib/utils"

import { Amount } from "./grade-value"
import { SourceLogo } from "./source-logo"
import { mockComps, mockSales30d } from "./mock"
import type { Stat } from "./grades"

export type CardDetailInfoTab = "comps" | "listings" | "population"

function SourceBadge({ s }: { s: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <SourceLogo source={s} size={18} />
      <span className="text-xs font-medium text-foreground">{s}</span>
    </span>
  )
}

const SAMPLE_POP = [
  { g: "PSA 10", n: 412, pct: 18 },
  { g: "PSA 9", n: 1180, pct: 52 },
  { g: "PSA 8", n: 480, pct: 21 },
  { g: "≤ PSA 7", n: 205, pct: 9 },
]

/**
 * Lower-section tabs (VISION §5.1): evidence/research below the chart.
 * Listings can be omitted because live asks already have a dedicated trade rail.
 * Comps/Population are clean prototype mock; Listings are real when enabled.
 */
export function CardDetailInfoTabs({
  cardCode,
  cardName,
  listings,
  compBase,
  gradeLabel,
  currency,
  lastSale,
  latestUpdatedAt,
  tabs = ["comps", "listings", "population"],
  activeTab,
  onTabChange,
  lang,
}: {
  cardCode: string
  cardName: string
  listings: CardListing[]
  compBase: number | null
  gradeLabel: string
  currency: "JPY" | "USD"
  lastSale?: Stat | null
  latestUpdatedAt?: string | null
  /** Which tabs to show. Defaults to all three; pass a subset to hide one
   *  (e.g. drop "listings" when active asks live in a sibling rail). */
  tabs?: CardDetailInfoTab[]
  activeTab?: CardDetailInfoTab
  onTabChange?: (tab: CardDetailInfoTab) => void
  lang: Language
}) {
  const [internalTab, setInternalTab] = useState<CardDetailInfoTab>(tabs[0] ?? "comps")
  const candidateTab = activeTab ?? internalTab
  const tab = tabs.includes(candidateTab) ? candidateTab : tabs[0] ?? "comps"
  const setTab = (nextTab: CardDetailInfoTab) => {
    if (!tabs.includes(nextTab)) return
    onTabChange?.(nextTab)
    if (activeTab == null) setInternalTab(nextTab)
  }

  const comps = mockComps(compBase, gradeLabel, 7, { firstSale: lastSale })
  const totalSales = mockSales30d(compBase)
  const baseTime = latestUpdatedAt ? new Date(latestUpdatedAt).getTime() : null
  const compDate = (days: number) => (baseTime ? new Date(baseTime - days * 86_400_000).toISOString() : null)
  const popTotal = SAMPLE_POP.reduce((a, b) => a + b.n, 0)
  const gemPct = SAMPLE_POP.find((r) => r.g === "PSA 10")?.pct ?? null

  const TABS: [CardDetailInfoTab, string][] = (
    [
      ["comps", t(lang, "tabComps")],
      ["listings", t(lang, "tabListings")],
      ["population", t(lang, "tabPopulation")],
    ] as [CardDetailInfoTab, string][]
  ).filter(([k]) => tabs.includes(k))

  return (
    <section className="mt-2">
      <div className="no-sb flex gap-1 overflow-x-auto" role="group" aria-label={t(lang, "tabComps")}>
        {TABS.map(([k, label]) => {
          const active = tab === k
          return (
            <button
              key={k}
              type="button"
              aria-pressed={active}
              onClick={() => setTab(k)}
              className={cn(
                "ease-chrome shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                active
                  ? "surface-2 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className="mt-3">
        {tab === "comps" && (
          <div className="hairline-t">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-2 pt-4">
              <p className="text-eyebrow">{gradeLabel}</p>
              <p className="text-meta">{t(lang, "receiptMatchesLastSold")}</p>
            </div>
            {comps.map((c, i) => (
              <div key={i} className={cn("flex items-center gap-3 px-4 py-3", i > 0 && "hairline-t")}>
                <SourceBadge s={c.source} />
                <span className="text-xs text-muted-foreground">{c.grade}</span>
                {i === 0 && (
                  <span className="surface-2 rounded px-1.5 py-0.5 text-overlay font-semibold uppercase text-muted-foreground">
                    {t(lang, "lastSold")}
                  </span>
                )}
                <Amount
                  jpy={c.priceJpy ?? (currency === "JPY" ? c.price : null)}
                  usd={c.priceUsd ?? (currency === "USD" ? c.price : null)}
                  size="stat"
                  className="ml-auto text-foreground"
                />
                <span className="tnum w-14 shrink-0 text-right text-xs text-muted-foreground/60">
                  {relativeTime(compDate(c.whenDays), lang)}
                </span>
              </div>
            ))}
            <button
              type="button"
              className="hairline-t ease-chrome flex w-full items-center justify-center gap-1 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
              {t(lang, "viewAll")} {totalSales.toLocaleString()} <ChevronRight className="size-3" aria-hidden />
            </button>
          </div>
        )}

        {tab === "listings" && (
          <CardListingsSection cardCode={cardCode} cardName={cardName} listings={listings} />
        )}

        {tab === "population" && (
          <div className="hairline-t space-y-3 pt-4">
            <div className="flex items-end justify-between gap-3">
              <p className="text-meta flex items-center gap-1.5">
                PSA Population · {popTotal.toLocaleString()} graded
                <span className="text-overlay uppercase text-muted-foreground/40">{t(lang, "sampleLabel")}</span>
              </p>
              {gemPct != null && (
                <div className="shrink-0 text-right">
                  <p className="tnum text-2xl font-extrabold leading-none text-foreground">{gemPct}%</p>
                  <p className="text-meta mt-0.5">{t(lang, "gemRate")}</p>
                </div>
              )}
            </div>
            <div className="space-y-2.5">
              {SAMPLE_POP.map((r) => (
                <div key={r.g} className="flex items-center gap-3">
                  <span className="w-16 text-xs font-semibold text-foreground">{r.g}</span>
                  <div className="surface-2 h-2.5 flex-1 overflow-hidden rounded-full">
                    <div className="h-full rounded-full bg-foreground/30" style={{ width: `${r.pct}%` }} />
                  </div>
                  <span className="tnum w-20 shrink-0 text-right text-xs text-muted-foreground">
                    {r.n.toLocaleString()}
                    <span className="ml-1 text-muted-foreground/40">{r.pct}%</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
