import {
  getCardName,
  getLocale,
  t,
  type Currency,
  type Language,
} from "@/lib/i18n"
import type {
  AssetRow,
  PortfolioLot,
  PortfolioPurchaseRow,
} from "@/lib/types/portfolio"
import { displayValueToJpy } from "@/lib/utils/currency"

export type HoldingsSortKey = "price" | "cost" | "pnl" | "qty"
export type PurchaseSortKey = HoldingsSortKey | "date"
export type SortKey = HoldingsSortKey | "value"
export type SortDir = "desc" | "asc"
export type HoldingsView = "grid" | "list"

export function hasCompleteCost(row: AssetRow): boolean {
  return row.quantity > 0 && row.costedCopyCount === row.quantity
}

export function pnlCalc(row: AssetRow): { pnl: number; pct: number | null } | null {
  if (!hasCompleteCost(row) || row.currentPrice == null) return null
  const value = row.currentPrice * row.quantity
  const pnl = value - row.recordedCostJpy
  const pct = row.recordedCostJpy > 0 ? (pnl / row.recordedCostJpy) * 100 : null
  return { pnl, pct }
}

export function holdingValue(row: AssetRow): number {
  return (row.currentPrice ?? 0) * row.quantity
}

export function holdingCost(row: AssetRow): number | null {
  return hasCompleteCost(row) ? row.recordedCostJpy : null
}

export function knownHoldingCost(row: AssetRow): number | null {
  return row.costedCopyCount > 0 ? row.recordedCostJpy : null
}

type StablePurchaseLotIdentity = Pick<
  PortfolioLot,
  "id" | "createdAt" | "source"
>

function buildStablePurchaseLotNumbers(
  lots: readonly StablePurchaseLotIdentity[],
): Map<number, number> {
  const manualLots = lots
    .filter((lot) => lot.source !== "LEGACY_OPENING_BALANCE")
    .sort((a, b) => {
      const createdComparison = a.createdAt.localeCompare(b.createdAt)
      return createdComparison !== 0 ? createdComparison : a.id - b.id
    })

  return new Map(manualLots.map((lot, index) => [lot.id, index + 1]))
}

/**
 * Stable visible purchase number. It intentionally ignores `acquiredAt`,
 * which users may edit, and excludes the legacy opening balance because that
 * row has its own label.
 */
export function getStablePurchaseLotNumber(
  lots: readonly StablePurchaseLotIdentity[],
  lotId: number,
): number | null {
  return buildStablePurchaseLotNumbers(lots).get(lotId) ?? null
}

/**
 * Flattens grouped holdings for the private Overview list. API responses from
 * before the lot rollout can still have `lots: []`; keep one compatibility row
 * so those cards never disappear while cached/legacy data is in flight.
 */
export function mapAssetsToPurchaseRows(
  assets: AssetRow[],
): PortfolioPurchaseRow[] {
  return assets.flatMap<PortfolioPurchaseRow>((asset) => {
    const stablePurchaseNumbers = buildStablePurchaseLotNumbers(asset.lots)
    const shared = {
      itemId: asset.itemId,
      purchaseCount: asset.lots.length || 1,
      cardId: asset.cardId,
      cardCode: asset.cardCode,
      baseCode: asset.baseCode,
      nameJp: asset.nameJp,
      nameEn: asset.nameEn,
      rarity: asset.rarity,
      imageUrl: asset.imageUrl,
      currentPrice: asset.currentPrice,
      currentPriceThb: asset.currentPriceThb,
      condition: asset.condition,
      isPrivate: asset.isPrivate,
      game: asset.game,
    }

    if (asset.lots.length === 0) {
      return [{
        ...shared,
        rowKey: `holding:${asset.itemId}:compat`,
        lotId: null,
        lotIndex: 1,
        isCompatibilityRow: true,
        source: "LEGACY_OPENING_BALANCE" as const,
        quantity: asset.quantity,
        unitCostJpy: asset.purchasePrice,
        acquiredAt: null,
        purchaseCreatedAt: null,
        purchaseNote: null,
      }]
    }

    return asset.lots.map((lot, index) => ({
      ...shared,
      rowKey: `holding:${asset.itemId}:lot:${lot.id}`,
      lotId: lot.id,
      lotIndex: stablePurchaseNumbers.get(lot.id) ?? index + 1,
      isCompatibilityRow: false,
      source: lot.source,
      quantity: lot.quantity,
      unitCostJpy: lot.unitCostJpy,
      acquiredAt: lot.acquiredAt,
      purchaseCreatedAt: lot.createdAt,
      purchaseNote: lot.note,
    }))
  })
}

export function matchesPurchaseRow(
  row: PortfolioPurchaseRow,
  query: string,
  lang: Language,
): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  const name = getCardName(lang, row).toLowerCase()
  const code = (row.baseCode ?? row.cardCode).toLowerCase()
  const note = row.purchaseNote?.toLowerCase() ?? ""
  return (
    name.includes(normalized) ||
    code.includes(normalized) ||
    note.includes(normalized)
  )
}

export function getPurchaseRowEditTarget(
  row: Pick<PortfolioPurchaseRow, "itemId" | "lotId">,
): { itemId: number; initialLotId: number | null } {
  return { itemId: row.itemId, initialLotId: row.lotId }
}

export function purchaseRowPnlCalc(
  row: PortfolioPurchaseRow,
): { pnl: number; pct: number | null } | null {
  if (row.unitCostJpy == null || row.currentPrice == null) return null
  const cost = row.unitCostJpy * row.quantity
  const pnl = row.currentPrice * row.quantity - cost
  const pct = cost > 0 ? (pnl / cost) * 100 : null
  return { pnl, pct }
}

export function getPurchaseRowLabel(
  row: Pick<PortfolioPurchaseRow, "lotIndex" | "source">,
  lang: Language,
): string {
  return row.source === "LEGACY_OPENING_BALANCE"
    ? t(lang, "openingBalance")
    : t(lang, "purchaseLotNumber").replace("{number}", String(row.lotIndex))
}

export function formatPurchaseRowQuantity(
  quantity: number,
  lang: Language,
): string {
  const value = quantity.toLocaleString(getLocale(lang))
  if (lang === "JP") return `${value}${t(lang, "cardUnit")}`
  if (lang === "EN" && quantity === 1) return `${value} card`
  return `${value} ${t(lang, "cardUnit")}`
}

/**
 * `compact` is the mobile-list form: this year needs no year at all, older
 * purchases get a 2-digit one. Keeps the row's meta line inside a phone width
 * so the date never truncates to "24 ก.ค. …" next to the card code.
 */
export function formatPurchaseRowDate(
  value: string | null,
  lang: Language,
  style: "full" | "compact" = "full",
): string {
  if (!value) return t(lang, "dateNotSpecified")
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return t(lang, "dateNotSpecified")
  const thisYear = parsed.getUTCFullYear() === new Date().getUTCFullYear()
  const year: Intl.DateTimeFormatOptions["year"] =
    style === "full" ? "numeric" : thisYear ? undefined : "2-digit"
  return new Intl.DateTimeFormat(getLocale(lang), {
    day: "numeric",
    month: "short",
    year,
    timeZone: "UTC",
  }).format(parsed)
}

function compareNullable(
  a: number | null | undefined,
  b: number | null | undefined,
  multiplier: 1 | -1,
): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return (a - b) * multiplier
}

export function sortAssets(assets: AssetRow[], key: SortKey, dir: SortDir): AssetRow[] {
  const m: 1 | -1 = dir === "asc" ? 1 : -1
  return [...assets].sort((a, b) => {
    switch (key) {
      case "value":
        return (holdingValue(a) - holdingValue(b)) * m
      case "pnl": {
        const pa = pnlCalc(a)
        const pb = pnlCalc(b)
        return compareNullable(pa?.pnl, pb?.pnl, m)
      }
      case "cost": {
        const ca = holdingCost(a)
        const cb = holdingCost(b)
        return compareNullable(ca, cb, m)
      }
      case "qty":
        return (a.quantity - b.quantity) * m
      case "price":
        return compareNullable(a.currentPrice, b.currentPrice, m)
      default:
        return 0
    }
  })
}

export function sortPurchaseRows(
  rows: PortfolioPurchaseRow[],
  key: PurchaseSortKey,
  dir: SortDir,
): PortfolioPurchaseRow[] {
  const multiplier: 1 | -1 = dir === "asc" ? 1 : -1
  const timestamp = (value: string | null): number | null => {
    if (!value) return null
    const parsed = new Date(value).getTime()
    return Number.isNaN(parsed) ? null : parsed
  }
  const compareIdentity = (
    a: PortfolioPurchaseRow,
    b: PortfolioPurchaseRow,
  ): number => {
    if (a.itemId !== b.itemId) return a.itemId - b.itemId
    return (a.lotId ?? -1) - (b.lotId ?? -1)
  }
  const compareByDate = (
    a: PortfolioPurchaseRow,
    b: PortfolioPurchaseRow,
  ): number => {
    const acquiredComparison = compareNullable(
      timestamp(a.acquiredAt),
      timestamp(b.acquiredAt),
      multiplier,
    )
    if (acquiredComparison !== 0) return acquiredComparison

    const createdComparison = compareNullable(
      timestamp(a.purchaseCreatedAt),
      timestamp(b.purchaseCreatedAt),
      multiplier,
    )
    if (createdComparison !== 0) return createdComparison

    return compareIdentity(a, b) * multiplier
  }

  if (key === "date") return [...rows].sort(compareByDate)

  return [...rows].sort((a, b) => {
    let primaryComparison = 0
    switch (key) {
      case "pnl":
        primaryComparison = compareNullable(
          purchaseRowPnlCalc(a)?.pnl,
          purchaseRowPnlCalc(b)?.pnl,
          multiplier,
        )
        break
      case "cost":
        primaryComparison = compareNullable(
          a.unitCostJpy,
          b.unitCostJpy,
          multiplier,
        )
        break
      case "qty":
        primaryComparison = (a.quantity - b.quantity) * multiplier
        break
      case "price":
        primaryComparison = compareNullable(
          a.currentPrice,
          b.currentPrice,
          multiplier,
        )
        break
      default:
        break
    }
    if (primaryComparison !== 0) return primaryComparison

    // Equal values still need a repeatable result after API refreshes.
    const dateComparison = compareByDate(a, b)
    if (dateComparison !== 0) return dateComparison
    return compareIdentity(a, b) * multiplier
  })
}

export function parseCostValue(raw: string): number | null | undefined {
  const trimmed = raw.trim()
  if (trimmed === "") return null
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) return undefined
  return parsed
}

export function resolveUnitCostJpy({
  parsedDisplayCost,
  currency,
  originalUnitCostJpy,
  costEdited,
}: {
  parsedDisplayCost: number | null
  currency: Currency
  originalUnitCostJpy: number | null
  costEdited: boolean
}): number | null {
  if (!costEdited) return originalUnitCostJpy
  if (parsedDisplayCost == null) return null

  return currency === "JPY"
    ? Math.round(parsedDisplayCost)
    : displayValueToJpy(parsedDisplayCost, currency)
}
