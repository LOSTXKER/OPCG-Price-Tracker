"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { TrendingUp, TrendingDown, Eye } from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { Price } from "@/components/shared/price-inline"
import { Sparkline } from "@/components/shared/sparkline"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { getCardName } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import type { TrendingCardRow } from "./page"

type TabId = "gainers" | "losers" | "mostViewed"
type Period = "24h" | "7d" | "30d"

const TABS: { id: TabId; label: string; icon: typeof TrendingUp }[] = [
  { id: "gainers", label: "ราคาขึ้นมากสุด", icon: TrendingUp },
  { id: "losers", label: "ราคาลงมากสุด", icon: TrendingDown },
  { id: "mostViewed", label: "เข้าชมมากสุด", icon: Eye },
]

const PERIODS: Period[] = ["24h", "7d", "30d"]

interface TrendingData {
  gainers24h: TrendingCardRow[]
  losers24h: TrendingCardRow[]
  gainers7d: TrendingCardRow[]
  losers7d: TrendingCardRow[]
  gainers30d: TrendingCardRow[]
  losers30d: TrendingCardRow[]
  mostViewed: TrendingCardRow[]
}

function getCards(data: TrendingData, tab: TabId, period: Period): TrendingCardRow[] {
  if (tab === "mostViewed") return data.mostViewed
  const key = `${tab}${period}` as keyof TrendingData
  return data[key] ?? []
}

function getChangeValue(card: TrendingCardRow, period: Period): number | null {
  if (period === "24h") return card.priceChange24h
  if (period === "7d") return card.priceChange7d
  return card.priceChange30d
}

export function TrendingTabs({ data, initialTab }: { data: TrendingData; initialTab: string }) {
  const [activeTab, setActiveTab] = useState<TabId>(
    (["gainers", "losers", "mostViewed"] as TabId[]).includes(initialTab as TabId)
      ? (initialTab as TabId)
      : "gainers"
  )
  const [period, setPeriod] = useState<Period>("24h")
  const lang = useUIStore((s) => s.language)
  const cards = getCards(data, activeTab, period)

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          )
        })}

        {activeTab !== "mostViewed" && (
          <div className="ml-auto flex items-center gap-0.5 rounded-lg border border-border p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold tabular-nums transition-all",
                  period === p
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-12" />
              <col />
              <col className="w-20" />
              <col className="w-28" />
              <col className="w-36" />
              <col className="hidden w-24 sm:table-column" />
            </colgroup>
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">การ์ด</th>
                <th className="px-4 py-3 text-left font-medium">ชุด</th>
                <th className="px-4 py-3 text-right font-medium">ราคา</th>
                {activeTab === "mostViewed" ? (
                  <th className="whitespace-nowrap px-4 py-3 text-right font-medium">ยอดเข้าชม</th>
                ) : (
                  <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                    เปลี่ยนแปลง ({period})
                  </th>
                )}
                <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">
                  กราฟ 7 วัน
                </th>
              </tr>
            </thead>
            <tbody>
              {cards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    ไม่มีข้อมูล
                  </td>
                </tr>
              ) : (
                cards.map((card, i) => {
                  const name = getCardName(lang, card)
                  const change = activeTab === "mostViewed"
                    ? null
                    : getChangeValue(card, period)
                  const isUp = change != null && change > 0

                  return (
                    <tr
                      key={card.cardCode}
                      className="border-b border-border/40 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-2.5 text-center tabular-nums text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/cards/${card.cardCode}`}
                          className="flex items-center gap-3 hover:underline"
                        >
                          <div className="relative size-9 shrink-0 overflow-hidden rounded bg-muted">
                            {card.imageUrl && (
                              <Image
                                src={card.imageUrl}
                                alt={name}
                                fill
                                className="object-contain"
                                sizes="36px"
                                placeholder="blur"
                                blurDataURL={BLUR_DATA_URL}
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium leading-tight">{name}</p>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <RarityBadge rarity={card.rarity} size="sm" />
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs text-muted-foreground">
                          {card.setCode.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-price tabular-nums">
                        <Price jpy={card.latestPriceJpy ?? 0} />
                      </td>
                      {activeTab === "mostViewed" ? (
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                          {(card.viewCount ?? 0).toLocaleString()}
                        </td>
                      ) : (
                        <td
                          className={cn(
                            "px-4 py-2.5 text-right font-price tabular-nums font-medium",
                            isUp ? "text-price-up" : "text-price-down"
                          )}
                        >
                          {change != null
                            ? `${change > 0 ? "+" : ""}${change.toFixed(1)}%`
                            : "—"}
                        </td>
                      )}
                      <td className="hidden px-4 py-2.5 sm:table-cell">
                        <div className="flex justify-end">
                          {card.sparkline.length >= 2 ? (
                            <Sparkline data={card.sparkline} width={80} height={28} />
                          ) : (
                            <span className="text-xs text-muted-foreground/30">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
