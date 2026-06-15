"use client"

import { useState } from "react"
import Link from "next/link"
import { BadgeCheck, BellPlus, ChevronRight, Minus, Plus, Store } from "lucide-react"

import { formatDisplayValue, type Currency } from "@/lib/utils/currency"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { OWNED, type Ask } from "./mock"

/* ── inline portfolio (Collectr's "Adding to: Main") — our minimal, no gold ──── */

function Stepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        aria-label="ลดจำนวน"
        disabled={value <= 0}
        onClick={() => onChange(Math.max(0, value - 1))}
        className="ease-chrome surface-1 hairline flex size-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="tnum w-5 text-center text-sm font-bold text-foreground">{value}</span>
      <button
        type="button"
        aria-label="เพิ่มจำนวน"
        onClick={() => onChange(value + 1)}
        className="ease-chrome surface-1 hairline flex size-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}

/**
 * "My portfolio" for THIS card — itemized per grade, because one card is held
 * across many grades/conditions at once (PSA 10 + Raw A + …). The quick-add is
 * tied to the grade currently SELECTED in the chart, so "which grade am I
 * adding" is never ambiguous (the old dual ดิบ/เกรด stepper was). Full per-copy
 * management (cost basis etc.) lives on the /portfolio page.
 */
export function OwnershipPanel({
  selectedGradeLabel,
  selectedValue,
  currency,
}: {
  selectedGradeLabel: string
  selectedValue: number | null
  currency: Currency
}) {
  const [qty, setQty] = useState(1)
  const totalValue = OWNED.reduce((a, h) => a + h.value * h.qty, 0)
  const totalCost = OWNED.reduce((a, h) => a + h.cost * h.qty, 0)
  const pl = totalValue - totalCost
  const plPct = totalCost ? (pl / totalCost) * 100 : 0
  const up = pl >= 0
  const plColor = up ? "var(--price-up)" : "var(--price-down)"

  return (
    <div className="surface-1 hairline rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-eyebrow">พอร์ตของฉัน</p>
        <p className="tnum text-sm font-bold text-foreground">{formatDisplayValue(totalValue, currency)}</p>
      </div>

      {OWNED.length > 0 ? (
        <>
          <p className="mt-0.5 flex items-center gap-1 text-xs" style={{ color: plColor }}>
            <span aria-hidden>{up ? "▲" : "▼"}</span>
            <span className="tnum">
              {up ? "+" : "−"}
              {formatDisplayValue(Math.abs(pl), currency)} ({Math.abs(plPct).toFixed(1)}%)
            </span>
          </p>
          <div className="mt-3 space-y-2.5">
            {OWNED.map((h) => (
              <div key={h.grade} className="flex items-center gap-2">
                <span className="surface-2 rounded px-1.5 py-0.5 text-overlay text-muted-foreground">{h.grade}</span>
                <span className="text-meta tnum">×{h.qty}</span>
                <span className="tnum ml-auto text-sm font-semibold text-foreground">
                  {formatDisplayValue(h.value * h.qty, currency)}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-meta mt-2">ยังไม่มีใบนี้ในพอร์ต</p>
      )}

      {/* quick-add — bound to the grade selected in the chart (no ambiguity) */}
      <div className="hairline-t mt-3 flex items-center justify-between gap-2 pt-3">
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-foreground">เพิ่ม {selectedGradeLabel}</span>
          <span className="text-meta tnum">
            {selectedValue != null ? formatDisplayValue(selectedValue, currency) : "—"} / ใบ
          </span>
        </span>
        <Stepper value={qty} onChange={(n) => setQty(Math.max(1, n))} />
      </div>
      <button
        type="button"
        className="ease-chrome mt-3 flex w-full items-center justify-center rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        เพิ่มเข้าพอร์ต
      </button>
    </div>
  )
}

/* ── shop / affiliate rail (Collectr's "Shop") — minimal rows, hairline-divided ─ */

/**
 * Active asks on OUR marketplace — the present-tense complement to the center
 * "recent sales" tab (which is settled PAST sales). Framed "buy one now":
 * lowest-first, a live dot, a best-ask strip, neutral affordances (no gold —
 * reserved for the page's single Buy button). Falls back to a calm empty state
 * (this is an early marketplace, usually empty) that points to notify / list.
 */
export function MeecardAsksRail({
  cardCode,
  asks,
  currency,
  lang,
}: {
  cardCode: string
  asks: Ask[]
  currency: Currency
  lang: Language
}) {
  const marketHref = `/marketplace?cardCode=${encodeURIComponent(cardCode)}`
  const sellHref = `/seller/listings/new?cardCode=${encodeURIComponent(cardCode)}`

  if (asks.length === 0) {
    return (
      <div className="surface-1 hairline overflow-hidden rounded-2xl">
        <p className="text-eyebrow px-4 pt-4">{t(lang, "sellingNow")}</p>
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <span className="surface-2 flex size-10 items-center justify-center rounded-full text-muted-foreground">
            <Store className="size-4" aria-hidden />
          </span>
          <p className="text-sm font-semibold text-foreground">{t(lang, "noActiveListings")}</p>
          <p className="text-meta">{t(lang, "noActiveListingsDesc")}</p>
          <div className="mt-1 flex w-full flex-col gap-2">
            <button
              type="button"
              className="ease-chrome inline-flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted/30"
            >
              <BellPlus className="size-4" aria-hidden /> {t(lang, "notifyWhenListed")}
            </button>
            <Link
              href={sellHref}
              className="ease-chrome inline-flex items-center justify-center rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted/30"
            >
              {t(lang, "listThisCard")}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const best = asks[0]
  const rows = asks.slice(0, 3)
  const extra = asks.length - rows.length

  return (
    <div className="surface-1 hairline overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between px-4 pt-4">
        <p className="text-eyebrow">
          {t(lang, "sellingNow")} <span className="text-meta tnum">({asks.length})</span>
        </p>
        <span className="inline-flex items-center gap-1">
          <span aria-hidden className="size-1.5 rounded-full" style={{ background: "var(--price-up)" }} />
          <span className="text-micro text-muted-foreground">{t(lang, "liveLabel")}</span>
        </span>
      </div>

      {/* best ask — the cheapest way to own it now (neither center tab states this) */}
      <div className="hairline-t mt-3 flex items-center justify-between gap-2 px-4 py-3">
        <span className="text-eyebrow">{t(lang, "lowestAsk")}</span>
        <span className="flex items-center gap-2">
          <span className="surface-2 rounded px-1.5 py-0.5 text-overlay text-muted-foreground">{best.grade}</span>
          <span className="text-h4 tnum text-foreground">{formatDisplayValue(best.price, currency)}</span>
        </span>
      </div>

      {rows.map((a, i) => (
        <Link
          key={a.id}
          href={marketHref}
          className={cn(
            "ease-chrome flex items-center gap-3 px-4 py-3 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
            i === 0 ? "hairline-t" : "hairline-t",
          )}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-foreground">{a.seller}</span>
            <span className="text-meta inline-flex items-center gap-1">
              {a.grade} · ★ {a.rating.toFixed(1)}
              {a.verified && <BadgeCheck className="size-3" style={{ color: "var(--price-up)" }} aria-hidden />}
            </span>
          </span>
          <span className="ml-auto shrink-0 text-right">
            <span className="block text-sm font-semibold tnum text-foreground">{formatDisplayValue(a.price, currency)}</span>
            {a.qty > 1 && <span className="text-overlay text-muted-foreground">มี {a.qty} ใบ</span>}
          </span>
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/40" aria-hidden />
        </Link>
      ))}

      <Link
        href={marketHref}
        className="hairline-t ease-chrome flex items-center justify-center gap-1 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        {extra > 0 ? `+${extra} · ` : ""}
        {t(lang, "viewAllListings")} <ChevronRight className="size-3" aria-hidden />
      </Link>
    </div>
  )
}
