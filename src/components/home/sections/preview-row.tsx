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
    <div className="hidden md:flex md:items-stretch md:gap-3">
      <div className="flex flex-1 items-stretch gap-3">
        <HomePortfolioPreview />
        <HomeHoneyPreview />
        <HomeMarketValueCard totalValue={totalValue} totalCards={totalCards} />
      </div>
      <div className="hidden w-[28%] max-w-[320px] shrink-0 lg:block">
        <HomeAdCard />
      </div>
    </div>
  )
}
