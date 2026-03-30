"use client"

import Link from "next/link"
import { ArrowLeft, BarChart3, Layers, Package, TrendingUp } from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { Price } from "@/components/shared/price-inline"
import { cn } from "@/lib/utils"
import { RARITY_BAR_COLOR, RARITY_HEX } from "@/lib/constants/rarities"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"

type MarketData = {
  totalCards: number
  totalValue: number
  avgPrice: number
  setCount: number
  rarityBreakdown: { rarity: string; count: number; totalValue: number }[]
  topSetsByValue: { code: string; name: string; cardCount: number; totalValue: number }[]
}

export function MarketOverviewClient({ data }: { data: MarketData }) {
  const lang = useUIStore((s) => s.language)

  const maxRarityValue = Math.max(...data.rarityBreakdown.map((r) => r.totalValue), 1)
  const maxSetValue = Math.max(...data.topSetsByValue.map((s) => s.totalValue), 1)

  const title = lang === "TH" ? "ภาพรวมตลาด" : lang === "JP" ? "マーケット概要" : "Market Overview"
  const subtitle = lang === "TH"
    ? "สรุปมูลค่าและสถิติของตลาดการ์ด One Piece TCG"
    : lang === "JP"
      ? "ワンピースTCGカード市場の統計とサマリー"
      : "Summary of the One Piece TCG card market statistics"

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t(lang, "backToHome")}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          icon={<BarChart3 className="size-4" />}
          iconBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          label={t(lang, "totalValue")}
          value={<Price jpy={data.totalValue} />}
        />
        <SummaryCard
          icon={<TrendingUp className="size-4" />}
          iconBg="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          label={lang === "TH" ? "ราคาเฉลี่ย" : lang === "JP" ? "平均価格" : "Avg. Price"}
          value={<Price jpy={data.avgPrice} />}
        />
        <SummaryCard
          icon={<Layers className="size-4" />}
          iconBg="bg-primary/10 text-primary"
          label={t(lang, "totalCards")}
          value={data.totalCards.toLocaleString()}
        />
        <SummaryCard
          icon={<Package className="size-4" />}
          iconBg="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          label={lang === "TH" ? "จำนวนเซ็ต" : lang === "JP" ? "セット数" : "Total Sets"}
          value={data.setCount.toLocaleString()}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rarity breakdown */}
        <div className="panel overflow-hidden">
          <div className="border-b border-border/40 px-5 py-4">
            <h2 className="text-sm font-semibold">
              {lang === "TH" ? "มูลค่าตาม Rarity" : lang === "JP" ? "レアリティ別の価値" : "Value by Rarity"}
            </h2>
          </div>
          <div className="divide-y divide-border/30">
            {data.rarityBreakdown.map((r) => {
              const pct = (r.totalValue / data.totalValue) * 100
              const barWidth = (r.totalValue / maxRarityValue) * 100
              const barColor = RARITY_BAR_COLOR[r.rarity] ?? "bg-neutral-400"
              return (
                <div key={r.rarity} className="flex items-center gap-3 px-5 py-3">
                  <RarityBadge rarity={r.rarity} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full transition-all", barColor)}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-price text-sm font-semibold tabular-nums">
                      <Price jpy={r.totalValue} />
                    </p>
                    <p className="text-[10px] tabular-nums text-muted-foreground">
                      {r.count.toLocaleString()} {lang === "TH" ? "ใบ" : lang === "JP" ? "枚" : "cards"} · {pct.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top sets by value */}
        <div className="panel overflow-hidden">
          <div className="border-b border-border/40 px-5 py-4">
            <h2 className="text-sm font-semibold">
              {lang === "TH" ? "เซ็ตที่มูลค่าสูงสุด" : lang === "JP" ? "価値の高いセットTOP10" : "Top Sets by Value"}
            </h2>
          </div>
          <div className="divide-y divide-border/30">
            {data.topSetsByValue.map((s, i) => {
              const barWidth = (s.totalValue / maxSetValue) * 100
              return (
                <Link
                  key={s.code}
                  href={`/sets/${s.code.toLowerCase()}`}
                  className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30"
                >
                  <span className="w-5 shrink-0 text-center font-price text-xs font-medium text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium group-hover:text-primary">
                      <span className="font-mono text-xs text-muted-foreground">{s.code.toUpperCase()}</span>
                      {" "}
                      <span className="truncate">{s.name}</span>
                    </p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/60 transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-price text-sm font-semibold tabular-nums">
                      <Price jpy={s.totalValue} />
                    </p>
                    <p className="text-[10px] tabular-nums text-muted-foreground">
                      {s.cardCount.toLocaleString()} {lang === "TH" ? "ใบ" : lang === "JP" ? "枚" : "cards"}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="panel flex items-center gap-3 px-4 py-4">
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", iconBg)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className="truncate font-price text-lg font-bold text-foreground">{value}</p>
      </div>
    </div>
  )
}
