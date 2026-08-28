"use client"

import Image from "next/image"
import Link from "next/link"

import { Price } from "@/components/shared/price-inline"
import { PriceTag } from "@/components/ui/price-tag"
import { baseCardCode } from "@/lib/cards/card-code"
import type { TrendingCard } from "@/lib/data/home"
import { getCardName } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"

/**
 * Variant B's addition: the desktop-only highlight data (มูลค่าสูงสุด · ขึ้นแรง ·
 * ลงแรง) as one horizontal snap rail — the phone finally sees the market pulse
 * without paying the full-screen stack that got the desktop grid hidden on
 * mobile in the first place. Deltas are 24h (that's what ranks the
 * gainers/losers server-side); green/red stays on the PriceTag only — the
 * chrome around it keeps the calm MONEY-surface treatment.
 */

function HighlightCard({ card }: { card: TrendingCard }) {
  const lang = useUIStore((s) => s.language)
  const name = getCardName(lang, card)

  return (
    <Link
      href={`/opcg/cards/${card.cardCode}`}
      className="ease-chrome block w-44 shrink-0 rounded-xl border border-hair bg-background p-2.5 hover:border-primary/35 hover:bg-primary/5"
    >
      <span className="flex items-center gap-2">
        <span className="hairline relative block aspect-[63/88] w-9 shrink-0 overflow-hidden rounded-md bg-muted">
          {card.imageUrl && (
            <Image
              src={card.imageUrl}
              alt=""
              fill
              className="object-contain"
              sizes="36px"
            />
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium leading-tight text-foreground">
            {name}
          </span>
          <span className="mt-0.5 block font-mono text-meta">
            {card.baseCode ?? baseCardCode(card.cardCode)}
          </span>
        </span>
      </span>
      <span className="mt-2 flex items-baseline justify-between gap-1">
        <span className="font-price whitespace-nowrap text-sm font-semibold text-foreground">
          {card.priceJpy != null ? <Price jpy={card.priceJpy} /> : "—"}
        </span>
        {card.priceChange24h != null && (
          <PriceTag
            change={card.priceChange24h}
            changeOnly
            changeStyle="plain"
            size="sm"
          />
        )}
      </span>
    </Link>
  )
}

export function ProtoHighlightStrip({
  featured,
  gainers,
  losers,
}: {
  featured: TrendingCard | null
  gainers: TrendingCard[]
  losers: TrendingCard[]
}) {
  const groups = [
    { key: "top", label: "มูลค่าสูงสุด", cards: featured ? [featured] : [] },
    { key: "up", label: "ขึ้นแรงวันนี้", cards: gainers },
    { key: "down", label: "ลงแรงวันนี้", cards: losers },
  ].filter((g) => g.cards.length > 0)

  if (groups.length === 0) {
    return (
      <p className="mt-6 text-meta">
        วันนี้ยังไม่มีข้อมูลไฮไลต์ตลาด — แถบนี้จะแสดงการ์ดมูลค่าสูงสุดและตัวขึ้น/ลงแรง
      </p>
    )
  }

  return (
    <section aria-label="ไฮไลต์ตลาดวันนี้" className="-mx-5 mt-6">
      {/* scroll-ps-5: snap aligns to the snapport, which ignores padding —
          without it the first group snaps 20px past the gutter on load. */}
      <div className="no-sb flex snap-x gap-4 overflow-x-auto overscroll-x-contain scroll-ps-5 px-5">
        {groups.map((g) => (
          <div key={g.key} className="snap-start">
            <span className="text-eyebrow block">{g.label}</span>
            <div className="mt-1.5 flex gap-2.5">
              {g.cards.map((c) => (
                <HighlightCard key={c.cardCode} card={c} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
