"use client"

import { SourceLogo } from "./source-logo"
import { formatByCurrency, formatUsdByCurrency, type Currency } from "@/lib/utils/currency"
import { relativeTime } from "@/lib/utils/time"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export type MarketEvidenceRow = {
  id: string
  source: string
  sourceLabel: string
  conditionLabel: string
  kindLabel: string
  priceJpy: number | null
  priceThb: number | null
  priceUsd: number | null
  updatedAt: string | null
  isReference?: boolean
}

function formatEvidencePrice(row: MarketEvidenceRow, currency: Currency) {
  if (row.priceUsd != null) return formatUsdByCurrency(row.priceUsd, currency)
  if (row.priceJpy != null) return formatByCurrency(row.priceJpy, currency, row.priceThb)
  return { primary: "—", secondary: "" }
}

export function MarketEvidence({
  listingRows,
  saleRows,
  currency,
  lang,
}: {
  listingRows: MarketEvidenceRow[]
  saleRows: MarketEvidenceRow[]
  currency: Currency
  lang: Language
}) {
  const groups = [
    {
      id: "listings",
      title: t(lang, "latestListings"),
      description: t(lang, "latestListingsDesc"),
      emptyTitle: t(lang, "noLatestListings"),
      rows: listingRows,
    },
    {
      id: "sales",
      title: t(lang, "latestSales"),
      description: t(lang, "latestSalesDesc"),
      emptyTitle: t(lang, "noLatestSales"),
      rows: saleRows,
    },
  ]

  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {groups.map((group) => (
        <div key={group.id} className="surface-1 rounded-2xl p-4 ring-1 ring-[var(--p-hair)] sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-h4">{group.title}</h2>
              <p className="text-meta mt-1">{group.description}</p>
            </div>
            {group.rows.length > 0 && (
              <span className="tnum rounded-full bg-foreground/[0.04] px-2 py-1 text-micro text-muted-foreground">
                {group.rows.length}
              </span>
            )}
          </div>

          {group.rows.length === 0 ? (
            <div className="mt-4 rounded-xl bg-foreground/[0.025] p-4">
              <p className="text-sm font-semibold text-foreground">{group.emptyTitle}</p>
              <p className="text-meta mt-1">{t(lang, "notEnoughDataYet")}</p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-border/20">
              {group.rows.map((row) => {
                const price = formatEvidencePrice(row, currency)
                return (
                  <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/50 ring-1 ring-[var(--p-hair)]">
                          <SourceLogo source={row.source} size={20} />
                        </span>
                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="truncate text-sm font-semibold text-foreground">{row.sourceLabel}</span>
                            {row.isReference && (
                              <span className="rounded-full bg-foreground/[0.06] px-1.5 py-0.5 text-overlay uppercase text-muted-foreground">
                                {t(lang, "referenceBadge")}
                              </span>
                            )}
                          </div>
                          <p className="text-meta mt-0.5">
                            {row.conditionLabel} · {relativeTime(row.updatedAt, lang)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="min-w-[92px] text-right">
                      <p className={cn("tnum text-sm font-semibold text-foreground", price.primary === "—" && "text-muted-foreground/40")}>
                        {price.primary}
                      </p>
                      {price.secondary && (
                        <p className="tnum text-meta mt-0.5">{price.secondary}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </section>
  )
}
