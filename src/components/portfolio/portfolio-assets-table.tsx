"use client"

import { memo, useState, useMemo, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Edit2,
  Eye,
  EyeOff,
  MoreHorizontal,
  Search,
  Trash2,
  X,
} from "lucide-react"

import { Price } from "@/components/shared/price-inline"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCardName, t, type Language } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { formatJpyAmount, formatPct } from "@/lib/utils/currency"
import { useConfirm } from "@/components/shared/confirm-dialog"

export type { AssetRow } from "@/lib/types/portfolio"
import type { AssetRow } from "@/lib/types/portfolio"

type SortKey = "value" | "pnl" | "change24h" | "cost" | "qty"
type SortDir = "desc" | "asc"

function pnlCalc(row: AssetRow) {
  if (row.purchasePrice == null || row.currentPrice == null) return null
  const pnl = (row.currentPrice - row.purchasePrice) * row.quantity
  const pct =
    row.purchasePrice > 0
      ? ((row.currentPrice - row.purchasePrice) / row.purchasePrice) * 100
      : 0
  return { pnl, pct }
}

function holdingValue(row: AssetRow) {
  return (row.currentPrice ?? 0) * row.quantity
}

function sortAssets(assets: AssetRow[], key: SortKey, dir: SortDir): AssetRow[] {
  const m = dir === "asc" ? 1 : -1
  return [...assets].sort((a, b) => {
    switch (key) {
      case "value":
        return (holdingValue(a) - holdingValue(b)) * m
      case "pnl": {
        const pa = pnlCalc(a)
        const pb = pnlCalc(b)
        return ((pa?.pct ?? -Infinity) - (pb?.pct ?? -Infinity)) * m
      }
      case "change24h":
        return ((a.priceChange24h ?? -Infinity) - (b.priceChange24h ?? -Infinity)) * m
      case "cost": {
        const ca = (a.purchasePrice ?? 0) * a.quantity
        const cb = (b.purchasePrice ?? 0) * b.quantity
        return (ca - cb) * m
      }
      case "qty":
        return (a.quantity - b.quantity) * m
      default:
        return 0
    }
  })
}

export function PortfolioAssetsTable({
  assets,
  onUpdate,
  onRemove,
}: {
  assets: AssetRow[]
  onUpdate: (
    itemId: number,
    data: { quantity?: number; purchasePrice?: number | null; isPrivate?: boolean },
  ) => void
  onRemove: (itemId: number) => void
}) {
  const lang = useUIStore((s) => s.language)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("value")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [editOpen, setEditOpen] = useState(false)
  const [editFocusId, setEditFocusId] = useState<number | null>(null)
  const confirm = useConfirm()

  const filteredAssets = useMemo(() => {
    let result = assets
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((row) => {
        const name = getCardName(lang as "TH" | "EN" | "JP", row).toLowerCase()
        const code = (row.baseCode ?? row.cardCode).toLowerCase()
        return name.includes(q) || code.includes(q)
      })
    }
    return sortAssets(result, sortKey, sortDir)
  }, [assets, searchQuery, sortKey, sortDir, lang])

  const handleSortSelect = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const openEdit = (row: AssetRow) => {
    setEditFocusId(row.itemId)
    setEditOpen(true)
  }

  const openBulkEdit = () => {
    setEditFocusId(null)
    setEditOpen(true)
  }

  const handleRemove = async (row: AssetRow) => {
    const name = getCardName(lang as "TH" | "EN" | "JP", row)
    const ok = await confirm({
      title: `${t(lang, "remove")} ${name}`,
      description: t(lang, "confirmRemoveCard"),
      confirmLabel: t(lang, "remove"),
      cancelLabel: t(lang, "cancel"),
      variant: "destructive",
    })
    if (ok) onRemove(row.itemId)
  }

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "value", label: t(lang, "value") },
    { key: "pnl", label: t(lang, "pnl") },
    { key: "change24h", label: "24h" },
    { key: "cost", label: t(lang, "costBasis") },
    { key: "qty", label: t(lang, "quantity") },
  ]

  return (
    <>
      {/* Section header */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-border/30 px-5 py-3 sm:px-6">
        <p className="text-sm font-bold">{t(lang, "assets")}</p>
        <span className="rounded-full bg-primary/8 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary/80">
          {assets.length} {t(lang, "card")}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {/* Search */}
          {searchOpen ? (
            <div className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-muted/30 px-3 py-1.5 transition-all">
              <Search className="size-3.5 shrink-0 text-muted-foreground/60" />
              <input
                autoFocus
                className="w-28 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 sm:w-40"
                placeholder={t(lang, "searchByNameOrCode")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchQuery("")
                    setSearchOpen(false)
                  }
                }}
              />
              <button
                onClick={() => {
                  setSearchQuery("")
                  setSearchOpen(false)
                }}
                className="rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="rounded-lg p-2 text-muted-foreground/60 transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <Search className="size-4" />
            </button>
          )}

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-muted/20 px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted/50">
              {sortDir === "desc" ? (
                <ArrowDown className="size-3 text-muted-foreground/60" />
              ) : (
                <ArrowUp className="size-3 text-muted-foreground/60" />
              )}
              {sortOptions.find((o) => o.key === sortKey)?.label ?? t(lang, "toolbarSort")}
              <ChevronDown className="size-3 text-muted-foreground/50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={4}>
              {sortOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt.key}
                  onClick={() => handleSortSelect(opt.key)}
                  className={cn(sortKey === opt.key && "font-semibold text-primary")}
                >
                  <span className="flex-1">{opt.label}</span>
                  {sortKey === opt.key && (
                    sortDir === "desc"
                      ? <ArrowDown className="size-3 text-primary" />
                      : <ArrowUp className="size-3 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bulk edit button */}
          {assets.length > 0 && (
            <button
              onClick={openBulkEdit}
              className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-muted/20 px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted/50"
            >
              <Edit2 className="size-3 text-muted-foreground/60" />
              {t(lang, "bulkEdit")}
            </button>
          )}
        </div>
      </div>

      {filteredAssets.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {t(lang, "noResults")}
        </p>
      ) : (
        <>
          {/* Mobile card layout */}
          <div className="divide-y divide-border/10 sm:hidden">
            {filteredAssets.map((row) => (
              <MobileAssetCard
                key={row.itemId}
                row={row}
                lang={lang}
                onUpdate={onUpdate}
                onEdit={() => openEdit(row)}
                onRemove={() => void handleRemove(row)}
              />
            ))}
          </div>

          {/* Desktop table layout */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
                <tr className="border-b border-border/20 text-[11px] uppercase tracking-wider text-muted-foreground/60">
                  <th className="py-3 pl-5 pr-3 font-semibold">{t(lang, "card")}</th>
                  <th className="py-3 pr-3 text-right font-semibold">{t(lang, "value")}</th>
                  <th className="py-3 pr-3 text-right font-semibold">{t(lang, "price")}</th>
                  <th className="py-3 pr-3 text-right font-semibold">24h</th>
                  <th className="hidden py-3 pr-3 text-right font-semibold md:table-cell">7d</th>
                  <th className="py-3 pr-3 text-right font-semibold">{t(lang, "costBasis")}</th>
                  <th className="py-3 pr-3 text-right font-semibold">{t(lang, "pnl")}</th>
                  <th className="w-12 py-3 pr-5 text-right font-semibold" />
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((row) => (
                  <AssetRowComponent
                    key={row.itemId}
                    row={row}
                    lang={lang}
                    onUpdate={onUpdate}
                    onEdit={() => openEdit(row)}
                    onRemove={() => void handleRemove(row)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editFocusId != null ? (
        <SingleEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          assets={assets}
          focusItemId={editFocusId}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      ) : (
        <BulkEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          assets={assets}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      )}
    </>
  )
}

/* ─── Single Edit Card (controlled by parent dialog) ─── */

function CardEditFull({
  row,
  lang,
  qty,
  onQtyChange,
  cost,
  onCostChange,
  isPrivate,
  onPrivateChange,
  onRemove,
}: {
  row: AssetRow
  lang: Language
  qty: string
  onQtyChange: (v: string) => void
  cost: string
  onCostChange: (v: string) => void
  isPrivate: boolean
  onPrivateChange: (v: boolean) => void
  onRemove: (itemId: number) => void
}) {
  const name = getCardName(lang as "TH" | "EN" | "JP", row)
  const confirm = useConfirm()
  const pnlResult = pnlCalc(row)

  const handleRemove = async () => {
    const ok = await confirm({ title: `${t(lang, "remove")} ${name}`, description: t(lang, "confirmRemoveCard"), confirmLabel: t(lang, "remove"), cancelLabel: t(lang, "cancel"), variant: "destructive" })
    if (ok) onRemove(row.itemId)
  }

  return (
    <div className="space-y-5">
      {/* Card identity */}
      <div className="flex gap-4">
        <Link href={`/cards/${row.cardCode}`} className="shrink-0">
          <div className="relative aspect-[5/7] w-[72px] overflow-hidden rounded-lg bg-muted shadow-md">
            {row.imageUrl ? (
              <Image src={row.imageUrl} alt={name} fill className="object-cover" sizes="72px" />
            ) : (
              <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground">{row.baseCode ?? row.cardCode}</div>
            )}
          </div>
        </Link>
        <div className="min-w-0 flex-1 py-0.5">
          <p className="text-[15px] font-semibold leading-snug">{name}</p>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/70">{row.baseCode ?? row.cardCode}</p>
          {row.currentPrice != null && (
            <div className="mt-3 flex items-center gap-2">
              <span className="font-price text-lg font-bold tabular-nums leading-none">
                <Price jpy={row.currentPrice} />
              </span>
              {pnlResult && (
                <span className={cn(
                  "rounded-full px-2 py-0.5 font-price text-[11px] font-semibold tabular-nums",
                  pnlResult.pnl >= 0 ? "bg-price-up/10 text-price-up" : "bg-price-down/10 text-price-down",
                )}>
                  {pnlResult.pnl >= 0 ? "+" : ""}{formatPct(pnlResult.pct)}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Editable fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">{t(lang, "quantity")}</label>
          <input
            className="w-full rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5 text-sm tabular-nums outline-none transition-all focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-primary/20"
            value={qty}
            onChange={(e) => onQtyChange(e.target.value)}
            type="number"
            min={1}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">{t(lang, "costBasis")}</label>
          <input
            className="w-full rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5 text-sm tabular-nums outline-none transition-all focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-primary/20"
            value={cost}
            onChange={(e) => onCostChange(e.target.value)}
            type="number"
            step="1"
            min={0}
            placeholder="—"
          />
        </div>
      </div>

      {/* Bottom row: privacy + delete */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPrivateChange(!isPrivate)}
          className="flex flex-1 items-center justify-between rounded-lg border border-border/25 px-3 py-2.5 transition-colors hover:bg-muted/30"
        >
          <div className="flex items-center gap-2">
            {isPrivate ? <EyeOff className="size-3.5 text-muted-foreground/60" /> : <Eye className="size-3.5 text-primary" />}
            <span className="text-xs text-foreground/70">{isPrivate ? t(lang, "privateCard") : t(lang, "unmarkPrivate")}</span>
          </div>
          <div className={cn("relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors", isPrivate ? "bg-muted-foreground/25" : "bg-primary")}>
            <span className={cn("pointer-events-none absolute top-0.5 inline-block size-4 rounded-full bg-white shadow-sm transition-transform", isPrivate ? "left-0.5" : "left-[18px]")} />
          </div>
        </button>
        <button
          onClick={() => void handleRemove()}
          className="shrink-0 rounded-lg border border-destructive/15 p-2.5 text-destructive/50 transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          title={t(lang, "remove")}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  )
}

function parseCostValue(raw: string): number | null | undefined {
  const trimmed = raw.trim()
  if (trimmed === "") return null
  const p = Math.round(parseFloat(trimmed))
  if (isNaN(p)) return undefined
  return p
}

/* ─── Bulk Edit Row (controlled by parent dialog) ─── */

function CardEditCompact({
  row,
  lang,
  qty,
  cost,
  isPrivate,
  onFieldChange,
  onRemove,
}: {
  row: AssetRow
  lang: Language
  qty: string
  cost: string
  isPrivate: boolean
  onFieldChange: (itemId: number, field: "qty" | "cost" | "isPrivate", value: string | boolean) => void
  onRemove: (itemId: number) => void
}) {
  const name = getCardName(lang as "TH" | "EN" | "JP", row)
  const confirm = useConfirm()

  const handleRemove = async () => {
    const ok = await confirm({ title: `${t(lang, "remove")} ${name}`, description: t(lang, "confirmRemoveCard"), confirmLabel: t(lang, "remove"), cancelLabel: t(lang, "cancel"), variant: "destructive" })
    if (ok) onRemove(row.itemId)
  }

  return (
    <div className="group rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border/20 hover:bg-muted/20">
      <div className="flex items-center gap-3">
        {/* Image */}
        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
          {row.imageUrl ? (
            <Image src={row.imageUrl} alt={name} fill className="object-contain" sizes="40px" />
          ) : (
            <div className="flex size-full items-center justify-center text-[8px] text-muted-foreground">{row.baseCode ?? row.cardCode}</div>
          )}
        </div>

        {/* Name + code */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium leading-tight">{name}</p>
          <p className="font-mono text-[10px] text-muted-foreground/60">{row.baseCode ?? row.cardCode}</p>
        </div>

        {/* Delete */}
        <button
          onClick={() => void handleRemove()}
          className="shrink-0 rounded-md p-1 text-muted-foreground/25 opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* Inline controls */}
      <div className="mt-2 flex items-center gap-2 pl-[52px]">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground/60">{t(lang, "quantity")}</span>
          <input
            className="w-14 shrink-0 rounded-md border border-border/30 bg-muted/30 px-2 py-1 text-center text-xs tabular-nums outline-none transition-all focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-primary/20"
            value={qty}
            onChange={(e) => onFieldChange(row.itemId, "qty", e.target.value)}
            type="number"
            min={1}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground/60">{t(lang, "costBasis")}</span>
          <input
            className="w-20 shrink-0 rounded-md border border-border/30 bg-muted/30 px-2 py-1 text-center text-xs tabular-nums outline-none transition-all focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-primary/20"
            value={cost}
            onChange={(e) => onFieldChange(row.itemId, "cost", e.target.value)}
            type="number"
            step="1"
            min={0}
            placeholder="—"
          />
        </div>
        <div className="ml-auto">
          <button
            onClick={() => onFieldChange(row.itemId, "isPrivate", !isPrivate)}
            className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors hover:bg-muted/50"
            title={isPrivate ? t(lang, "unmarkPrivate") : t(lang, "markAsPrivate")}
          >
            <span className={cn("text-[10px]", isPrivate ? "text-muted-foreground/50" : "text-primary/80")}>
              {isPrivate ? t(lang, "privateCard") : t(lang, "unmarkPrivate")}
            </span>
            <div className={cn("relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors", isPrivate ? "bg-muted-foreground/25" : "bg-primary")}>
              <span className={cn("pointer-events-none absolute top-0.5 inline-block size-3 rounded-full bg-white shadow-sm transition-transform", isPrivate ? "left-0.5" : "left-[14px]")} />
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Mobile Card ─── */

const MobileAssetCard = memo(function MobileAssetCard({
  row,
  lang,
  onUpdate,
  onEdit,
  onRemove,
}: {
  row: AssetRow
  lang: Language
  onUpdate: (
    itemId: number,
    data: { quantity?: number; purchasePrice?: number | null; isPrivate?: boolean },
  ) => void
  onEdit: () => void
  onRemove: () => void
}) {
  const currency = useUIStore((s) => s.currency)
  const name = getCardName(lang as "TH" | "EN" | "JP", row)
  const value = holdingValue(row)
  const pnlResult = pnlCalc(row)

  return (
    <div className="px-4 py-3.5">
      <div className="flex gap-3">
        <Link href={`/cards/${row.cardCode}`} className="shrink-0">
          <div className="relative size-14 overflow-hidden rounded-lg bg-muted">
            {row.imageUrl ? (
              <Image
                src={row.imageUrl}
                alt={name}
                fill
                className="object-contain"
                sizes="56px"
              />
            ) : (
              <div className="size-full bg-muted" />
            )}
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">{name}</p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {row.baseCode ?? row.cardCode}
                <span className="ml-1.5 text-foreground/60">×{row.quantity}</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center">
              <AssetActionMenu
                row={row}
                lang={lang}
                onEdit={onEdit}
                onRemove={onRemove}
              />
            </div>
          </div>
          <div className="mt-2 flex items-end justify-between gap-2">
            <div>
              <p className="font-price text-sm font-bold tabular-nums">
                <Price jpy={value} />
              </p>
              {row.currentPrice != null && (
                <p className="font-price text-[11px] tabular-nums text-muted-foreground">
                  @ <Price jpy={row.currentPrice} />
                </p>
              )}
            </div>
            {pnlResult && (
              <div className="text-right">
                <p
                  className={cn(
                    "font-price text-sm font-semibold tabular-nums",
                    pnlResult.pnl >= 0 ? "text-price-up" : "text-price-down",
                  )}
                >
                  {pnlResult.pnl >= 0 ? "+" : ""}
                  {formatJpyAmount(pnlResult.pnl, currency)}
                </p>
                <p
                  className={cn(
                    "font-price text-[11px] tabular-nums",
                    pnlResult.pct >= 0 ? "text-price-up/70" : "text-price-down/70",
                  )}
                >
                  ({pnlResult.pct >= 0 ? "+" : ""}
                  {formatPct(pnlResult.pct)}%)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

/* ─── Action Menu ─── */

function AssetActionMenu({
  row,
  lang,
  onEdit,
  onRemove,
}: {
  row: AssetRow
  lang: Language
  onEdit: () => void
  onRemove: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
        <DropdownMenuItem onClick={onEdit}>
          <Edit2 />
          {t(lang, "edit")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onRemove}>
          <Trash2 />
          {t(lang, "remove")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ─── Desktop Table Row ─── */

const AssetRowComponent = memo(function AssetRowComponent({
  row,
  lang,
  onUpdate,
  onEdit,
  onRemove,
}: {
  row: AssetRow
  lang: Language
  onUpdate: (
    itemId: number,
    data: { quantity?: number; purchasePrice?: number | null; isPrivate?: boolean },
  ) => void
  onEdit: () => void
  onRemove: () => void
}) {
  const currency = useUIStore((s) => s.currency)
  const name = getCardName(lang as "TH" | "EN" | "JP", row)
  const value = holdingValue(row)
  const pnlResult = pnlCalc(row)

  return (
    <tr className="group cursor-pointer border-b border-border/10 transition-colors hover:bg-muted/30">
      <td className="py-3.5 pl-5 pr-3 align-middle">
        <Link href={`/cards/${row.cardCode}`} className="flex items-center gap-3.5">
          <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted/60 ring-1 ring-border/20">
            {row.imageUrl ? (
              <Image
                src={row.imageUrl}
                alt={name}
                fill
                className="object-contain"
                sizes="44px"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-[9px] text-muted-foreground/40">
                {row.baseCode ?? row.cardCode}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{name}</p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/60">
              {row.baseCode ?? row.cardCode}
              <span className="ml-1.5 font-sans text-foreground/40">×{row.quantity}</span>
            </p>
          </div>
        </Link>
      </td>
      <td className="py-3.5 pr-3 text-right align-middle">
        <span className="font-price text-sm font-bold tabular-nums">
          <Price jpy={value} />
        </span>
      </td>
      <td className="py-3.5 pr-3 text-right align-middle">
        <span className="font-price text-xs tabular-nums text-muted-foreground/70">
          {row.currentPrice != null ? <Price jpy={row.currentPrice} /> : "—"}
        </span>
      </td>
      <td className="py-3.5 pr-3 text-right align-middle">
        <ChangeCell value={row.priceChange24h} />
      </td>
      <td className="hidden py-3.5 pr-3 text-right align-middle md:table-cell">
        <ChangeCell value={row.priceChange7d} />
      </td>
      <td className="py-3.5 pr-3 text-right align-middle">
        <span className="font-price text-xs tabular-nums text-muted-foreground/70">
          {row.purchasePrice != null
            ? formatJpyAmount(row.purchasePrice * row.quantity, currency)
            : "—"}
        </span>
      </td>
      <td className="py-3.5 pr-3 text-right align-middle">
        {pnlResult ? (
          <div>
            <p className={cn(
              "font-price text-xs font-bold tabular-nums leading-tight",
              pnlResult.pnl >= 0 ? "text-price-up" : "text-price-down",
            )}>
              {pnlResult.pnl >= 0 ? "+" : ""}
              {formatJpyAmount(pnlResult.pnl, currency)}
            </p>
            <p className={cn(
              "font-price text-[11px] tabular-nums leading-tight",
              pnlResult.pct >= 0 ? "text-price-up/60" : "text-price-down/60",
            )}>
              ({pnlResult.pct >= 0 ? "+" : ""}
              {formatPct(pnlResult.pct)}%)
            </p>
          </div>
        ) : (
          <span className="font-price text-xs text-muted-foreground/40">—</span>
        )}
      </td>
      <td className="py-3.5 pr-5 text-right align-middle">
        <div className="flex items-center justify-end">
          <AssetActionMenu
            row={row}
            lang={lang}
            onEdit={onEdit}
            onRemove={onRemove}
          />
        </div>
      </td>
    </tr>
  )
})

/* ─── Edit Dialog (single item — focused detail view) ─── */

function SingleEditDialog({
  open,
  onOpenChange,
  assets,
  focusItemId,
  onUpdate,
  onRemove,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  assets: AssetRow[]
  focusItemId: number
  onUpdate: (
    itemId: number,
    data: { quantity?: number; purchasePrice?: number | null; isPrivate?: boolean },
  ) => void
  onRemove: (itemId: number) => void
}) {
  const lang = useUIStore((s) => s.language)
  const row = assets.find((a) => a.itemId === focusItemId)
  const [qty, setQty] = useState("")
  const [cost, setCost] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [initialized, setInitialized] = useState<number | null>(null)

  if (row && initialized !== row.itemId) {
    setQty(String(row.quantity))
    setCost(row.purchasePrice != null ? String(row.purchasePrice) : "")
    setIsPrivate(row.isPrivate ?? false)
    setInitialized(row.itemId)
  }

  const dirty = useMemo(() => {
    if (!row) return false
    const parsedQty = parseInt(qty)
    const qtyChanged = Number.isInteger(parsedQty) && parsedQty >= 1 && parsedQty !== row.quantity
    const costVal = parseCostValue(cost)
    const costChanged = costVal !== undefined && costVal !== row.purchasePrice
    const privacyChanged = isPrivate !== row.isPrivate
    return qtyChanged || costChanged || privacyChanged
  }, [qty, cost, isPrivate, row])

  const handleSave = () => {
    if (!row) return
    const data: { quantity?: number; purchasePrice?: number | null; isPrivate?: boolean } = {}
    const q = parseInt(qty)
    if (Number.isInteger(q) && q >= 1 && q !== row.quantity) data.quantity = q
    const costVal = parseCostValue(cost)
    if (costVal !== undefined && costVal !== row.purchasePrice) data.purchasePrice = costVal
    if (isPrivate !== row.isPrivate) data.isPrivate = isPrivate
    if (Object.keys(data).length > 0) onUpdate(row.itemId, data)
    onOpenChange(false)
  }

  if (!row) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t(lang, "edit")}</DialogTitle>
        </DialogHeader>

        <CardEditFull
          row={row}
          lang={lang}
          qty={qty}
          onQtyChange={setQty}
          cost={cost}
          onCostChange={setCost}
          isPrivate={isPrivate}
          onPrivateChange={setIsPrivate}
          onRemove={(id) => { onRemove(id); onOpenChange(false) }}
        />

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {t(lang, "cancel")}
          </Button>
          <Button size="sm" disabled={!dirty} onClick={handleSave}>
            {t(lang, "save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Bulk Edit Dialog (list management view) ─── */

type RowEditState = { qty: string; cost: string; isPrivate: boolean }

function BulkEditDialog({
  open,
  onOpenChange,
  assets,
  onUpdate,
  onRemove,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  assets: AssetRow[]
  onUpdate: (
    itemId: number,
    data: { quantity?: number; purchasePrice?: number | null; isPrivate?: boolean },
  ) => void
  onRemove: (itemId: number) => void
}) {
  const lang = useUIStore((s) => s.language)
  const [bulkSearch, setBulkSearch] = useState("")
  const [edits, setEdits] = useState<Record<number, RowEditState>>({})

  const getRowState = useCallback((row: AssetRow): RowEditState => {
    if (edits[row.itemId]) return edits[row.itemId]
    return {
      qty: String(row.quantity),
      cost: row.purchasePrice != null ? String(row.purchasePrice) : "",
      isPrivate: row.isPrivate ?? false,
    }
  }, [edits])

  const handleFieldChange = useCallback((itemId: number, field: "qty" | "cost" | "isPrivate", value: string | boolean) => {
    setEdits(prev => {
      const row = assets.find(a => a.itemId === itemId)
      if (!row) return prev
      const current = prev[itemId] ?? {
        qty: String(row.quantity),
        cost: row.purchasePrice != null ? String(row.purchasePrice) : "",
        isPrivate: row.isPrivate,
      }
      return { ...prev, [itemId]: { ...current, [field]: value } }
    })
  }, [assets])

  const dirty = useMemo(() => {
    return assets.some(row => {
      const local = edits[row.itemId]
      if (!local) return false
      const parsedQty = parseInt(local.qty)
      const qtyChanged = Number.isInteger(parsedQty) && parsedQty >= 1 && parsedQty !== row.quantity
      const costVal = parseCostValue(local.cost)
      const costChanged = costVal !== undefined && costVal !== row.purchasePrice
      const privacyChanged = local.isPrivate !== row.isPrivate
      return qtyChanged || costChanged || privacyChanged
    })
  }, [edits, assets])

  const handleSave = () => {
    for (const row of assets) {
      const local = edits[row.itemId]
      if (!local) continue
      const data: { quantity?: number; purchasePrice?: number | null; isPrivate?: boolean } = {}
      const q = parseInt(local.qty)
      if (Number.isInteger(q) && q >= 1 && q !== row.quantity) data.quantity = q
      const costVal = parseCostValue(local.cost)
      if (costVal !== undefined && costVal !== row.purchasePrice) data.purchasePrice = costVal
      if (local.isPrivate !== row.isPrivate) data.isPrivate = local.isPrivate
      if (Object.keys(data).length > 0) onUpdate(row.itemId, data)
    }
    setEdits({})
    setBulkSearch("")
    onOpenChange(false)
  }

  const handleClose = () => {
    setEdits({})
    setBulkSearch("")
    onOpenChange(false)
  }

  const filteredBulk = useMemo(() => {
    if (!bulkSearch.trim()) return assets
    const q = bulkSearch.toLowerCase()
    return assets.filter((row) => {
      const name = getCardName(lang as "TH" | "EN" | "JP", row).toLowerCase()
      const code = (row.baseCode ?? row.cardCode).toLowerCase()
      return name.includes(q) || code.includes(q)
    })
  }, [assets, bulkSearch, lang])

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v) }}>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t(lang, "bulkEdit")}</DialogTitle>
          <DialogDescription>
            {assets.length} {t(lang, "card")}
          </DialogDescription>
        </DialogHeader>

        {/* Search within bulk edit */}
        {assets.length > 5 && (
          <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-muted/20 px-3 py-2">
            <Search className="size-3.5 shrink-0 text-muted-foreground/50" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
              placeholder={t(lang, "searchByNameOrCode")}
              value={bulkSearch}
              onChange={(e) => setBulkSearch(e.target.value)}
            />
            {bulkSearch && (
              <button onClick={() => setBulkSearch("")} className="rounded p-0.5 text-muted-foreground hover:text-foreground">
                <X className="size-3" />
              </button>
            )}
          </div>
        )}

        {/* Scrollable card list */}
        <div className="-mx-6 max-h-[50vh] overflow-y-auto px-4">
          {filteredBulk.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t(lang, "noResults")}</p>
          ) : (
            <div className="space-y-1 py-1">
              {filteredBulk.map((row) => {
                const state = getRowState(row)
                return (
                  <CardEditCompact
                    key={row.itemId}
                    row={row}
                    lang={lang}
                    qty={state.qty}
                    cost={state.cost}
                    isPrivate={state.isPrivate}
                    onFieldChange={handleFieldChange}
                    onRemove={onRemove}
                  />
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" size="sm" onClick={handleClose}>
            {t(lang, "cancel")}
          </Button>
          <Button size="sm" disabled={!dirty} onClick={handleSave}>
            {t(lang, "save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ChangeCell({ value, label }: { value?: number | null; label?: string }) {
  if (value == null)
    return label ? (
      <span className="font-price text-[11px] text-muted-foreground/60">
        {label} —
      </span>
    ) : (
      <span className="font-price text-xs text-muted-foreground">—</span>
    )
  return (
    <span
      className={cn(
        "font-price text-[11px] font-medium tabular-nums",
        value > 0
          ? "text-price-up"
          : value < 0
            ? "text-price-down"
            : "text-muted-foreground",
      )}
    >
      {label && <span className="mr-0.5 font-sans text-muted-foreground/60">{label}</span>}
      {value > 0 ? "+" : ""}
      {formatPct(value)}%
    </span>
  )
}
