"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ChevronDown,
  ChevronsUpDown,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Delta, baht } from "../_components/kit"
import { AdSlot } from "../_components/ads"
import { VersionSwitch } from "../_components/chrome"
import { MARKET, CARDS, type MarketRow } from "../_components/mock"

/* ── cosmetic toolbar state ──────────────────────────────────────────────── */
type Tab = "popular" | "gainers" | "losers"
type PriceMode = "JPY" | "THB"
type ViewMode = "table" | "grid"

const TABS: { id: Tab; label: string }[] = [
  { id: "popular", label: "ยอดนิยม" },
  { id: "gainers", label: "มาแรง" },
  { id: "losers", label: "ร่วงแรง" },
]

const CARD_HREF = "/proto/real/card-detail"

/* split point for the in-feed ad inside the table */
const AD_AFTER = 6

export default function ProtoRealHome() {
  const [tab, setTab] = useState<Tab>("popular")
  const [priceMode, setPriceMode] = useState<PriceMode>("JPY")
  const [view, setView] = useState<ViewMode>("table")
  const [search, setSearch] = useState("")

  const head = MARKET.slice(0, AD_AFTER)
  const tail = MARKET.slice(AD_AFTER)

  const gainers = [...MARKET].sort((a, b) => b.c24 - a.c24).slice(0, 3)
  const losers = [...MARKET].sort((a, b) => a.c24 - b.c24).slice(0, 3)
  const featured = CARDS[0]

  return (
    <div className="mx-auto max-w-7xl pb-12 px-0">
      <VersionSwitch vision="/proto" real="/proto/real" active="real" />

      {/* intro note */}
      <div className="px-4 pt-3 lg:px-8">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">ราคาตลาด</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          นี่คือเว็บจริงของคุณ — โครงเดิม (ตาราง screener + gainers/losers) ทา warm-premium
        </p>
      </div>

      {/* ── main screener panel ─────────────────────────────────────────── */}
      <div className="mt-4 px-4 lg:px-8">
        <div className="overflow-hidden rounded-2xl surface-1 hairline">
          {/* toolbar */}
          <div style={{ boxShadow: "inset 0 -1px 0 0 var(--p-hair)" }}>
            <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:flex-nowrap sm:px-4">
              {/* tabs (underline) */}
              <div className="-mb-2.5 flex shrink-0 items-center gap-1">
                {TABS.map((tb) => {
                  const active = tab === tb.id
                  return (
                    <button
                      key={tb.id}
                      type="button"
                      onClick={() => setTab(tb.id)}
                      className={cn(
                        "ease-chrome relative shrink-0 border-b-2 px-2.5 py-2.5 text-sm font-semibold",
                        active
                          ? "text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground",
                      )}
                      style={
                        active
                          ? { borderColor: "var(--primary)", color: "var(--foreground)" }
                          : undefined
                      }
                    >
                      {tb.label}
                    </button>
                  )
                })}
              </div>

              {/* search — sm+ inline */}
              <div className="relative hidden min-w-0 flex-1 sm:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นการ์ด · ชื่อ หรือเลข เช่น OP01-120"
                  className="h-10 w-full rounded-full surface-2 hairline pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* right cluster */}
              <div className="flex w-full shrink-0 items-center justify-end gap-1.5 sm:w-auto">
                {/* set picker (cosmetic) */}
                <button
                  type="button"
                  className="ease-chrome flex h-10 items-center gap-1.5 rounded-full surface-2 hairline px-3 text-sm font-semibold text-foreground"
                >
                  <span className="text-muted-foreground">เซ็ต</span>
                  ทั้งหมด
                  <ChevronDown className="size-4 text-muted-foreground" />
                </button>

                {/* price-mode segmented (JPY / THB) */}
                <div className="surface-2 hairline inline-flex h-10 items-center rounded-full p-0.5">
                  {(["JPY", "THB"] as PriceMode[]).map((m) => {
                    const active = priceMode === m
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPriceMode(m)}
                        className={cn(
                          "ease-chrome rounded-full px-3 py-1.5 text-xs font-bold",
                          active
                            ? "text-[var(--primary-foreground)]"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                        style={active ? { background: "var(--primary)" } : undefined}
                      >
                        {m}
                      </button>
                    )
                  })}
                </div>

                {/* filter */}
                <button
                  type="button"
                  className="ease-chrome flex h-10 items-center gap-1.5 rounded-full surface-2 hairline px-3 text-sm font-semibold text-foreground"
                >
                  <SlidersHorizontal className="size-4 text-muted-foreground" />
                  <span className="hidden md:inline">ตัวกรอง</span>
                </button>

                {/* view toggle */}
                <div className="surface-2 hairline inline-flex h-10 items-center rounded-full p-0.5">
                  {([
                    { v: "table", icon: List },
                    { v: "grid", icon: LayoutGrid },
                  ] as { v: ViewMode; icon: typeof List }[]).map(({ v, icon: Icon }) => {
                    const active = view === v
                    return (
                      <button
                        key={v}
                        type="button"
                        aria-label={v === "table" ? "Table view" : "Grid view"}
                        onClick={() => setView(v)}
                        className={cn(
                          "ease-chrome flex size-8 items-center justify-center rounded-full",
                          active
                            ? "text-[var(--primary-foreground)]"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                        style={active ? { background: "var(--primary)" } : undefined}
                      >
                        <Icon className="size-4" />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* mobile search row */}
            <div className="px-3 pb-2.5 pt-2.5 sm:hidden" style={{ boxShadow: "inset 0 1px 0 0 var(--p-hair)" }}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นการ์ด · ชื่อ หรือเลข"
                  className="h-10 w-full rounded-full surface-2 hairline pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ── MOBILE list (< sm) ──────────────────────────────────────── */}
          <div className="divide-y sm:hidden" style={{ borderColor: "var(--p-hair)" }}>
            {head.map((c) => (
              <MobileRow key={c.code} card={c} priceMode={priceMode} />
            ))}
            <div className="p-3">
              <AdSlot format="feed" />
            </div>
            {tail.map((c) => (
              <MobileRow key={c.code} card={c} priceMode={priceMode} />
            ))}
          </div>

          {/* ── DESKTOP table (sm+) ─────────────────────────────────────── */}
          <div className="hidden sm:block">
            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-12" />
                <col className="w-10" />
                <col />
                <col className="hidden w-[84px] md:table-column" />
                <col className="hidden w-[72px] sm:table-column" />
                <col className="w-[112px]" />
                <col className="w-[96px]" />
                <col className="hidden w-[88px] md:table-column" />
                <col className="hidden w-[88px] lg:table-column" />
              </colgroup>
              <thead className="sticky top-0 z-10 surface-2" style={{ boxShadow: "inset 0 -1px 0 0 var(--p-hair)" }}>
                <tr className="text-eyebrow text-muted-foreground">
                  <th className="py-2.5 pl-4 pr-0 font-medium" />
                  <th className="py-2.5 pl-1 pr-1 text-right font-medium">#</th>
                  <th className="py-2.5 pl-2 pr-3 font-medium">การ์ด</th>
                  <th className="hidden py-2.5 pr-3 font-medium md:table-cell">เซ็ต</th>
                  <th className="hidden py-2.5 pr-3 font-medium sm:table-cell">Rarity</th>
                  <SortTh label="ราคา" sortable />
                  <SortTh label="24h" sortable />
                  <th className="hidden py-2.5 pr-3 text-right font-medium md:table-cell">7d</th>
                  <th className="hidden py-2.5 pr-4 text-right font-medium lg:table-cell">30d</th>
                </tr>
              </thead>
              {/* first block */}
              <tbody>
                {head.map((c) => (
                  <DesktopRow key={c.code} card={c} priceMode={priceMode} />
                ))}
              </tbody>
            </table>

            {/* in-feed ad — a browse surface, so an ad slot is allowed here */}
            <div className="px-4 py-3" style={{ boxShadow: "inset 0 1px 0 0 var(--p-hair)" }}>
              <AdSlot format="banner" />
            </div>

            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-12" />
                <col className="w-10" />
                <col />
                <col className="hidden w-[84px] md:table-column" />
                <col className="hidden w-[72px] sm:table-column" />
                <col className="w-[112px]" />
                <col className="w-[96px]" />
                <col className="hidden w-[88px] md:table-column" />
                <col className="hidden w-[88px] lg:table-column" />
              </colgroup>
              <tbody>
                {tail.map((c) => (
                  <DesktopRow key={c.code} card={c} priceMode={priceMode} />
                ))}
              </tbody>
            </table>
          </div>

          {/* pagination footer (cosmetic) */}
          <div
            className="flex items-center justify-between gap-3 px-4 py-3"
            style={{ boxShadow: "inset 0 1px 0 0 var(--p-hair)" }}
          >
            <p className="text-xs text-muted-foreground">
              แสดง <span className="tnum text-foreground">1–{MARKET.length}</span> จาก{" "}
              <span className="tnum text-foreground">1,284</span> ใบ
            </p>
            <div className="flex items-center gap-1">
              <PageBtn label="‹" />
              <PageBtn label="1" active />
              <PageBtn label="2" />
              <PageBtn label="3" />
              <span className="px-1 text-xs text-muted-foreground">…</span>
              <PageBtn label="›" />
            </div>
          </div>
        </div>
      </div>

      {/* ── gainers / losers / featured ─────────────────────────────────── */}
      <div className="mt-5 grid gap-4 px-4 lg:grid-cols-3 lg:px-8">
        <MiniList title="มาแรง" rows={gainers} priceMode={priceMode} />
        <MiniList title="ร่วงแรง" rows={losers} priceMode={priceMode} />
        <FeaturedCard
          name={featured.name}
          code={featured.code}
          price={featured.price}
          pct={featured.pct}
          grad={featured.grad}
          priceMode={priceMode}
        />
      </div>
    </div>
  )
}

/* ── price helper (cosmetic JPY/THB toggle) ──────────────────────────────── */
function price(n: number, mode: PriceMode) {
  // MARKET prices are THB-scale; show ¥ at a cosmetic ~4.4x for the JPY look.
  return mode === "THB" ? baht(n) : "¥" + Math.round(n * 4.4).toLocaleString("en-US")
}

/* ── sortable header cell ────────────────────────────────────────────────── */
function SortTh({ label, sortable }: { label: string; sortable?: boolean }) {
  return (
    <th className="py-2.5 pr-3 text-right font-medium">
      <span className="inline-flex items-center gap-1">
        {label}
        {sortable && <ChevronsUpDown className="size-3 text-muted-foreground" />}
      </span>
    </th>
  )
}

/* ── foil thumb ──────────────────────────────────────────────────────────── */
function FoilThumb({ grad, className }: { grad: string; className?: string }) {
  return (
    <div
      style={{ background: grad }}
      className={cn("aspect-[63/88] shrink-0 rounded hairline", className)}
    />
  )
}

/* ── rarity pill ─────────────────────────────────────────────────────────── */
function RarityPill({ r }: { r: string }) {
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] font-bold"
      style={{ background: "var(--p-honey-soft)", color: "var(--primary)" }}
    >
      {r}
    </span>
  )
}

/* ── desktop table row ───────────────────────────────────────────────────── */
function DesktopRow({ card, priceMode }: { card: MarketRow; priceMode: PriceMode }) {
  return (
    <tr
      className="ease-chrome group hover:bg-[var(--p-s2)]"
      style={{ boxShadow: "inset 0 -1px 0 0 var(--p-hair)" }}
    >
      <td className="py-2 pl-4 pr-0">
        <Link href={CARD_HREF} className="block w-8">
          <FoilThumb grad={card.grad} className="w-8" />
        </Link>
      </td>
      <td className="tnum py-2 pl-1 pr-1 text-right text-xs text-muted-foreground">{card.rank}</td>
      <td className="py-2 pl-2 pr-3">
        <Link href={CARD_HREF} className="block min-w-0">
          <p className="truncate text-sm font-semibold text-foreground group-hover:text-[var(--primary)]">
            {card.name}
          </p>
          <p className="tnum truncate text-xs text-muted-foreground">{card.code}</p>
        </Link>
      </td>
      <td className="hidden py-2 pr-3 text-sm text-muted-foreground md:table-cell">{card.set}</td>
      <td className="hidden py-2 pr-3 sm:table-cell">
        <RarityPill r={card.rarity} />
      </td>
      <td className="tnum py-2 pr-3 text-right text-sm font-bold text-foreground">
        {price(card.price, priceMode)}
      </td>
      <td className="py-2 pr-3 text-right">
        <Delta pct={card.c24} />
      </td>
      <td className="hidden py-2 pr-3 text-right md:table-cell">
        <Delta pct={card.c7} />
      </td>
      <td className="hidden py-2 pr-4 text-right lg:table-cell">
        <Delta pct={card.c30} />
      </td>
    </tr>
  )
}

/* ── mobile stacked row ──────────────────────────────────────────────────── */
function MobileRow({ card, priceMode }: { card: MarketRow; priceMode: PriceMode }) {
  return (
    <Link
      href={CARD_HREF}
      className="ease-chrome flex items-center gap-3 px-3 py-2.5 active:bg-[var(--p-s2)]"
    >
      <span className="tnum w-5 shrink-0 text-right text-xs text-muted-foreground">{card.rank}</span>
      <FoilThumb grad={card.grad} className="w-9" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{card.name}</p>
        <p className="tnum truncate text-xs text-muted-foreground">
          {card.code} · {card.set} · {card.rarity}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="tnum text-sm font-bold text-foreground">{price(card.price, priceMode)}</p>
        <Delta pct={card.c24} className="justify-end text-xs" />
      </div>
    </Link>
  )
}

/* ── pagination button ───────────────────────────────────────────────────── */
function PageBtn({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "ease-chrome flex size-9 items-center justify-center rounded-lg text-sm font-semibold",
        active ? "text-[var(--primary-foreground)]" : "text-muted-foreground hover:text-foreground",
      )}
      style={active ? { background: "var(--primary)" } : undefined}
    >
      {label}
    </button>
  )
}

/* ── gainers / losers mini list ──────────────────────────────────────────── */
function MiniList({
  title,
  rows,
  priceMode,
}: {
  title: string
  rows: MarketRow[]
  priceMode: PriceMode
}) {
  return (
    <div className="overflow-hidden rounded-2xl surface-1 hairline">
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ boxShadow: "inset 0 -1px 0 0 var(--p-hair)" }}
      >
        <h2 className="text-h5 text-foreground">{title}</h2>
        <Link href="/proto/real" className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
          ดูทั้งหมด
        </Link>
      </div>
      <div>
        {rows.map((c, i) => (
          <Link
            key={c.code}
            href={CARD_HREF}
            className="ease-chrome flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--p-s2)]"
            style={i ? { boxShadow: "inset 0 1px 0 0 var(--p-hair)" } : undefined}
          >
            <FoilThumb grad={c.grad} className="w-7" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
              <p className="tnum truncate text-xs text-muted-foreground">{c.code}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="tnum text-sm font-bold text-foreground">{price(c.price, priceMode)}</p>
              <Delta pct={c.c24} className="justify-end text-xs" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ── featured card ───────────────────────────────────────────────────────── */
function FeaturedCard({
  name,
  code,
  price: p,
  pct,
  grad,
  priceMode,
}: {
  name: string
  code: string
  price: number
  pct: number
  grad: string
  priceMode: PriceMode
}) {
  return (
    <div className="overflow-hidden rounded-2xl surface-1 hairline">
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ boxShadow: "inset 0 -1px 0 0 var(--p-hair)" }}
      >
        <h2 className="text-h5 text-foreground">ราคาสูงสุด</h2>
        <span
          className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
          style={{ background: "var(--p-honey-soft)", color: "var(--primary)" }}
        >
          Featured
        </span>
      </div>
      <Link href={CARD_HREF} className="ease-chrome flex items-center gap-4 p-4 hover:bg-[var(--p-s2)]">
        <FoilThumb grad={grad} className="w-20" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-extrabold text-foreground">{name}</p>
          <p className="tnum truncate text-xs text-muted-foreground">{code}</p>
          <p className="tnum mt-2 text-2xl font-extrabold text-foreground">{price(p, priceMode)}</p>
          <div className="mt-1">
            <Delta pct={pct} />
          </div>
        </div>
      </Link>
    </div>
  )
}
