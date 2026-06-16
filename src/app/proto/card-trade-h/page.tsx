"use client"

import { Fragment, useMemo, useState, useSyncExternalStore, type PointerEvent } from "react"
import Link from "next/link"
import { ArrowUpRight, BadgeCheck, Bell, ExternalLink, GitCompareArrows, Info, Maximize2, Plus, Share2, ShoppingBag, Star } from "lucide-react"

import { buildGradeData, defaultGradeKey, GRADE_TIERS, type GradeKey } from "@/components/cards/card-detail/grades"
import { Delta } from "@/components/cards/card-detail/grade-value"
import { GradeLogo } from "@/components/cards/card-detail/grade-logo"
import { EditionToggle, type Edition } from "@/components/cards/card-detail/edition-toggle"
import { CardDetailSpecs } from "@/components/cards/card-detail-specs"
import { CardEffectText } from "@/components/cards/card-effect-text"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { Breadcrumb } from "@/components/shared/breadcrumb"
import { useUIStore } from "@/stores/ui-store"
import { getLocale } from "@/lib/i18n"
import { compactDisplayValue, formatDisplayValue, jpyToDisplayValue, usdToDisplayValue, type Currency } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"
import { ASKS, CARDS, EFFECT } from "../_components/mock"
import { baht } from "../_components/kit"

const UPDATED_AT = "2026-06-10T00:00:00.000Z"
const card = {
  id: 0, cardCode: "OP13-118_p3", baseCode: "OP13-118", cardType: "LEADER", color: "RED", colorEn: "Red",
  rarity: "SEC", isParallel: true, cost: null as number | null, power: 5000, counter: null as number | null,
  life: 5, attribute: "Strike", trait: "Straw Hat Crew / The Four Emperors", imageUrl: null as string | null,
}

const RANGES = ["1เดือน", "3เดือน", "1ปี", "ทั้งหมด"] as const
type Range = (typeof RANGES)[number]
const RANGE_CFG: Record<Range, { len: number; lo: number; span: number; phase: number }> = {
  "1เดือน": { len: 30, lo: 0.9225, span: 30, phase: 0.4 },
  "3เดือน": { len: 60, lo: 0.8, span: 90, phase: 1.1 },
  "1ปี": { len: 80, lo: 0.52, span: 365, phase: 0.3 },
  "ทั้งหมด": { len: 110, lo: 0.3, span: 760, phase: 0.8 },
}
function genSeries(latest: number, up: boolean, range: Range) {
  const cfg = RANGE_CFG[range]
  const start = up ? latest * cfg.lo : latest * (2 - cfg.lo)
  const amp = latest * 0.035
  return Array.from({ length: cfg.len }, (_, i) => {
    const t = i / (cfg.len - 1)
    const trend = start + (latest - start) * t
    const env = Math.sin(t * Math.PI)
    const wave = Math.sin(t * Math.PI * 2 * 2.2 + cfg.phase) * amp * env
    const wob = Math.sin(t * Math.PI * 2 * 2.2 * 3.7 + cfg.phase * 1.3) * amp * 0.45 * env
    return Math.max(1, Math.round(trend + wave + wob))
  })
}
function useMounted() {
  return useSyncExternalStore(() => () => {}, () => true, () => false)
}

function FramelessChart({ points, scrub, onScrub, onScrubEnd, up, currency, dateAt }: {
  points: number[]; scrub: number | null; onScrub: (i: number) => void; onScrubEnd: () => void; up: boolean; currency: Currency; dateAt: (i: number) => string
}) {
  const width = 1000, height = 300, padTop = 14, padRight = 66, padBottom = 22, padLeft = 2
  const plotW = width - padLeft - padRight, plotH = height - padTop - padBottom
  const min = Math.min(...points), max = Math.max(...points), span = Math.max(1, max - min)
  const yMin = min - span * 0.12, yMax = max + span * 0.12
  const color = up ? "var(--price-up)" : "var(--price-down)"
  const x = (i: number) => padLeft + (plotW * i) / (points.length - 1)
  const y = (v: number) => padTop + ((yMax - v) / Math.max(1, yMax - yMin)) * plotH
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)} ${y(p).toFixed(2)}`).join(" ")
  const areaPath = `${linePath} L${x(points.length - 1).toFixed(2)} ${height - padBottom} L${padLeft} ${height - padBottom} Z`
  const gridVals = [0, 0.5, 1].map((n) => yMax - (yMax - yMin) * n)
  const active = scrub != null ? Math.min(points.length - 1, Math.max(0, scrub)) : points.length - 1
  const lastX = x(points.length - 1), lastY = y(points[points.length - 1])
  const scrubAt = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    onScrub(Math.round(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)) * (points.length - 1)))
  }
  return (
    <svg role="img" aria-label="ประวัติราคา" viewBox={`0 0 ${width} ${height}`} className="block h-[230px] w-full touch-pan-y select-none sm:h-[300px] lg:h-[360px]"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); scrubAt(e) }}
      onPointerMove={(e) => { if (e.buttons === 1 || scrub != null) scrubAt(e) }}
      onPointerUp={onScrubEnd} onPointerCancel={onScrubEnd} onPointerLeave={onScrubEnd}>
      <defs>
        <linearGradient id="h-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.26" />
          <stop offset="62%" stopColor={color} stopOpacity="0.07" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridVals.map((v) => {
        const gy = y(v)
        return (
          <g key={v}>
            <line x1={padLeft} x2={width - padRight} y1={gy} y2={gy} stroke="var(--border)" strokeDasharray="2 8" strokeOpacity="0.16" />
            <text x={width - padRight + 8} y={gy + 4} fill="var(--muted-foreground)" opacity="0.55" fontSize="17">{compactDisplayValue(v, currency)}</text>
          </g>
        )
      })}
      <path d={areaPath} fill="url(#h-area)" />
      <path d={linePath} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      <line x1={x(active)} x2={x(active)} y1={padTop} y2={height - padBottom} stroke="var(--muted-foreground)" strokeDasharray="3 5" strokeOpacity={scrub == null ? "0" : "0.4"} />
      <circle cx={lastX} cy={lastY} r="9" fill={color} opacity="0.18" />
      <circle cx={lastX} cy={lastY} r="4.5" fill={color} stroke="var(--background)" strokeWidth="3" />
      {scrub != null && (
        <>
          <circle cx={x(active)} cy={y(points[active])} r="5" fill={color} stroke="var(--background)" strokeWidth="3" />
          <g transform={`translate(${Math.min(width - 210, Math.max(20, x(active) - 70))} ${Math.max(20, y(points[active]) - 54)})`}>
            <rect width="166" height="40" rx="9" fill="var(--p-s2)" stroke="var(--p-hair)" />
            <text x="11" y="16" fill="var(--muted-foreground)" fontSize="16">{dateAt(active)}</text>
            <text x="11" y="33" fill={color} fontSize="19" fontWeight="700">{formatDisplayValue(points[active], currency)}</text>
          </g>
        </>
      )}
    </svg>
  )
}

function GradeLadder({ gradeData, selected, onSelect, currency }: {
  gradeData: ReturnType<typeof buildGradeData>; selected: GradeKey; onSelect: (k: GradeKey) => void; currency: Currency
}) {
  return (
    <div role="group" aria-label="เลือกเกรด" className="no-sb -mx-1 flex items-stretch gap-1 overflow-x-auto px-1">
      {GRADE_TIERS.map((tier, i) => {
        const d = gradeData[tier.key]
        const active = tier.key === selected
        const disabled = !d.hasData && !active
        const graded = tier.family !== "raw"
        const num = graded ? tier.short.replace(/^(PSA|BGS|CGC)\s*/i, "") : tier.short
        const dividerBefore = graded && GRADE_TIERS[i - 1]?.family === "raw"
        const hint = d.value.usd != null ? usdToDisplayValue(d.value.usd, currency) : d.value.jpy != null ? jpyToDisplayValue(d.value.jpy, currency) : null
        return (
          <Fragment key={tier.key}>
            {dividerBefore && <span aria-hidden className="mx-0.5 w-px shrink-0 self-stretch bg-[var(--p-hair)]" />}
            <button type="button" aria-pressed={active} disabled={disabled} onClick={() => onSelect(tier.key)}
              className={cn("ease-chrome flex shrink-0 flex-col items-start gap-0.5 rounded-lg px-2.5 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground", disabled && "cursor-not-allowed opacity-40")}>
              <span className="flex items-center gap-1 text-xs font-semibold">{graded && <GradeLogo family={tier.family} size={12} />}{num}</span>
              <span className={cn("text-overlay tnum", active ? "text-foreground/75" : "text-muted-foreground/50")}>{hint != null ? formatDisplayValue(hint, currency) : "—"}</span>
            </button>
          </Fragment>
        )
      })}
    </div>
  )
}

const GRADERS = [
  { family: "psa" as const, name: "PSA", tiers: [{ g: "10", price: 488955, pop: 243 }, { g: "9", price: 244478, pop: 48 }, { g: "8", price: 156466, pop: 12 }] },
  { family: "bgs" as const, name: "BGS", tiers: [{ g: "10", price: 562299, pop: 30 }, { g: "9.5", price: 305000, pop: 18 }, { g: "9", price: 214000, pop: 9 }] },
  { family: "cgc" as const, name: "CGC", tiers: [{ g: "10", price: 392000, pop: 6 }, { g: "9.5", price: 240000, pop: 4 }, { g: "9", price: 168000, pop: 3 }] },
]
const GRADER_ROWS = GRADERS.flatMap((gr) => gr.tiers.map((t) => ({ family: gr.family, label: `${gr.name} ${t.g}`, price: t.price, pop: t.pop }))).sort((a, b) => b.price - a.price)
const SOLD_ROWS = [
  { source: "SNKRDUNK", verified: true, grade: "PSA 10", price: 470463, when: "6 วันก่อน" },
  { source: "eBay", verified: true, grade: "PSA 10", price: 464476, when: "7 วันก่อน" },
  { source: "Yuyu-tei", verified: true, grade: "PSA 10", price: 480022, when: "9 วันก่อน" },
  { source: "TCGplayer", verified: false, grade: "PSA 10", price: 501869, when: "11 วันก่อน" },
]
const ASK_ROWS = [
  { source: "SNKRDUNK", verified: true, grade: "PSA 10", price: 505000, when: "2 ชม." },
  { source: "eBay", verified: true, grade: "PSA 10", price: 518000, when: "5 ชม." },
  { source: "TCGplayer", verified: false, grade: "PSA 10", price: 529000, when: "1 วัน" },
]
const HI30 = 494375, LO30 = 444629, SOLD_AVG = 476418, VOL30 = 37, POP = 243, GEM = 78.9
const HAIR = "border-t border-[var(--p-hair)]"

function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--p-hair)] py-2.5">
      <span className="text-meta min-w-0 truncate">{label}</span>
      <span className={cn("tnum shrink-0 text-right text-sm font-semibold", accent ? "text-[var(--price-up)]" : "text-foreground")}>{value}</span>
    </div>
  )
}

export default function CmcDashboardProto() {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const mounted = useMounted()
  const gradeData = useMemo(() => buildGradeData({ rawAnchorJpy: 430000, rawAnchorThb: 90300, psa10AskUsd: 15600, psa10SoldUsd: 15200, rawLastSoldUsd: 14800, rawDelta30d: 8.4 }), [])
  const [selectedGrade, setSelectedGrade] = useState<GradeKey>(() => defaultGradeKey(gradeData))
  const [edition, setEdition] = useState<Edition>("JP")
  const [range, setRange] = useState<Range>("1เดือน")
  const [scrub, setScrub] = useState<number | null>(null)
  const [provTab, setProvTab] = useState<"sold" | "asks">("sold")
  const [fav, setFav] = useState(false)
  const [alerted, setAlerted] = useState(false)

  const datum = gradeData[selectedGrade]
  const gradeLabel = datum.tier.label
  const latest = (datum.value.usd != null ? usdToDisplayValue(datum.value.usd, currency) : datum.value.jpy != null ? jpyToDisplayValue(datum.value.jpy, currency) : null) ?? 0
  const up = (datum.delta30d?.pct ?? 0) >= 0
  const series = useMemo(() => (mounted ? genSeries(latest, up, range) : []), [mounted, latest, up, range])
  const restingDelta = (up ? 1 / RANGE_CFG[range].lo - 1 : 1 / (2 - RANGE_CFG[range].lo) - 1) * 100
  const shownVal = scrub != null && series[scrub] != null ? series[scrub] : latest
  const shownDelta = scrub != null && series[0] ? ((series[scrub!] - series[0]) / series[0]) * 100 : restingDelta
  const dateAt = (i: number) => {
    const ref = new Date(UPDATED_AT).getTime()
    if (Number.isNaN(ref) || series.length < 2) return ""
    const days = (RANGE_CFG[range].span * (series.length - 1 - i)) / (series.length - 1)
    return new Date(ref - days * 86_400_000).toLocaleDateString(getLocale(lang), { day: "numeric", month: "short" })
  }
  const markerPct = Math.max(0, Math.min(100, ((latest - LO30) / (HI30 - LO30)) * 100))
  const lowestAsk = Math.min(...ASK_ROWS.map((r) => r.price))
  const meecardAsks = ASKS.filter((a) => a.grade === gradeLabel).sort((a, b) => a.price - b.price)
  const meecardLowest = meecardAsks.length ? meecardAsks[0].price : null
  const provRows = provTab === "sold" ? SOLD_ROWS : ASK_ROWS
  const TABS = ["ภาพรวม", "ราคาตามเกรด", "แหล่งอ้างอิง", "ขายบน Meecard", "สเปก"]
  const ANCHORS = ["overview", "ledger", "sources", "market", "specs"]

  return (
    <div className="mx-auto max-w-7xl overflow-x-clip scroll-smooth px-4 pb-28 pt-4 lg:pb-16">
      {/* utility row */}
      <div className="flex items-center justify-between gap-3">
        <Breadcrumb items={[{ label: "เซ็ต", href: "/proto/browse" }, { label: "OP13", href: "/proto/browse" }, { label: card.baseCode }]} />
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setFav((v) => !v)} aria-label="รายการโปรด" className={cn("ease-chrome flex size-9 items-center justify-center rounded-full hover:bg-foreground/5", fav ? "text-[var(--primary)]" : "text-muted-foreground")}><Star className={cn("size-4", fav && "fill-current")} /></button>
          <button type="button" aria-label="แชร์" className="ease-chrome flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5"><Share2 className="size-4" /></button>
          <button type="button" aria-label="เปรียบเทียบ" className="ease-chrome flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5"><GitCompareArrows className="size-4" /></button>
          <button type="button" onClick={() => setAlerted((v) => !v)} aria-label="แจ้งเตือนราคา" className={cn("ease-chrome flex size-9 items-center justify-center rounded-full hover:bg-foreground/5", alerted ? "text-[var(--primary)]" : "text-muted-foreground")}><Bell className={cn("size-4", alerted && "fill-current")} /></button>
        </div>
      </div>

      {/* ── TOP 3-COL: identity · price instrument · market stats ─────────────── */}
      <div className="mt-5 grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
        {/* COL 1 — identity */}
        <div id="overview" className="min-w-0 scroll-mt-16">
          <div className="flex items-start gap-3 lg:flex-col">
            <div className="relative aspect-[63/88] w-24 shrink-0 overflow-hidden rounded-xl hairline lg:w-32" style={{ background: "linear-gradient(150deg,#241808 0%,#3c2a12 35%,#6d4f23 62%,#e9b970 115%)" }}>
              <div className="absolute inset-x-0 bottom-0 p-2"><p className="text-overlay font-semibold uppercase text-white/70">{card.baseCode}</p></div>
            </div>
            <div className="min-w-0 lg:mt-3">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Monkey D. Luffy (118)</h1>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-meta">
                <RarityBadge rarity={card.rarity} size="sm" />
                <span>· {card.baseCode}</span>
                <span aria-hidden className="size-2 rounded-full bg-red-500" />
              </div>
              <a href="#sources" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">ดูประวัติการขาย <ArrowUpRight className="size-3" /></a>
            </div>
          </div>
        </div>

        {/* COL 2 — price instrument */}
        <div className="min-w-0">
          <div className="space-y-2">
            <EditionToggle value={edition} onChange={setEdition} enAvailable={false} />
            <GradeLadder gradeData={gradeData} selected={selectedGrade} onSelect={setSelectedGrade} currency={currency} />
          </div>
          <div key={`${selectedGrade}-${range}`} className="rise mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
            <span className="tnum text-display leading-none text-foreground">{mounted ? formatDisplayValue(shownVal, currency) : formatDisplayValue(latest, currency)}</span>
            <span className="flex items-center pb-1"><Delta pct={shownDelta} lang={lang} size="lg" /><span className="ml-1.5 text-meta text-foreground/60">{scrub != null ? dateAt(scrub) : range}</span></span>
          </div>
          <p className="text-meta mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>ราคากลาง · {edition} · {gradeLabel}</span><span className="text-muted-foreground/40">·</span>
            <a href="#sources" className="inline-flex items-center gap-1 hover:text-foreground">median ของ 3 แหล่ง <Info className="size-3.5" aria-hidden /></a>
            <span className="text-muted-foreground/40">·</span><span className="text-muted-foreground/60">อัปเดต 2 ชม.</span>
          </p>
          <div className="mt-3 max-w-sm">
            <div className="relative h-1.5 rounded-full bg-foreground/10">
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${markerPct}%`, background: "var(--price-up)", opacity: 0.5 }} />
              <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background" style={{ left: `${markerPct}%`, background: "var(--price-up)" }} />
            </div>
            <div className="mt-1 flex justify-between text-overlay text-muted-foreground"><span className="tnum">ต่ำสุด · {baht(LO30)}</span><span className="tnum">สูงสุด · {baht(HI30)}</span></div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href={`/marketplace?cardCode=${card.cardCode}`} className="ease-chrome inline-flex items-center gap-1.5 rounded-xl px-6 py-3 text-sm font-bold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}><ShoppingBag className="size-4" aria-hidden /> ซื้อบน Meecard</Link>
            <span className="text-meta">{meecardLowest != null ? `ต่ำสุด ${baht(meecardLowest)} · ${meecardAsks.length} รายการ` : "ยังไม่มีรายการขาย"}</span>
          </div>
        </div>

        {/* COL 3 — market stats (flat rows) */}
        <div className={cn("min-w-0 lg:pl-2", HAIR, "lg:border-t-0")}>
          <p className="text-eyebrow mb-1 hidden lg:block">สถิติตลาด</p>
          <StatRow label="ขายล่าสุด" value={baht(SOLD_AVG)} />
          <StatRow label="ตั้งขายต่ำสุด" value={baht(lowestAsk)} />
          <StatRow label="ช่วง 30 วัน" value={`${compactDisplayValue(LO30, currency)} – ${compactDisplayValue(HI30, currency)}`} />
          <StatRow label="ปริมาณ 30 วัน" value={`${VOL30} รายการ`} />
          <StatRow label={`ประชากร ${gradeLabel}`} value={POP.toLocaleString()} />
        </div>
      </div>

      {/* TABS */}
      <nav className="no-sb mt-7 flex gap-5 overflow-x-auto border-t border-[var(--p-hair)]">
        {TABS.map((t, i) => (
          <a key={t} href={`#${ANCHORS[i]}`} className={cn("shrink-0 border-b-2 py-2.5 text-sm font-semibold", i === 0 ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{t}</a>
        ))}
      </nav>

      {/* ── MIDDLE 2-COL: chart (wide) · grade ladder rail (narrow) ───────────── */}
      <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* chart */}
        <div id="chart" className="min-w-0 scroll-mt-16">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-eyebrow">ประวัติราคา · {gradeLabel}</p>
            <div className="flex items-center gap-3">
              <div className="inline-flex gap-0.5 rounded-full bg-foreground/[0.045] p-0.5 ring-1 ring-[var(--p-hair)]">
                {RANGES.map((rg) => (
                  <button key={rg} type="button" aria-pressed={rg === range} onClick={() => { setScrub(null); setRange(rg) }} className={cn("ease-chrome rounded-full px-2.5 py-1.5 text-xs font-semibold", rg === range ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>{rg}</button>
                ))}
              </div>
              <button type="button" className="hidden items-center gap-1 text-meta hover:text-foreground sm:inline-flex"><Maximize2 className="size-3.5" /></button>
            </div>
          </div>
          {mounted ? <FramelessChart points={series} scrub={scrub} onScrub={setScrub} onScrubEnd={() => setScrub(null)} up={up} currency={currency} dateAt={dateAt} /> : <div className="h-[230px] sm:h-[300px] lg:h-[360px]" aria-hidden />}
        </div>

        {/* grade ledger rail */}
        <div id="ledger" className="min-w-0 scroll-mt-16">
          <div className="mb-2 flex items-end justify-between gap-2">
            <p className="text-eyebrow">ราคาตามเกรด</p>
            <span className="text-overlay text-muted-foreground">Gem {GEM}%</span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 border-b border-[var(--p-hair)] pb-1.5 text-overlay uppercase text-muted-foreground/70">
            <span>เกรด</span><span className="text-right">ราคากลาง</span><span className="w-9 text-right">pop</span>
          </div>
          {GRADER_ROWS.slice(0, 5).map((row) => {
            const isSel = row.label === gradeLabel
            return (
              <button key={row.label} type="button" className={cn("ease-chrome grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 border-b border-[var(--p-hair)] py-2 text-left hover:bg-foreground/[0.03]", isSel && "bg-foreground/[0.04]")}>
                <span className="flex min-w-0 items-center gap-1.5"><GradeLogo family={row.family} size={13} /><span className="truncate text-xs font-semibold text-foreground">{row.label}</span></span>
                <span className="tnum text-right text-xs font-bold text-foreground">{baht(row.price)}</span>
                <span className="tnum w-9 text-right text-overlay text-muted-foreground">{row.pop}</span>
              </button>
            )
          })}
          <a href="#" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">ดูทุกเกรด ({GRADER_ROWS.length}) <ArrowUpRight className="size-3" /></a>
        </div>
      </div>

      {/* ── FULL-WIDTH below ─────────────────────────────────────────────────── */}
      {/* แหล่งอ้างอิง */}
      <section id="sources" className="mt-10 scroll-mt-16">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-h3">แหล่งอ้างอิง</h2><span className="text-meta">ราคากลาง = median ของ 3 แหล่ง · 30 วัน</span>
        </div>
        <div className="mb-1 flex gap-4">
          {([["sold", "ขายไปแล้ว"], ["asks", "ประกาศขาย"]] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setProvTab(id)} aria-pressed={provTab === id} className={cn("border-b-2 pb-1.5 text-sm font-semibold", provTab === id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{label}</button>
          ))}
        </div>
        <div className="grid gap-x-10 sm:grid-cols-2">
          {provRows.map((r, i) => (
            <a key={i} href="#" className="ease-chrome flex items-center gap-3 border-b border-[var(--p-hair)] py-3 hover:bg-foreground/[0.03]">
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5"><span className="text-sm font-semibold text-foreground">{r.source}</span>{r.verified && <span className="inline-flex items-center gap-0.5 text-overlay text-muted-foreground"><BadgeCheck className="size-3" style={{ color: "var(--price-up)" }} /> ยืนยัน</span>}</span>
                <span className="text-meta">{r.grade} · {r.when}{provTab === "asks" ? " ที่แล้ว" : ""}</span>
              </span>
              <span className="tnum shrink-0 text-sm font-bold text-foreground">{baht(r.price)}</span>
              <ExternalLink className="size-3.5 shrink-0 text-muted-foreground/40" />
            </a>
          ))}
        </div>
      </section>

      {/* ขายบน Meecard */}
      <section id="market" className="mt-10 scroll-mt-16">
        <h2 className="text-h3 mb-3">ขายอยู่บน Meecard</h2>
        <div className={HAIR}>
          {meecardAsks.length === 0 ? <p className="text-meta py-6 text-center">ยังไม่มีคนลงขายเกรดนี้</p> : meecardAsks.slice(0, 3).map((a) => (
            <div key={a.id} className="flex items-center gap-3 border-b border-[var(--p-hair)] py-3">
              <span className="min-w-0 flex-1"><span className="flex items-center gap-1 text-sm font-semibold text-foreground">{a.seller}{a.verified && <BadgeCheck className="size-3.5" style={{ color: "var(--price-up)" }} />}</span><span className="text-meta">★ {a.rating.toFixed(1)} · {a.grade}</span></span>
              <span className="tnum text-sm font-bold text-foreground">{baht(a.price)}</span>
              <Link href={`/marketplace?cardCode=${card.cardCode}`} className="ease-chrome rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: "var(--p-honey-soft)", color: "var(--primary)" }}>ซื้อ</Link>
            </div>
          ))}
        </div>
      </section>

      {/* สเปก */}
      <section id="specs" className="mt-10 scroll-mt-16">
        <h2 className="text-h3 mb-3">ข้อมูลการ์ด</h2>
        <CardDetailSpecs card={card} lang={lang} />
        <div className="mt-3" style={{ boxShadow: "inset 3px 0 0 0 color-mix(in srgb, var(--primary) 40%, transparent)" }}>
          <div className="pl-4"><p className="text-eyebrow mb-1.5">เอฟเฟกต์</p><CardEffectText text={EFFECT} /></div>
        </div>
      </section>

      {/* related */}
      <section className="mt-10">
        <h2 className="text-h3 mb-3">การ์ดอื่นในเซ็ต OP13</h2>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          {CARDS.slice(0, 6).map((c) => (
            <Link key={c.code} href="/proto/card-trade-h" className="group flex flex-col gap-1.5 text-center">
              <div className="surface-2 relative flex aspect-[63/88] w-full items-center justify-center overflow-hidden rounded-xl hairline group-hover:ring-2 group-hover:ring-primary/30"><span className="text-overlay uppercase text-muted-foreground/40">{c.set}</span></div>
              <div><RarityBadge rarity={c.rarity} size="sm" /><p className="tnum mt-0.5 text-xs font-semibold text-foreground">{baht(c.price)}</p></div>
            </Link>
          ))}
        </div>
      </section>

      {/* mobile sticky buy bar */}
      <div className="frost fixed inset-x-0 bottom-0 z-50 lg:hidden" style={{ boxShadow: "inset 0 1px 0 0 var(--p-hair)" }}>
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
          <div className="min-w-0"><p className="text-overlay uppercase text-muted-foreground">{gradeLabel} · Meecard</p><p className="tnum text-base font-extrabold leading-none text-foreground">{meecardLowest != null ? baht(meecardLowest) : formatDisplayValue(latest, currency)}</p></div>
          <button type="button" aria-label="เพิ่มเข้าพอร์ต" className="ease-chrome surface-1 ring-inset flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-[var(--p-hair)] text-muted-foreground"><Plus className="size-5" /></button>
          <Link href={`/marketplace?cardCode=${card.cardCode}`} className="ease-chrome ml-auto flex max-w-[200px] flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}><ShoppingBag className="size-4" /> ซื้อ</Link>
        </div>
      </div>
    </div>
  )
}
