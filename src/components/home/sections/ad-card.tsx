"use client"

import { AdSlot } from "@/components/ads/ad-slot"

/**
 * Home desktop sidebar ad — now a gated <AdSlot> (FREE users only; collapses
 * to nothing for paid tiers, so the preview row reflows instead of leaving an
 * empty column). Self-sizes for the lg sidebar.
 */
export function HomeAdCard() {
  return (
    <AdSlot
      placement="home-in-feed"
      className="hidden aspect-[5/2] w-[28%] max-w-[320px] shrink-0 lg:flex"
    />
  )
}
