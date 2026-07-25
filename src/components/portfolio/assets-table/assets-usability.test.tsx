import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { t } from "@/lib/i18n"
import { MASKED } from "@/lib/constants/ui"
import type { AssetRow, PortfolioPurchaseRow } from "@/lib/types/portfolio"

import { AssetsToolbar } from "./assets-toolbar"
import { DesktopAssetsTable } from "./desktop-table"
import { PortfolioAssetsTable } from "./index"
import { MobileAssetCard } from "./mobile-card"
import { PurchaseNotePreview } from "./purchase-note-preview"
import { formatPurchaseRowDate, mapAssetsToPurchaseRows } from "./utils"

const asset: AssetRow = {
  itemId: 1,
  cardId: 1,
  cardCode: "OP01-001_p1",
  baseCode: "OP01-001",
  nameJp: "ロロノア・ゾロ",
  nameEn: "Roronoa Zoro",
  rarity: "L",
  imageUrl: null,
  quantity: 1,
  lots: [
    {
      id: 1,
      quantity: 1,
      unitCostJpy: 100,
      acquiredAt: null,
      note: null,
      source: "LEGACY_OPENING_BALANCE",
      createdAt: "2026-07-23T00:00:00.000Z",
      updatedAt: "2026-07-23T00:00:00.000Z",
    },
  ],
  lotCount: 1,
  recordedCostJpy: 100,
  costedCopyCount: 1,
  purchasePrice: 100,
  currentPrice: 200,
  currentPriceThb: null,
  priceChange24h: null,
  priceChange7d: null,
  condition: "NM",
  notes: null,
  game: null,
}

function purchaseRows(
  row: AssetRow = asset,
): PortfolioPurchaseRow[] {
  return mapAssetsToPurchaseRows([row])
}

const [purchaseRow] = purchaseRows()

function openingTagForSlot(markup: string, slot: string) {
  const position = markup.indexOf(`data-slot="${slot}"`)
  return markup.slice(
    markup.lastIndexOf("<", position),
    markup.indexOf(">", position) + 1,
  )
}

describe("portfolio assets mobile usability", () => {
  it("counts purchase rows separately from physical copies", () => {
    const markup = renderToStaticMarkup(
      <PortfolioAssetsTable
        assets={[
          {
            ...asset,
            quantity: 2,
            lots: [{ ...asset.lots[0], quantity: 2 }],
          },
          {
            ...asset,
            itemId: 2,
            cardId: 2,
            cardCode: "OP01-002",
            baseCode: "OP01-002",
            quantity: 3,
            lots: [{ ...asset.lots[0], id: 2, quantity: 3 }],
          },
        ]}
        onUpdate={async () => true}
        onAddLot={async () => true}
        onUpdateLot={async () => true}
        onRemoveLot={async () => true}
      />,
    )

    expect(markup).toContain(
      t("TH", "portfolioPurchaseCountSummary")
        .replace("{purchases}", "2")
        .replace("{copies}", "5"),
    )
  })

  it("renders separate rows for two purchases of the same card", () => {
    const markup = renderToStaticMarkup(
      <PortfolioAssetsTable
        assets={[
          {
            ...asset,
            quantity: 3,
            lots: [
              {
                ...asset.lots[0],
                id: 11,
                quantity: 2,
                unitCostJpy: 150,
                source: "MANUAL",
                acquiredAt: "2026-07-22T00:00:00.000Z",
                note: "Second purchase",
              },
              {
                ...asset.lots[0],
                id: 10,
                quantity: 1,
                unitCostJpy: 100,
              },
            ],
            lotCount: 2,
          },
        ]}
        onUpdate={async () => true}
        onAddLot={async () => true}
        onUpdateLot={async () => true}
        onRemoveLot={async () => true}
      />,
    )

    expect(markup.match(/data-slot="portfolio-purchase-row"/g)).toHaveLength(2)
    expect(markup.match(/data-slot="portfolio-assets-mobile-row"/g)).toHaveLength(2)
    expect(markup).toContain('data-lot-id="10"')
    expect(markup).toContain('data-lot-id="11"')
    expect(markup).not.toContain(`>${t("TH", "openingBalance")}<`)
    expect(markup).not.toContain(
      `>${t("TH", "purchaseLotNumber").replace("{number}", "1")}<`,
    )
    // Note previews are a DESKTOP affordance (2 rows × 1 surface); the mobile
    // list flags a saved note with an icon instead of a text preview.
    expect(
      markup.match(/data-slot="portfolio-purchase-note-preview"/g),
    ).toHaveLength(2)
    expect(markup.match(/data-state="saved"/g)).toHaveLength(1)
    expect(markup.match(/data-state="empty"/g)).toHaveLength(1)
    expect(
      markup.match(/data-slot="portfolio-purchase-note-flag"/g),
    ).toHaveLength(1)
    expect(markup).toContain("Second purchase")
    expect(markup).toContain(t("TH", "addPortfolioNote"))
    expect(markup).toContain(
      formatPurchaseRowDate("2026-07-22T00:00:00.000Z", "TH"),
    )
    expect(markup).toContain(t("TH", "dateNotSpecified"))
    expect(markup.match(/data-state="recorded"/g)).toHaveLength(2)
    expect(markup.match(/data-state="missing"/g)).toHaveLength(2)
  })

  it("lets the expanded search controls wrap without clipping sort controls", () => {
    const markup = renderToStaticMarkup(
      <AssetsToolbar
        lang="TH"
        purchaseCount={2}
        copyCount={5}
        searchQuery="zoro"
        onSearchChange={vi.fn()}
        searchOpen
        onSearchOpenChange={vi.fn()}
        sortKey="price"
        sortDir="desc"
        onSortSelect={vi.fn()}
        quotaCurrent={8}
        quotaMax={30}
      />,
    )

    expect(markup).toContain("flex-wrap")
    expect(markup).toContain("min-w-0")
    expect(markup).toContain(t("TH", "marketPricePerCard"))
    expect(markup).toContain(
      t("TH", "portfolioPurchaseCountSummary")
        .replace("{purchases}", "2")
        .replace("{copies}", "5"),
    )
    expect(markup).toContain(t("TH", "portfolioQuotaUsageCompact"))
    expect(markup).toContain(t("TH", "portfolioHoldingsQuota"))
    expect(markup).toContain(">8/30<")
    expect(markup).toContain('data-slot="portfolio-assets-summary"')
    expect(markup).toContain('data-slot="portfolio-assets-quota"')
    expect(markup).toContain('data-slot="limit-badge"')
    expect(markup).toContain('data-limit-state="normal"')
    expect(markup).not.toContain('data-slot="limit-inline"')
    expect(markup).not.toContain('data-slot="limit-meter"')
    expect(markup.match(/รายการซื้อ/g)).toHaveLength(1)
    expect(markup).not.toContain(">24h<")
    expect(markup).not.toContain(t("TH", "value"))
  })

  it("does not repeat the copy total when every purchase is one card", () => {
    const markup = renderToStaticMarkup(
      <AssetsToolbar
        lang="TH"
        purchaseCount={1}
        copyCount={1}
        searchQuery=""
        onSearchChange={vi.fn()}
        searchOpen={false}
        onSearchOpenChange={vi.fn()}
        sortKey="date"
        sortDir="desc"
        onSortSelect={vi.fn()}
        quotaCurrent={1}
        quotaMax={30}
      />,
    )

    expect(markup).toContain(
      t("TH", "purchaseLotCount").replace("{count}", "1"),
    )
    expect(markup).not.toContain("รวม 1 ใบ")
    expect(markup).toContain(t("TH", "portfolioQuotaUsageCompact"))
    expect(markup).toContain(">1/30<")
  })

  it("keeps the mobile row one line: identity + money stack, no inner table", () => {
    const markup = renderToStaticMarkup(
      <MobileAssetCard
        row={purchaseRow}
        lang="TH"
        onEdit={vi.fn()}
      />,
    )

    expect(markup).toContain('data-slot="portfolio-assets-mobile-metrics"')
    expect(markup).toContain('data-slot="portfolio-assets-mobile-price"')
    // A single copy is the default — no "1 ใบ" badge on every row.
    expect(markup).not.toContain('data-slot="portfolio-assets-mobile-quantity"')
    expect(markup).not.toContain("1 ใบ")
    // Market price + P/L only. Unit cost, P/L money and note text moved to the
    // purchase-details dialog so the row stays scannable.
    expect(markup).not.toContain('data-slot="portfolio-assets-mobile-cost"')
    expect(markup).not.toContain(t("TH", "unitCost"))
    // Labels stay in the markup for assistive tech, just not on screen.
    expect(markup).toContain(t("TH", "marketPricePerCard"))
    expect(markup).toContain(t("TH", "pnl"))
    expect(markup.match(/class="sr-only"/g)?.length).toBeGreaterThanOrEqual(2)
    expect(markup).not.toContain(`>${t("TH", "openingBalance")}<`)
    // No "add note" CTA repeated on every row; a saved note gets a flag icon.
    expect(markup).not.toContain('data-slot="portfolio-purchase-note-preview"')
    expect(markup).not.toContain(t("TH", "addPortfolioNote"))
    expect(markup).not.toContain('data-slot="portfolio-purchase-note-flag"')
    expect(markup).not.toContain(">NM<")
    expect(markup).toContain(t("TH", "dateNotSpecified"))
    expect(markup).toContain('data-slot="portfolio-purchase-date"')
    expect(markup).toContain('data-state="missing"')
    expect(markup).toContain("+100.0%")
    expect(markup).toContain('data-slot="portfolio-purchase-details"')
    expect(markup).toContain(t("TH", "details"))
    expect(markup).toContain('data-row-action="open-purchase-details"')
    expect(markup).toContain('aria-haspopup="dialog"')
    expect(markup).toContain('title="รายละเอียด"')
    // Bare chevron (no filled circle) but still a 44px target via tap-safe.
    expect(markup).toContain("tap-safe")
    expect(markup).toContain("size-9")
    expect(markup).not.toContain("rounded-full")
    expect(markup).toContain("py-2.5")
    expect(markup).toContain("gap-2.5")
    expect(markup).toContain("w-10")
    expect(markup).toContain("min-h-[56px]")
    expect(markup).not.toContain("grid-cols-3")
    expect(markup).not.toContain("divide-x")
    expect(markup.match(/href="\/opcg\/cards\/OP01-001_p1"/g)).toHaveLength(2)

    const rowTag = openingTagForSlot(markup, "portfolio-assets-mobile-row")
    expect(rowTag).not.toContain('role="button"')
    expect(rowTag).not.toContain("tabindex")
    // Tapping anywhere in the row opens purchase details; only the art and the
    // NAME TEXT go to the card page — so the name link must hug its text
    // instead of stretching across the line and swallowing dead space.
    expect(rowTag).toContain("cursor-pointer")
    const nameAnchorClass = markup.match(
      /<a class="([^"]*)"[^>]*><p class="truncate/,
    )?.[1]
    expect(nameAnchorClass).toBeDefined()
    expect(nameAnchorClass).not.toContain("flex-1")
  })

  it("flags a saved note with an icon and only badges multi-copy lots", () => {
    const [notedRow] = purchaseRows({
      ...asset,
      quantity: 3,
      lots: [{ ...asset.lots[0], quantity: 3, note: "ซื้อจากงานการ์ด" }],
    })
    const markup = renderToStaticMarkup(
      <MobileAssetCard row={notedRow} lang="TH" onEdit={vi.fn()} />,
    )

    expect(markup).toContain('data-slot="portfolio-purchase-note-flag"')
    expect(markup).toContain('title="ซื้อจากงานการ์ด"')
    expect(markup).toContain(t("TH", "purchaseLotNote"))
    expect(markup).toContain('data-slot="portfolio-assets-mobile-quantity"')
    expect(markup).toContain("3 ใบ")
  })

  it("keeps missing cost honest while details remains the edit entry point", () => {
    const [unknownCostRow] = purchaseRows({
      ...asset,
      purchasePrice: null,
      lots: [{ ...asset.lots[0], unitCostJpy: null }],
      recordedCostJpy: 0,
      costedCopyCount: 0,
    })
    const markup = renderToStaticMarkup(
      <MobileAssetCard
        row={unknownCostRow}
        lang="TH"
        onEdit={vi.fn()}
      />,
    )

    expect(markup).toContain('data-slot="portfolio-purchase-details"')
    expect(markup).toContain(t("TH", "details"))
    // Cost lives in the dialog now; a row with no cost simply shows no P/L.
    expect(markup).not.toContain(t("TH", "unitCost"))
    expect(markup).toContain('data-slot="portfolio-assets-mobile-pnl"')
    expect(markup).not.toContain(t("TH", "costCoverage"))
  })

  it.each(["TH", "EN", "JP"] as const)(
    "localizes saved and empty note previews for %s",
    (lang) => {
      const emptyMarkup = renderToStaticMarkup(
        <PurchaseNotePreview note={null} lang={lang} />,
      )
      const savedMarkup = renderToStaticMarkup(
        <PurchaseNotePreview note="Card fair" lang={lang} />,
      )

      expect(emptyMarkup).toContain('data-state="empty"')
      expect(emptyMarkup).toContain(t(lang, "addPortfolioNote"))
      expect(savedMarkup).toContain('data-state="saved"')
      expect(savedMarkup).toContain("Card fair")
      expect(savedMarkup).not.toContain(t(lang, "addPortfolioNote"))
    },
  )

  it("keeps mobile P/L percentage visible while masking the amount", () => {
    const markup = renderToStaticMarkup(
      <MobileAssetCard
        row={purchaseRow}
        lang="TH"
        onEdit={vi.fn()}
        hideBalance
      />,
    )

    // Only the market price is an amount now, so exactly one mask — the P/L
    // percentage still reads through (it is not a balance).
    expect(markup.match(new RegExp(MASKED, "g"))).toHaveLength(1)
    expect(markup).toContain(t("TH", "pnl"))
    expect(markup).toContain("+100.0%")
    expect(markup).not.toContain("grid-cols-3")
    expect(markup).not.toContain("w-24 shrink-0 text-right")
  })

  it("uses six stable decision columns and preserves P/L percentage when hidden", () => {
    const markup = renderToStaticMarkup(
      <DesktopAssetsTable
        rows={[purchaseRow]}
        lang="TH"
        onEdit={vi.fn()}
        hideBalance
        sortKey="qty"
        sortDir="desc"
        onSortSelect={vi.fn()}
      />,
    )

    expect(markup).toContain('data-slot="portfolio-assets-table"')
    expect(markup).toContain("table-fixed")
    expect(markup).toContain('data-slot="portfolio-assets-colgroup"')
    expect(markup.match(/<col(?=\s|>)/g)).toHaveLength(6)
    expect(markup).toContain('class="w-[28%]"')
    expect(markup).toContain('class="w-[8%]"')
    expect(markup).toContain('data-slot="portfolio-assets-head"')
    expect(markup).toContain('<thead class="bg-transparent"')
    expect(markup).toContain("whitespace-normal")
    expect(markup).toContain("leading-tight")
    expect(markup).toContain('data-slot="portfolio-asset-quantity"')
    expect(markup).toContain('data-slot="portfolio-asset-price"')
    expect(markup).toContain('data-slot="portfolio-asset-cost"')
    expect(markup).toContain('data-slot="portfolio-asset-pnl"')
    expect(markup).toContain(
      `${t("TH", "card")} / ${t("TH", "acquiredDate")}`,
    )
    expect(markup).toContain('aria-sort="descending"')
    expect(markup).toContain(t("TH", "marketPricePerCard"))
    expect(markup).toContain(t("TH", "quantity"))
    expect(markup).toContain(t("TH", "unitCost"))
    expect(markup).not.toContain(">NM<")
    expect(markup).not.toContain(">24h<")
    expect(markup).not.toContain(t("TH", "sparkline30d"))
    expect(markup).not.toContain(t("TH", "value"))
    expect(markup.match(new RegExp(MASKED, "g"))).toHaveLength(3)
    expect(markup).toContain("+100.0%")
    expect(markup).toContain("font-price")
    expect(markup).toContain("rounded-full")
  })

  it.each(["EN", "JP"] as const)(
    "allows long %s column labels to wrap inside their fixed cells",
    (lang) => {
      const markup = renderToStaticMarkup(
        <DesktopAssetsTable
          rows={[purchaseRow]}
          lang={lang}
          onEdit={vi.fn()}
          sortKey="price"
          sortDir="desc"
          onSortSelect={vi.fn()}
        />,
      )

      expect(markup).toContain(t(lang, "marketPricePerCard"))
      expect(markup).toContain(t(lang, "unitCost"))
      expect(markup).toContain("whitespace-normal")
      expect(markup).toContain("w-full")
      expect(markup).toContain("leading-tight")
      expect(markup.match(/<col(?=\s|>)/g)).toHaveLength(6)
    },
  )

  it("gives same-card purchase actions unique accessible labels", () => {
    const rows = purchaseRows({
      ...asset,
      quantity: 2,
      lots: [
        {
          ...asset.lots[0],
          id: 21,
          source: "MANUAL",
          acquiredAt: null,
        },
        { ...asset.lots[0], id: 20 },
      ],
      lotCount: 2,
    })
    const markup = renderToStaticMarkup(
      <DesktopAssetsTable
        rows={rows}
        lang="TH"
        onEdit={vi.fn()}
        sortKey="cost"
        sortDir="desc"
        onSortSelect={vi.fn()}
      />,
    )

    expect(markup).toContain(
      `aria-label="${t("TH", "details")}: Roronoa Zoro · ${t("TH", "openingBalance")}"`,
    )
    expect(markup).toContain(
      `aria-label="${t("TH", "details")}: Roronoa Zoro · ${t("TH", "purchaseLotNumber").replace("{number}", "1")}"`,
    )
    expect(markup).toContain(t("TH", "details"))
    expect(markup).not.toContain(`>${t("TH", "openingBalance")}<`)
    expect(markup).not.toContain(
      `>${t("TH", "purchaseLotNumber").replace("{number}", "1")}<`,
    )
    expect(markup).toContain("1 ใบ")
    expect(markup).not.toContain("×1")
    expect(markup).toContain(t("TH", "dateNotSpecified"))
  })
})
