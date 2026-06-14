"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, Eye, EyeOff, Plus, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Delta, ScrubChart, baht } from "../../_components/kit"
import { VersionSwitch } from "../../_components/chrome"
import { PF, PF_SERIES, HOLDINGS, TXNS } from "../../_components/mock"

type Tab = "overview" | "insights" | "transactions"
const TABS: { value: Tab; label: string }[] = [
  { value: "overview", label: "ภาพรวม" },
  { value: "insights", label: "วิเคราะห์" },
  { value: "transactions", label: "ธุรกรรม" },
]
const RANGES = ["1D", "1W", "1M", "3M", "1Y", "ALL"] as const

/* fabricate an avg-cost per holding (≈80% of current price) so the table can
   show ราคาเฉลี่ย + a real กำไร/ขาดทุน, mirroring the real assets-table. */
const ASSETS = HOLDINGS.map((h) => {
  const unit = Math.round(h.val / h.qty)
  const avgCost = Math.round(unit * 0.8)
  const cost = avgCost * h.qty
  const pnl = h.val - cost
  const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0
  return { ...h, unit, avgCost, cost, pnl, pnlPct }
})

export default function GroundedPortfolio() {
  const [tab, setTab] = useState<Tab>("overview")
  const [range, setRange] = useState<(typeof RANGES)[number]>("1M")
  const [scrub, setScrub] = useState<number | null>(null)
  const [hideBalance, setHideBalance] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const data = PF_SERIES[range]
  const [amt, pct] = PF.delta[range]
  const start = data[0]
  const scrubbing = scrub !== null
  const shownVal = scrubbing ? data[scrub] : PF.total
  const shownAmt = scrubbing ? data[scrub] - start : amt
  const shownPct = scrubbing ? ((data[scrub] - start) / start) * 100 : pct
  const mask = (node: React.ReactNode) => (hideBalance ? "••••••" : node)

  return (
    <div className="mx-auto max-w-7xl pb-12 px-0">
      <VersionSwitch vision="/proto/portfolio" real="/proto/real/portfolio" active="real" />

      {/* breadcrumb */}
      <nav className="flex items-center gap-1 px-4 pt-4 text-xs text-muted-foreground lg:px-8">
        <Link href="/proto" className="hover:text-foreground">หน้าแรก</Link>
        <span>/</span>
        <span className="text-foreground">พอร์ต</span>
      </nav>

      {/* page header: title + selector + actions */}
      <div className="flex flex-col gap-3 px-4 pt-3 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">พอร์ตของฉัน</h1>
          <PortfolioSelector open={pickerOpen} onOpenChange={setPickerOpen} />
        </div>
        <div className="flex items-center gap-2">
          <button className="ease-chrome inline-flex h-10 items-center gap-1.5 rounded-xl surface-2 hairline px-3.5 text-sm font-semibold text-foreground">
            <Share2 className="size-4" /> แชร์
          </button>
          <button
            className="ease-chrome inline-flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-sm font-bold"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            <Plus className="size-4" /> เพิ่มการ์ด
          </button>
        </div>
      </div>

      {/* tabs */}
      <div className="px-4 pt-4 lg:px-8">
        <div className="surface-2 hairline inline-flex rounded-full p-0.5">
          {TABS.map((tb) => {
            const active = tb.value === tab
            return (
              <button
                key={tb.value}
                onClick={() => setTab(tb.value)}
                className={cn(
                  "ease-chrome min-h-[44px] rounded-full px-4 text-sm font-semibold",
                  active ? "text-[var(--primary-foreground)]" : "text-muted-foreground hover:text-foreground",
                )}
                style={active ? { background: "var(--primary)" } : undefined}
              >
                {tb.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-4 pt-4 lg:px-8">
        {tab === "overview" && (
          <div className="space-y-5">
            {/* hero */}
            <section className="glow-honey relative overflow-hidden rounded-2xl surface-1 hairline p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  มูลค่าพอร์ต · {scrubbing ? "ในช่วง" : range}
                </p>
                <button
                  onClick={() => setHideBalance((v) => !v)}
                  aria-label={hideBalance ? "แสดงยอด" : "ซ่อนยอด"}
                  className="flex size-9 items-center justify-center rounded-lg surface-2 hairline text-muted-foreground hover:text-foreground"
                >
                  {hideBalance ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              <div key={scrubbing ? "s" + scrub : "t" + range} className={cn("mt-1.5", !scrubbing && "rise")}>
                <p className="tnum text-[42px] font-extrabold leading-none text-foreground lg:text-6xl">
                  {mask(baht(shownVal))}
                </p>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                {hideBalance ? (
                  <span className="text-sm text-muted-foreground">••••</span>
                ) : (
                  <Delta pct={shownPct} amount={baht(Math.abs(shownAmt))} size="lg" />
                )}
                <span className="text-sm text-muted-foreground">{scrubbing ? "จากต้นช่วง" : range}</span>
              </div>

              {/* chart */}
              <div className="mt-4">
                <ScrubChart
                  data={data}
                  up={pct >= 0}
                  height={180}
                  onScrub={setScrub}
                  onScrubEnd={() => setScrub(null)}
                />
                <div className="mt-2 flex justify-between sm:justify-start sm:gap-2">
                  {RANGES.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={cn(
                        "ease-chrome min-h-[44px] rounded-lg px-3 text-xs font-bold",
                        r === range ? "text-[var(--primary-foreground)]" : "text-muted-foreground",
                      )}
                      style={r === range ? { background: "var(--primary)" } : undefined}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* insights KPI row */}
            <Insights hideBalance={hideBalance} />

            {/* assets table */}
            <AssetsTable hideBalance={hideBalance} />
          </div>
        )}

        {tab === "insights" && (
          <div className="space-y-5">
            <Insights hideBalance={hideBalance} />
            <Allocation hideBalance={hideBalance} />
          </div>
        )}

        {tab === "transactions" && <Transactions hideBalance={hideBalance} />}
      </div>
    </div>
  )
}

/* ── portfolio selector (cosmetic dropdown + new) ───────────────────────── */
function PortfolioSelector({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const portfolios = ["พอร์ตหลัก", "Vintage SEC", "เก็บเก็ง"]
  return (
    <div className="relative">
      <button
        onClick={() => onOpenChange(!open)}
        className="ease-chrome inline-flex h-9 items-center gap-1.5 rounded-full surface-2 hairline px-3 text-sm font-semibold text-foreground"
      >
        พอร์ตหลัก
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-11 z-30 w-52 overflow-hidden rounded-xl surface-2 hairline p-1 frost">
          {portfolios.map((name, i) => (
            <button
              key={name}
              onClick={() => onOpenChange(false)}
              className="ease-chrome flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-[var(--p-honey-soft)]"
            >
              <span className="truncate">{name}</span>
              {i === 0 && <span className="size-2 rounded-full" style={{ background: "var(--primary)" }} />}
            </button>
          ))}
          <div className="my-1 h-px" style={{ background: "var(--p-hair)" }} />
          <button className="ease-chrome flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold" style={{ color: "var(--primary)" }}>
            <Plus className="size-4" /> พอร์ตใหม่
          </button>
        </div>
      )}
    </div>
  )
}

/* ── insights KPI quartet (flat cells) ──────────────────────────────────── */
function Insights({ hideBalance }: { hideBalance: boolean }) {
  const cells = [
    { l: "มูลค่าตลาด", v: baht(PF.total) },
    { l: "ต้นทุน", v: baht(PF.costBasis) },
    { l: "กำไร/ขาดทุนรวม", v: "+" + baht(PF.pl), up: true },
    { l: "ROI", v: "+" + PF.roi + "%", up: true },
  ]
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl surface-1 hairline sm:grid-cols-4">
      {cells.map((k) => (
        <div key={k.l} className="surface-1 p-4" style={{ boxShadow: "inset 0 0 0 0.5px var(--p-hair)" }}>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.l}</p>
          <p
            className="tnum mt-1 text-lg font-bold"
            style={{ color: k.up && !hideBalance ? "var(--price-up)" : "var(--foreground)" }}
          >
            {hideBalance ? "••••" : k.v}
          </p>
        </div>
      ))}
    </div>
  )
}

/* ── assets table — real columns: การ์ด · เกรด · จำนวน · ราคาเฉลี่ย · มูลค่า · กำไร/ขาดทุน ─ */
function AssetsTable({ hideBalance }: { hideBalance: boolean }) {
  return (
    <section className="overflow-hidden rounded-2xl surface-1 hairline">
      {/* toolbar header */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ boxShadow: "inset 0 -1px 0 0 var(--p-hair)" }}>
        <p className="text-sm font-bold text-foreground">รายการถือครอง</p>
        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums" style={{ background: "var(--p-honey-soft)", color: "var(--primary)" }}>
          {ASSETS.length} ใบ
        </span>
      </div>

      {/* sm+ : real table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground" style={{ boxShadow: "inset 0 -1px 0 0 var(--p-hair)" }}>
              <th className="py-3 pl-5 pr-3 font-semibold">การ์ด</th>
              <th className="py-3 pr-3 font-semibold">เกรด</th>
              <th className="py-3 pr-3 text-right font-semibold">จำนวน</th>
              <th className="py-3 pr-3 text-right font-semibold">ราคาเฉลี่ย</th>
              <th className="py-3 pr-3 text-right font-semibold">มูลค่า</th>
              <th className="py-3 pr-5 text-right font-semibold">กำไร/ขาดทุน</th>
            </tr>
          </thead>
          <tbody>
            {ASSETS.map((a) => (
              <tr key={a.code} className="ease-chrome group hover:bg-[var(--p-s1)]" style={{ boxShadow: "inset 0 -1px 0 0 var(--p-hair)" }}>
                <td className="py-3.5 pl-5 pr-3 align-middle">
                  <Link href="/proto/real/card-detail" className="flex items-center gap-3">
                    <FoilThumb code={a.code} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-[var(--primary)]">{a.name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{a.code}</p>
                    </div>
                  </Link>
                </td>
                <td className="py-3.5 pr-3 align-middle">
                  <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "var(--p-s2)", color: "var(--primary)" }}>{a.grade}</span>
                </td>
                <td className="tnum py-3.5 pr-3 text-right align-middle text-muted-foreground">×{a.qty}</td>
                <td className="tnum py-3.5 pr-3 text-right align-middle text-muted-foreground">{hideBalance ? "••••" : baht(a.avgCost)}</td>
                <td className="tnum py-3.5 pr-3 text-right align-middle font-bold text-foreground">{hideBalance ? "••••" : baht(a.val)}</td>
                <td className="py-3.5 pr-5 text-right align-middle">
                  {hideBalance ? (
                    <span className="tnum text-sm text-muted-foreground">••••</span>
                  ) : (
                    <Delta pct={a.pnlPct} amount={(a.pnl >= 0 ? "+" : "-") + baht(Math.abs(a.pnl))} className="justify-end" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* < sm : stacked list */}
      <div className="sm:hidden">
        {ASSETS.map((a) => (
          <Link
            key={a.code}
            href="/proto/real/card-detail"
            className="flex items-center gap-3 px-4 py-3"
            style={{ boxShadow: "inset 0 -1px 0 0 var(--p-hair)" }}
          >
            <FoilThumb code={a.code} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{a.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {a.code} · <span style={{ color: "var(--primary)" }}>{a.grade}</span> · ×{a.qty} · เฉลี่ย {hideBalance ? "••" : baht(a.avgCost)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="tnum text-sm font-bold text-foreground">{hideBalance ? "••••" : baht(a.val)}</p>
              {hideBalance ? (
                <span className="tnum text-xs text-muted-foreground">••••</span>
              ) : (
                <Delta pct={a.pnlPct} className="justify-end" />
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

/* ── allocation (insights tab extra — holdings breakdown) ───────────────── */
function Allocation({ hideBalance }: { hideBalance: boolean }) {
  const total = ASSETS.reduce((s, a) => s + a.val, 0)
  const sorted = [...ASSETS].sort((x, y) => y.val - x.val)
  return (
    <section className="rounded-2xl surface-1 hairline p-4 sm:p-5">
      <p className="mb-3 text-[11px] uppercase tracking-wider text-muted-foreground">การกระจายน้ำหนัก</p>
      <div className="space-y-2.5">
        {sorted.map((a) => {
          const wPct = total > 0 ? (a.val / total) * 100 : 0
          return (
            <div key={a.code} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-sm font-medium text-foreground">{a.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full surface-2">
                <div className="h-full rounded-full" style={{ width: `${Math.min(wPct, 100)}%`, background: "var(--primary)" }} />
              </div>
              <span className="tnum w-24 shrink-0 text-right text-sm font-semibold text-foreground">{hideBalance ? "••••" : baht(a.val)}</span>
              <span className="tnum w-12 shrink-0 text-right text-xs text-muted-foreground">{wPct.toFixed(0)}%</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ── transactions list ──────────────────────────────────────────────────── */
function Transactions({ hideBalance }: { hideBalance: boolean }) {
  const bought = TXNS.filter((tx) => tx.type === "buy").reduce((s, tx) => s + tx.price * tx.qty, 0)
  const sold = TXNS.filter((tx) => tx.type === "sell").reduce((s, tx) => s + tx.price * tx.qty, 0)
  const summary = [
    { l: "ซื้อรวม", v: baht(bought), color: "var(--price-down)" },
    { l: "ขายรวม", v: baht(sold), color: "var(--price-up)" },
    { l: "ธุรกรรม", v: String(TXNS.length), color: "var(--foreground)" },
  ]
  return (
    <div className="space-y-4">
      {/* summary strip */}
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl surface-1 hairline">
        {summary.map((s) => (
          <div key={s.l} className="surface-1 p-4" style={{ boxShadow: "inset 0 0 0 0.5px var(--p-hair)" }}>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.l}</p>
            <p className="tnum mt-1 text-base font-bold" style={{ color: s.l === "ธุรกรรม" || !hideBalance ? s.color : "var(--foreground)" }}>
              {s.l !== "ธุรกรรม" && hideBalance ? "••••" : s.v}
            </p>
          </div>
        ))}
      </div>

      {/* list */}
      <section className="overflow-hidden rounded-2xl surface-1 hairline">
        <div className="flex items-center gap-2 px-4 py-3" style={{ boxShadow: "inset 0 -1px 0 0 var(--p-hair)" }}>
          <p className="text-sm font-bold text-foreground">ธุรกรรม</p>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums" style={{ background: "var(--p-honey-soft)", color: "var(--primary)" }}>
            {TXNS.length}
          </span>
        </div>
        {TXNS.map((tx, i) => {
          const buy = tx.type === "buy"
          const total = tx.price * tx.qty
          return (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ boxShadow: "inset 0 -1px 0 0 var(--p-hair)" }}
            >
              <FoilThumb code={tx.code} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{tx.name}</p>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
                  <span
                    className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                    style={buy
                      ? { background: "rgba(255,122,107,0.12)", color: "var(--price-down)" }
                      : { background: "rgba(70,214,139,0.12)", color: "var(--price-up)" }}
                  >
                    {buy ? "ซื้อ" : "ขาย"}
                  </span>
                  <span className="tnum text-muted-foreground">
                    {tx.code} · ×{tx.qty} <span className="text-muted-foreground/60">@</span> {hideBalance ? "••" : baht(tx.price)}
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="tnum text-sm font-bold" style={{ color: buy ? "var(--price-down)" : "var(--price-up)" }}>
                  {hideBalance ? "••••" : (buy ? "-" : "+") + baht(total)}
                </p>
                <p className="tnum text-[11px] text-muted-foreground">{tx.date}</p>
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}

/* ── foil thumb ─────────────────────────────────────────────────────────── */
function FoilThumb({ code }: { code: string }) {
  return (
    <div
      className="relative aspect-[63/88] w-9 shrink-0 overflow-hidden rounded hairline"
      style={{ background: "linear-gradient(150deg,#241808 0%,#3c2a12 45%,#6d4f23 75%,#e9b970 120%)" }}
    >
      <span className="absolute inset-x-0 bottom-0 px-1 pb-0.5 text-[6px] font-bold uppercase tracking-wide text-white/70">{code}</span>
    </div>
  )
}
