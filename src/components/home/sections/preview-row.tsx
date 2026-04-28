"use client"

import { HomeAdCard } from "./ad-card"
import { HomeHoneyPreview } from "./honey-preview"
import { HomeMarketValueCard } from "./market-value-card"
import { HomePortfolioPreview } from "./portfolio-preview"

export function HomePreviewRow({
  totalValue,
  totalCards,
}: {
  totalValue: number
  totalCards: number
}) {
  return (
    <div className="hidden auto-rows-fr gap-3 lg:grid lg:grid-cols-4">
      <HomePortfolioPreview />
      <HomeHoneyPreview />
      <HomeMarketValueCard totalValue={totalValue} totalCards={totalCards} />
      <HomeAdCard />
    </div>
  )
}
