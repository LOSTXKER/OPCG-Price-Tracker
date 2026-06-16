"use client"

import { Fragment, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  BadgeCheck,
  Bell,
  ExternalLink,
  GitCompareArrows,
  Info,
  Plus,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Star,
} from "lucide-react"

import { buildGradeData, defaultGradeKey, GRADE_TIERS, type GradeKey } from "@/components/cards/card-detail/grades"
import { Delta } from "@/components/cards/card-detail/grade-value"
import { GradeLogo } from "@/components/cards/card-detail/grade-logo"
import { CardChart } from "@/components/cards/card-detail/card-chart"
import { EditionToggle, type Edition } from "@/components/cards/card-detail/edition-toggle"
import { CardDetailSpecs } from "@/components/cards/card-detail-specs"
import { CardEffectText } from "@/components/cards/card-effect-text"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { Breadcrumb } from "@/components/shared/breadcrumb"
import { useUIStore } from "@/stores/ui-store"
import { jpyToDisplayValue, usdToDisplayValue, formatDisplayValue } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"
import { ASKS, CARDS, EFFECT } from "../_components/mock"
import { baht } from "../_components/kit"

const UPDATED_AT = "2026-06-10T00:00:00.000Z"

const card = {
  id: 0,
  cardCode: "OP13-118_p3",
  baseCode: "OP13-118",
  cardType: "LEADER",
  color: "RED",
  colorEn: "Red",
  rarity: "SEC",
  isParallel: true,
  cost: null as number | null,
  power: 5000,
  counter: null as number | null,
  life: 5,
  attribute: "Strike",
  trait: "Straw Hat Crew / The Four Emperors",
  imageUrl: null as string | null,
}

/* ── per-grader ledger (the collector payoff — "is grading worth it?") ──────── */
type LedgerTier = { g: string; price: number; pop: number }
type Grader = { family: "psa" | "bgs" | "cgc"; name: string; tiers: LedgerTier[] }
const GRADERS: Grader[] = [
  { family: "psa", name: "PSA", tiers: [{ g: "10", price: 488955, pop: 243 }, { g: "9", price: 244478, pop: 48 }, { g: "8", price: 156466, pop: 12 }] },
  { family: "bgs", name: "BGS", tiers: [{ g: "10", price: 562299, pop: 30 }, { g: "9.5", price: 305000, pop: 18 }, { g: "9", price: 214000, pop: 9 }] },
  { family: "cgc", name: "CGC", tiers: [{ g: "10", price: 392000, pop: 6 }, { g: "9.5", price: 240000, pop: 4 }, { g: "9", price: 168000, pop: 3 }] },
]
const RAW_REF = 90300 // Raw A reference for the spread badge

/* ── reference-source rows (Provenance — external, dated, credible) ────────── */
const SOLD_ROWS = [
  { source: "SNKRDUNK", verified: true, grade: "PSA 10", price: 470463, when: "6 วันก่อน" },
  { source: "eBay", verified: true, grade: "PSA 10", price: 464476, when: "7 วันก่อน" },
  { source: "Yuyu-tei", verified: true, grade: "PSA 10", price: 480022, when: "9 วันก่อน" },
  { source: "TCGplayer", verified: false, grade: "PSA 10", price: 501869, when: "11 วันก่อน" },
  { source: "Cardmarket", verified: false, grade: "PSA 10", price: 508952, when: "13 วันก่อน" },
]
const ASK_ROWS = [
  { source: "SNKRDUNK", verified: true, grade: "PSA 10", price: 505000, when: "อัปเดต 2 ชม." },
  { source: "eBay", verified: true, grade: "PSA 10", price: 518000, when: "อัปเดต 5 ชม." },
  { source: "TCGplayer", verified: false, grade: "PSA 10", price: 529000, when: "อัปเดต 1 วัน" },
]
const SOLD_AVG = 476418 // headline "ขายล่าสุด" reconciles to newest credible window

/* ── feature CTA (ghost, never gold) ───────────────────────────────────────── */
function FeatureCta({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "ease-chrome surface-1 ring-inset inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1 ring-[var(--p-hair)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span className={cn(active && "text-[var(--primary)]")}>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

/* ── STEP 2 grade ladder — flattened Raw·PSA·BGS·CGC with price hints ───────── */
function GradeLadder({
  gradeData,
  selected,
  onSelect,
  currency,
}: {
  gradeData: ReturnType<typeof buildGradeData>
  selected: GradeKey
  onSelect: (k: GradeKey) => void
  currency: "THB" | "JPY" | "USD"
}) {
  return (
    <div role="group" aria-label="เลือกเกรด" className="no-sb -mx-1 flex items-stretch gap-1.5 overflow-x-auto px-1 pb-0.5">
      {GRADE_TIERS.map((tier, i) => {
        const d = gradeData[tier.key]
        const active = tier.key === selected
        const disabled = !d.hasData && !active
        const graded = tier.family !== "raw"
        const num = graded ? tier.short.replace(/^(PSA|BGS|CGC)\s*/i, "") : tier.short
        const dividerBefore = graded && GRADE_TIERS[i - 1]?.family === "raw"
        const hint =
          d.value.usd != null
            ? usdToDisplayValue(d.value.usd, currency)
            : d.value.jpy != null
              ? jpyToDisplayValue(d.value.jpy, currency)
              : null
        return (
          <Fragment key={tier.key}>
            {dividerBefore && <span aria-hidden className="mx-0.5 w-px shrink-0 self-stretch" style={{ background: "var(--p-hair)" }} />}
            <button
              type="button"
              aria-pressed={active}
              aria-label={tier.label}
              disabled={disabled}
              onClick={() => onSelect(tier.key)}
              className={cn(
                "ease-chrome ring-inset flex shrink-0 flex-col items-start gap-0.5 rounded-xl px-2.5 py-1.5 text-left",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]",
                active
                  ? "bg-foreground/15 text-foreground ring-1 ring-foreground/35"
                  : "surface-1 ring-1 ring-[var(--p-hair)] text-muted-foreground hover:text-foreground",
                disabled && "cursor-not-allowed opacity-40",
              )}
            >
              <span className="flex items-center gap-1 text-xs font-semibold">
                {graded && <GradeLogo family={tier.family} size={13} />}
                {num}
              </span>
              <span className={cn("text-overlay tnum", active ? "text-foreground/80" : "text-muted-foreground/55")}>
                {hint != null ? formatDisplayValue(hint, currency) : "—"}
              </span>
            </button>
          </Fragment>
        )
      })}
    </div>
  )
}

export default function ProvenanceDeskProto() {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const gradeData = useMemo(
    () =>
      buildGradeData({
        rawAnchorJpy: 430000,
        rawAnchorThb: 90300,
        psa10AskUsd: 15600,
        psa10SoldUsd: 15200,
        rawLastSoldUsd: 14800,
        rawDelta30d: 8.4,
      }),
    [],
  )
  const [selectedGrade, setSelectedGrade] = useState<GradeKey>(() => defaultGradeKey(gradeData))
  const [edition, setEdition] = useState<Edition>("JP")
  const [foil, setFoil] = useState(true)
  const [provTab, setProvTab] = useState<"sold" | "asks">("sold")
  const [fav, setFav] = useState(false)
  const [alert, setAlert] = useState(false)

  const displayName = "Monkey D. Luffy (118)"
  const datum = gradeData[selectedGrade]
  const gradeLabel = datum.tier.label
  const unitValue =
    datum.value.usd != null
      ? usdToDisplayValue(datum.value.usd, currency)
      : datum.value.jpy != null
        ? jpyToDisplayValue(datum.value.jpy, currency)
        : null
  const lowestAsk = Math.min(...ASK_ROWS.map((r) => r.price))
  const meecardAsks = ASKS.filter((a) => a.grade === gradeLabel).sort((a, b) => a.price - b.price)
  const meecardLowest = meecardAsks.length ? meecardAsks[0].price : null
  const spreadPct = unitValue != null ? Math.round(((unitValue - RAW_REF) / RAW_REF) * 100) : null

  const TABS = [
    { id: "overview", label: "ภาพรวม" },
    { id: "chart", label: "ชาร์ต" },
    { id: "ledger", label: "ราคาตามเกรด" },
    { id: "sources", label: "แหล่งอ้างอิง" },
    { id: "specs", label: "สเปก" },
  ]

  const provRows = provTab === "sold" ? SOLD_ROWS : ASK_ROWS

  return (
    <div className="mx-auto max-w-7xl scroll-smooth px-4 pb-28 pt-4 lg:pb-12">
      {/* ── TOP UTILITY BAR — breadcrumb + 5 feature CTAs (none gold) ─────────── */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Breadcrumb
          items={[
            { label: "เซ็ต", href: "/proto/browse" },
            { label: "OP13 · Carrying on His Will", href: "/proto/browse" },
            { label: card.baseCode },
          ]}
        />
        <div className="no-sb -mx-1 flex items-center gap-1.5 overflow-x-auto px-1">
          <FeatureCta icon={<Star className={cn("size-3.5", fav && "fill-current")} />} label="รายการโปรด" active={fav} onClick={() => setFav((v) => !v)} />
          <FeatureCta icon={<Share2 className="size-3.5" />} label="แชร์" />
          <FeatureCta icon={<GitCompareArrows className="size-3.5" />} label="เปรียบเทียบ" />
          <FeatureCta icon={<Plus className="size-3.5" />} label="เพิ่มเข้าพอร์ต" />
          <FeatureCta icon={<Bell className={cn("size-3.5", alert && "fill-current")} />} label="แจ้งเตือนราคา" active={alert} onClick={() => setAlert((v) => !v)} />
        </div>
      </div>

      {/* ── SCROLL-SPY TAB STRIP (anchors, never gates) ──────────────────────── */}
      <div className="frost sticky top-0 z-20 -mx-4 mb-5 px-4" style={{ boxShadow: "inset 0 -1px 0 0 var(--p-hair)" }}>
        <nav className="no-sb flex gap-1 overflow-x-auto py-2">
          {TABS.map((t, i) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className={cn(
                "ease-chrome shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
                i === 0 ? "surface-2 text-foreground ring-1 ring-[var(--p-hair)]" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-y-6 lg:flex-row lg:items-start lg:gap-x-7">
        {/* ── LEFT RAIL — identity · transact · specs (sticky) ────────────────── */}
        <div className="contents lg:block lg:w-[360px] lg:shrink-0 lg:space-y-4 lg:self-start lg:sticky lg:top-14">
          {/* IDENTITY */}
          <div id="overview" className="order-1 lg:order-none scroll-mt-16">
            <div className="mx-auto w-[58%] max-w-[230px] lg:mx-0 lg:w-full lg:max-w-none">
              <div
                className="relative aspect-[63/88] w-full overflow-hidden rounded-2xl hairline"
                style={{ background: "linear-gradient(150deg,#241808 0%,#3c2a12 35%,#6d4f23 62%,#e9b970 115%)" }}
              >
                <div
                  className="absolute inset-0 opacity-40"
                  style={{ background: "conic-gradient(from 210deg at 30% 20%, transparent, rgba(255,255,255,0.35), transparent 30%, rgba(233,185,112,0.4), transparent 60%)", mixBlendMode: "overlay" }}
                />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="text-overlay font-semibold uppercase tracking-wider text-white/70">{card.baseCode}</p>
                  <p className="text-sm font-extrabold leading-tight text-white">{displayName}</p>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <h1 className="min-w-0 break-words text-xl font-bold tracking-tight text-foreground">{displayName}</h1>
                <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-red-500" title="สีแดง" />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-meta">
                <span className="surface-2 ring-inset rounded px-1.5 py-0.5 text-micro font-bold uppercase text-muted-foreground ring-1 ring-[var(--p-hair)]">{card.rarity}</span>
                <span>· {card.baseCode}</span>
                <span className="ml-auto rounded-full bg-foreground/10 px-2 py-0.5 text-micro font-semibold text-foreground">{edition} · {gradeLabel}{foil ? " · Foil" : ""}</span>
              </div>
            </div>
          </div>

          {/* MEECARD BUY BOX — the ONE honey accent (desktop) */}
          <div className="order-12 hidden lg:order-none lg:block">
            <div className="surface-1 hairline space-y-3 rounded-2xl p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-eyebrow">ขายบน Meecard</span>
                <span className="text-meta tnum">{meecardAsks.length} รายการ</span>
              </div>
              <p className="text-meta">
                จาก <span className="tnum text-base font-bold text-foreground">{meecardLowest != null ? baht(meecardLowest) : "—"}</span>
              </p>
              <Link
                href={`/marketplace?cardCode=${card.cardCode}`}
                className="ease-chrome flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                <ShoppingBag className="size-4" aria-hidden /> ซื้อ
              </Link>
              <Link
                href={`/seller/listings/new?cardCode=${card.cardCode}`}
                className="ease-chrome flex w-full items-center justify-center rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted/30"
              >
                ลงขายใบนี้
              </Link>
              <p className="hairline-t flex items-center justify-center gap-1.5 pt-2.5 text-center text-overlay text-muted-foreground">
                <ShieldCheck className="size-3.5 shrink-0" style={{ color: "var(--price-up)" }} aria-hidden />
                คุ้มครองผู้ซื้อ · ตรวจการ์ดก่อนส่ง
              </p>
            </div>
          </div>

          {/* SPEC SHEET */}
          <div id="specs" className="order-9 lg:order-none scroll-mt-16">
            <CardDetailSpecs card={card} lang={lang} />
          </div>

          {/* EFFECT — quoted box with a thin honey hairline rule (not a fill) */}
          <div className="order-10 lg:order-none">
            <div className="surface-1 rounded-2xl p-4" style={{ boxShadow: "inset 3px 0 0 0 color-mix(in srgb, var(--primary) 45%, transparent)" }}>
              <p className="text-eyebrow mb-2">เอฟเฟกต์การ์ด</p>
              <CardEffectText text={EFFECT} />
            </div>
          </div>
        </div>

        {/* ── RIGHT WORKSPACE — stepper · hero · chart · ledger · provenance ───── */}
        <div className="contents lg:block lg:min-w-0 lg:flex-1 lg:space-y-6">
          {/* PRICE STEPPER + HERO */}
          <div className="order-2 lg:order-none space-y-3">
            {/* STEP 1 — edition + foil */}
            <div className="flex flex-wrap items-center gap-2">
              <EditionToggle value={edition} onChange={setEdition} enAvailable={false} />
              <div className="surface-2 inline-flex rounded-full p-0.5 text-sm font-semibold ring-1 ring-[var(--p-hair)]">
                {(["Foil", "ปกติ"] as const).map((f) => {
                  const on = (f === "Foil") === foil
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFoil(f === "Foil")}
                      aria-pressed={on}
                      className={cn("ease-chrome min-h-9 rounded-full px-3 py-1.5", on ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground")}
                    >
                      {f}
                    </button>
                  )
                })}
              </div>
              <span className="text-meta hidden sm:inline">เลือกตลาด → เกรด → ดูราคา</span>
            </div>
            {/* STEP 2 — grade ladder */}
            <GradeLadder gradeData={gradeData} selected={selectedGrade} onSelect={setSelectedGrade} currency={currency} />
          </div>

          {/* PRICE INSTRUMENT — CardChart owns the ONE hero number + chart + scrub-morph */}
          <div id="chart" className="order-3 lg:order-none scroll-mt-16 space-y-3">
            <CardChart gradeData={gradeData} selectedGrade={selectedGrade} latestUpdatedAt={UPDATED_AT} lang={lang} />
            {/* provenance promoter — tap jumps to the dated receipts */}
            <a href="#sources" className="text-meta flex flex-wrap items-center gap-x-2 gap-y-1 hover:text-foreground">
              <span className="inline-flex items-center gap-1">
                <Info className="size-3.5" aria-hidden /> ราคากลาง = median ของ 3 แหล่ง (SNKRDUNK · Yuyu-tei · eBay)
              </span>
              <span className="rounded-full px-1.5 py-0.5 text-overlay font-semibold uppercase text-muted-foreground" style={{ background: "var(--p-hair)" }}>ดูใบเสร็จ →</span>
            </a>
            {/* triad — last sale / lowest ask / 30d (all reconciled to this grade) */}
            <dl className="grid grid-cols-3 overflow-hidden rounded-xl surface-1 hairline">
              <div className="px-3 py-2">
                <dt className="text-overlay uppercase text-muted-foreground">ขายล่าสุด</dt>
                <dd className="tnum mt-0.5 text-sm font-bold text-foreground">{baht(SOLD_AVG)}</dd>
              </div>
              <div className="px-3 py-2" style={{ boxShadow: "inset 1px 0 0 0 var(--p-hair)" }}>
                <dt className="text-overlay uppercase text-muted-foreground">ตั้งขายต่ำสุด</dt>
                <dd className="tnum mt-0.5 text-sm font-bold text-foreground">{baht(lowestAsk)}</dd>
              </div>
              <div className="px-3 py-2" style={{ boxShadow: "inset 1px 0 0 0 var(--p-hair)" }}>
                <dt className="text-overlay uppercase text-muted-foreground">30 วัน</dt>
                <dd className="mt-0.5">{datum.delta30d ? <Delta pct={datum.delta30d.pct} lang={lang} /> : <span className="text-sm text-muted-foreground">—</span>}</dd>
              </div>
            </dl>
          </div>

          {/* GRADE LEDGER — per-grader cards (is grading worth it?) */}
          <section id="ledger" className="order-4 lg:order-none scroll-mt-16">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-h4">ราคาตามเกรด</h2>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-micro font-semibold text-foreground">Gem Rate 78.9%</span>
                {spreadPct != null && (
                  <span className="rounded-full px-2 py-0.5 text-micro font-semibold" style={{ background: "var(--p-honey-soft)", color: "var(--primary)" }}>
                    PSA10 +{spreadPct}% เหนือ Raw
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {GRADERS.map((gr) => (
                <div key={gr.name} className="surface-1 hairline rounded-2xl p-3">
                  <div className="mb-2 flex items-center gap-1.5">
                    <GradeLogo family={gr.family} size={16} />
                    <span className="text-sm font-bold text-foreground">{gr.name}</span>
                  </div>
                  <div className="grid grid-cols-3 overflow-hidden rounded-lg surface-2 hairline">
                    {gr.tiers.map((t, i) => (
                      <button
                        key={t.g}
                        type="button"
                        className={cn("ease-chrome px-1.5 py-2 text-center hover:bg-foreground/5", i && "border-l border-[var(--p-hair)]")}
                      >
                        <p className="text-micro font-bold text-foreground">{t.g}</p>
                        <p className="tnum text-overlay font-semibold text-foreground/80">{baht(t.price)}</p>
                        <p className="text-overlay text-muted-foreground/60">pop {t.pop}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* PROVENANCE — external reference: twin Sold / Asks tabs (CORE VALUE) */}
          <section id="sources" className="order-5 lg:order-none scroll-mt-16">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-h4">แหล่งอ้างอิง</h2>
              <span className="text-meta">ราคากลาง = median ของ 3 แหล่ง · ช่วง 30 วัน</span>
            </div>
            <div className="surface-1 hairline overflow-hidden rounded-2xl">
              <div className="hairline-b flex gap-1 p-1.5">
                {([["sold", "ขายไปแล้ว"], ["asks", "ประกาศขาย"]] as const).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setProvTab(id)}
                    aria-pressed={provTab === id}
                    className={cn("ease-chrome flex-1 rounded-lg py-2 text-sm font-semibold", provTab === id ? "surface-2 text-foreground ring-1 ring-[var(--p-hair)]" : "text-muted-foreground hover:text-foreground")}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="divide-y" style={{ borderColor: "var(--p-hair)" }}>
                {provRows.map((r, i) => (
                  <a key={i} href="#" className="ease-chrome flex items-center gap-3 px-4 py-3 hover:bg-muted/20">
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-foreground">{r.source}</span>
                        {r.verified && (
                          <span className="inline-flex items-center gap-0.5 text-overlay text-muted-foreground">
                            <BadgeCheck className="size-3" style={{ color: "var(--price-up)" }} aria-hidden /> ตลาดยืนยัน
                          </span>
                        )}
                      </span>
                      <span className="text-meta">{r.grade} · {r.when}</span>
                    </span>
                    <span className="tnum shrink-0 text-sm font-bold text-foreground">{baht(r.price)}</span>
                    <ExternalLink className="size-3.5 shrink-0 text-muted-foreground/40" aria-hidden />
                  </a>
                ))}
              </div>
              <Link href="/proto/browse" className="hairline-t ease-chrome flex items-center justify-center gap-1 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground">
                ดูทั้งหมด <ArrowUpRight className="size-3" aria-hidden />
              </Link>
            </div>
          </section>

          {/* MEECARD MARKETPLACE — internal listings (distinct from reference) */}
          <section className="order-6 lg:order-none">
            <h2 className="text-h4 mb-3">ขายอยู่บน Meecard</h2>
            <div className="surface-1 hairline overflow-hidden rounded-2xl">
              {meecardAsks.length === 0 ? (
                <p className="text-meta px-4 py-6 text-center">ยังไม่มีคนลงขายเกรดนี้ · <Link href="/proto/browse" className="text-foreground hover:underline">แจ้งเตือนเมื่อมีขาย</Link></p>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--p-hair)" }}>
                  {meecardAsks.slice(0, 3).map((a) => (
                    <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                          {a.seller}
                          {a.verified && <BadgeCheck className="size-3.5" style={{ color: "var(--price-up)" }} aria-hidden />}
                        </span>
                        <span className="text-meta">★ {a.rating.toFixed(1)} · {a.grade}</span>
                      </span>
                      <span className="tnum text-sm font-bold text-foreground">{baht(a.price)}</span>
                      <Link
                        href={`/marketplace?cardCode=${card.cardCode}`}
                        className="ease-chrome rounded-lg px-3 py-1.5 text-xs font-bold"
                        style={{ background: "var(--p-honey-soft)", color: "var(--primary)" }}
                      >
                        ซื้อ
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* RELATED — exploration tail (neutral silhouettes) */}
          <section className="order-7 lg:order-none">
            <h2 className="text-h4 mb-3">การ์ดอื่นในเซ็ต OP13</h2>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
              {CARDS.slice(0, 6).map((c) => (
                <Link key={c.code} href="/proto/card-trade-f" className="group flex flex-col gap-1.5 text-center">
                  <div className="surface-2 relative flex aspect-[63/88] w-full items-center justify-center overflow-hidden rounded-xl hairline group-hover:ring-2 group-hover:ring-primary/30">
                    <span className="text-overlay uppercase text-muted-foreground/40">{c.set}</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1">
                      <RarityBadge rarity={c.rarity} size="sm" />
                    </div>
                    <p className="tnum mt-0.5 text-xs font-semibold text-foreground">{baht(c.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ── MOBILE sticky buy bar — the one solid-gold object on phones ────────── */}
      <div className="frost fixed inset-x-0 bottom-0 z-50 lg:hidden" style={{ boxShadow: "inset 0 1px 0 0 var(--p-hair)" }}>
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
          <div className="min-w-0">
            <p className="text-overlay font-semibold uppercase text-muted-foreground">{gradeLabel} · ขายบน Meecard</p>
            <p className="tnum text-base font-extrabold leading-none text-foreground">{meecardLowest != null ? baht(meecardLowest) : (unitValue != null ? formatDisplayValue(unitValue, currency) : "—")}</p>
          </div>
          <button type="button" className="ease-chrome surface-1 ring-inset flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-[var(--p-hair)] text-muted-foreground" aria-label="เพิ่มเข้าพอร์ต">
            <Plus className="size-5" aria-hidden />
          </button>
          <Link
            href={`/marketplace?cardCode=${card.cardCode}`}
            className="ease-chrome ml-auto flex max-w-[200px] flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            <ShoppingBag className="size-4" aria-hidden /> ซื้อ
          </Link>
        </div>
      </div>
    </div>
  )
}
