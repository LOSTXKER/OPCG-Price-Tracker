"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { PortfolioShareDialog } from "@/components/portfolio/portfolio-share-dialog"
import type { AssetRow, PortfolioStats } from "@/lib/types/portfolio"

import { HOLDINGS } from "../proto-data"

const THB_PER_JPY = 0.296

const ASSETS: AssetRow[] = HOLDINGS.slice(0, 6).map((holding, index) => {
  const unitCostJpy = Math.round(holding.costThb / THB_PER_JPY)
  const currentPriceJpy = Math.round(holding.priceThb / THB_PER_JPY)

  return {
    itemId: index + 1,
    cardId: index + 1,
    cardCode: holding.code,
    baseCode: holding.code,
    nameJp: holding.name,
    nameEn: holding.name,
    rarity: holding.rarity,
    imageUrl: holding.img,
    quantity: holding.qty,
    lots: [],
    lotCount: 1,
    recordedCostJpy: unitCostJpy * holding.qty,
    costedCopyCount: holding.qty,
    purchasePrice: unitCostJpy,
    currentPrice: currentPriceJpy,
    currentPriceThb: holding.priceThb,
    priceChange24h: holding.d24,
    priceChange7d: holding.d7,
    condition: "NM",
    notes: null,
    game: null,
  }
})

const totalValueJpy = ASSETS.reduce(
  (sum, asset) => sum + (asset.currentPrice ?? 0) * asset.quantity,
  0,
)
const totalCostJpy = ASSETS.reduce(
  (sum, asset) => sum + asset.recordedCostJpy,
  0,
)
const totalCopyCount = ASSETS.reduce(
  (sum, asset) => sum + asset.quantity,
  0,
)
const unrealizedPnl = totalValueJpy - totalCostJpy

const STATS: PortfolioStats = {
  estimatedValueJpy: totalValueJpy,
  recordedCostJpy: totalCostJpy,
  totalCopyCount,
  valuedCopyCount: totalCopyCount,
  costedCopyCount: totalCopyCount,
  valuationComplete: true,
  performanceComplete: true,
  pnlJpy: unrealizedPnl,
  roiPct: (unrealizedPnl / totalCostJpy) * 100,
  totalValueJpy,
  totalCostJpy,
  unrealizedPnl,
  unrealizedPnlPercent: (unrealizedPnl / totalCostJpy) * 100,
  bestPerformer: null,
  worstPerformer: null,
}

export default function PortfolioShareProtoPage() {
  const [open, setOpen] = useState(true)

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/30 p-6">
      <Button onClick={() => setOpen(true)}>เปิด Share Snapshot</Button>
      <PortfolioShareDialog
        open={open}
        onOpenChange={setOpen}
        portfolioName="Collector’s Vault"
        stats={STATS}
        history={[]}
        assets={ASSETS}
      />
    </main>
  )
}
