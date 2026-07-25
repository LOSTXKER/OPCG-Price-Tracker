type PortfolioExportLot = {
  id: number | null
  quantity: number
  unitCostJpy: number | null
  acquiredAt: Date | null
  note: string | null
  source: string
}

export type PortfolioExportItem = {
  quantity: number
  purchasePrice: number | null
  condition: string
  notes: string | null
  lots: PortfolioExportLot[]
  card: {
    cardCode: string
    nameJp: string
    nameEn: string | null
    rarity: string
    latestPriceJpy: number | null
    set: { code: string }
  }
}

const HEADER = [
  "Card Code",
  "Name",
  "Set",
  "Rarity",
  "Condition",
  "Lot ID",
  "Source",
  "Quantity",
  "Purchase Price (JPY)",
  "Acquired Date",
  "Note",
  "Current Price (JPY)",
].join(",")

function csvCell(value: string | number | null | undefined): string {
  if (value == null) return ""
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/**
 * Export one row per acquisition so two copies bought at different prices stay
 * distinct outside Meecard. The fallback protects pre-migration reads during
 * the additive rollout without claiming a historical acquisition date.
 */
export function buildPortfolioLotsCsv(
  items: readonly PortfolioExportItem[],
): string {
  const rows = items.flatMap((item) => {
    const card = item.card
    const lots: PortfolioExportLot[] =
      item.lots.length > 0
        ? item.lots
        : [
            {
              id: null,
              quantity: item.quantity,
              unitCostJpy: item.purchasePrice,
              acquiredAt: null,
              note: item.notes,
              source: "LEGACY_OPENING_BALANCE",
            },
          ]

    return lots.map((lot) =>
      [
        card.cardCode,
        card.nameEn ?? card.nameJp,
        card.set.code,
        card.rarity,
        item.condition,
        lot.id,
        lot.source,
        lot.quantity,
        lot.unitCostJpy,
        lot.acquiredAt?.toISOString().slice(0, 10),
        lot.note,
        card.latestPriceJpy,
      ]
        .map(csvCell)
        .join(","),
    )
  })

  return `${HEADER}\n${rows.join("\n")}`
}
