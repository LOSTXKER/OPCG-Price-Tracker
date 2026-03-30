export interface PortfolioStats {
  totalValueJpy: number
  totalCostJpy: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  bestPerformer: { name: string; pnl: number; pnlPercent: number } | null
  worstPerformer: { name: string; pnl: number; pnlPercent: number } | null
}

export type AllocationSlice = {
  name: string
  value: number
  percent: number
}

export type AssetRow = {
  itemId: number
  cardId: number
  cardCode: string
  baseCode: string | null
  nameJp: string
  nameEn: string | null
  rarity: string
  imageUrl: string | null
  quantity: number
  purchasePrice: number | null
  currentPrice: number | null
  priceChange24h: number | null
  priceChange7d: number | null
  condition: string
}

export type PortfolioMeta = {
  id: number
  name: string
  totalValue: number
  itemCount: number
}

export type TransactionRow = {
  id: number
  type: string
  quantity: number
  pricePerUnit: number | null
  note: string | null
  createdAt: string
  card: {
    cardCode: string
    nameJp: string
    nameEn: string | null
    imageUrl: string | null
    rarity: string
  }
}
