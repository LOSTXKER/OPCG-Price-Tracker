"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { ArrowDownLeft, ArrowUpRight, Coins, Receipt, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCardName, getLocale, t, type Language } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { formatJpyAmount } from "@/lib/utils/currency"
import { useConfirm } from "@/components/shared/confirm-dialog"
import { Surface } from "@/components/ui/surface"
import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control"
import { Toolbar, ToolbarSearch } from "@/components/ui/toolbar"
import { Button } from "@/components/ui/button"

export type { TransactionRow } from "@/lib/types/portfolio"
import type { TransactionRow } from "@/lib/types/portfolio"

type TypeKey = "BUY" | "SELL" | "REMOVE"
type FilterKey = "ALL" | TypeKey

const TYPE_META: Record<TypeKey, { labelKey: "buy" | "sell" | "remove"; pillClass: string; sign: "+" | "-" | ""; amountClass: string }> = {
  BUY: {
    labelKey: "buy",
    pillClass: "bg-price-down/10 text-price-down",
    sign: "-",
    amountClass: "text-price-down",
  },
  SELL: {
    labelKey: "sell",
    pillClass: "bg-price-up/10 text-price-up",
    sign: "+",
    amountClass: "text-price-up",
  },
  REMOVE: {
    labelKey: "remove",
    pillClass: "bg-muted text-muted-foreground",
    sign: "",
    amountClass: "text-muted-foreground",
  },
}

interface Props {
  transactions: TransactionRow[]
  onDelete?: (txId: number) => Promise<void>
  hideBalance?: boolean
}

export function PortfolioTransactions({ transactions, onDelete, hideBalance = false }: Props) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const locale = getLocale(lang)
  const confirm = useConfirm()
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<FilterKey>("ALL")

  const totals = useMemo(() => {
    let bought = 0
    let sold = 0
    for (const tx of transactions) {
      if (tx.pricePerUnit == null) continue
      const value = tx.pricePerUnit * tx.quantity
      if (tx.type === "BUY") bought += value
      else if (tx.type === "SELL") sold += value
    }
    return { bought, sold }
  }, [transactions])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return transactions.filter((tx) => {
      if (typeFilter !== "ALL" && tx.type !== typeFilter) return false
      if (!q) return true
      const name = getCardName(lang, tx.card).toLowerCase()
      const code = tx.card.cardCode.toLowerCase()
      return name.includes(q) || code.includes(q)
    })
  }, [transactions, typeFilter, query, lang])

  const grouped = useMemo(() => groupByDay(filtered, lang, locale), [filtered, lang, locale])

  if (transactions.length === 0) {
    return (
      <Surface variant="panel" padding="none" className="overflow-hidden">
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/60">
            <Receipt className="size-5" />
          </div>
          <p className="text-sm text-muted-foreground">{t(lang, "noTransactions")}</p>
        </div>
      </Surface>
    )
  }

  const handleDelete = async (tx: TransactionRow) => {
    if (!onDelete) return
    const ok = await confirm({
      title: t(lang, "deleteTransactionTitle"),
      description: t(lang, "deleteTransactionDesc"),
      confirmLabel: t(lang, "deleteFilter"),
      variant: "destructive",
    })
    if (!ok) return
    setDeletingId(tx.id)
    try {
      await onDelete(tx.id)
    } finally {
      setDeletingId(null)
    }
  }

  const filterOptions: SegmentedOption<FilterKey>[] = [
    { value: "ALL", label: t(lang, "filterAll") },
    { value: "BUY", label: t(lang, "buy") },
    { value: "SELL", label: t(lang, "sell") },
    { value: "REMOVE", label: t(lang, "remove") },
  ]

  const showDayHeaders = grouped.length > 1

  return (
    <div className="space-y-4 sm:space-y-5">
      <SummaryStrip
        bought={totals.bought}
        sold={totals.sold}
        count={transactions.length}
        hideBalance={hideBalance}
      />

      <Surface variant="panel" padding="none" className="overflow-hidden">
        <Toolbar
          right={
            <ToolbarSearch
              value={query}
              onValueChange={setQuery}
              collapsible
              open={searchOpen}
              onOpenChange={setSearchOpen}
              placeholder={t(lang, "searchByNameOrCode")}
              size="sm"
            />
          }
        >
          <p className="text-sm font-bold">{t(lang, "transactionsTab")}</p>
          <span className="rounded-full bg-primary/8 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary/80">
            {filtered.length}
          </span>
          <SegmentedControl<FilterKey>
            options={filterOptions}
            value={typeFilter}
            onChange={setTypeFilter}
            size="sm"
            variant="pill"
            ariaLabel={t(lang, "transactionsTab")}
            className="ml-1"
          />
        </Toolbar>

        {grouped.length === 0 ? (
          <NoMatch
            lang={lang}
            onReset={() => {
              setQuery("")
              setTypeFilter("ALL")
              setSearchOpen(false)
            }}
          />
        ) : (
          <div>
            {grouped.map((group) => (
              <section key={group.key}>
                {showDayHeaders && (
                  <header className="flex items-center justify-between bg-muted/15 px-4 py-2 sm:px-5">
                    <span className="text-eyebrow">{group.label}</span>
                    {group.dayNet !== 0 && (
                      <span
                        className={cn(
                          "font-price text-meta tabular-nums",
                          group.dayNet > 0 && "text-price-up",
                          group.dayNet < 0 && "text-price-down",
                        )}
                      >
                        {hideBalance
                          ? "••••"
                          : `${group.dayNet > 0 ? "+" : "-"}${formatJpyAmount(Math.abs(group.dayNet), currency)}`}
                      </span>
                    )}
                  </header>
                )}
                <div className="divide-y divide-[var(--p-hair)]">
                  {group.items.map((tx) => (
                    <TxRow
                      key={tx.id}
                      tx={tx}
                      lang={lang}
                      locale={locale}
                      currency={currency}
                      hideBalance={hideBalance}
                      isDeleting={deletingId === tx.id}
                      onDelete={onDelete ? () => handleDelete(tx) : undefined}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </Surface>
    </div>
  )
}

/* ── Summary strip ──────────────────────────────────────────────────── */

function SummaryStrip({
  bought,
  sold,
  count,
  hideBalance,
}: {
  bought: number
  sold: number
  count: number
  hideBalance: boolean
}) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const locale = getLocale(lang)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <SummaryCard
        icon={<ArrowDownLeft className="size-4" />}
        accent="bg-price-down/10 text-price-down"
        label={t(lang, "totalBought")}
        value={hideBalance ? "••••" : formatJpyAmount(bought, currency)}
        valueClass="text-price-down"
      />
      <SummaryCard
        icon={<ArrowUpRight className="size-4" />}
        accent="bg-price-up/10 text-price-up"
        label={t(lang, "totalSold")}
        value={hideBalance ? "••••" : formatJpyAmount(sold, currency)}
        valueClass="text-price-up"
      />
      <SummaryCard
        icon={<Coins className="size-4" />}
        accent="bg-primary/10 text-primary"
        label={t(lang, "transactionsTab")}
        value={count.toLocaleString(locale)}
      />
    </div>
  )
}

function SummaryCard({
  icon,
  accent,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode
  accent: string
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="panel flex items-center gap-3 rounded-xl px-4 py-3">
      <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", accent)}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-label text-muted-foreground">{label}</p>
        <p className={cn("font-price text-sm font-semibold tabular-nums", valueClass)}>{value}</p>
      </div>
    </div>
  )
}

/* ── Row ────────────────────────────────────────────────────────────── */

function TxRow({
  tx,
  lang,
  locale,
  currency,
  hideBalance,
  isDeleting,
  onDelete,
}: {
  tx: TransactionRow
  lang: Language
  locale: string
  currency: "THB" | "JPY" | "USD"
  hideBalance: boolean
  isDeleting: boolean
  onDelete?: () => void
}) {
  const typeKey: TypeKey = tx.type in TYPE_META ? (tx.type as TypeKey) : "REMOVE"
  const meta = TYPE_META[typeKey]
  const name = getCardName(lang, tx.card)
  const date = new Date(tx.createdAt)
  const total = tx.pricePerUnit != null ? tx.pricePerUnit * tx.quantity : null

  return (
    <div
      className={cn(
        "group ease-chrome flex items-center gap-3 px-4 py-3 hover:bg-foreground/[0.04] sm:px-5 sm:py-3.5",
        isDeleting && "pointer-events-none opacity-40",
      )}
    >
      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-[var(--p-hair)]">
        {tx.card.imageUrl ? (
          <Image src={tx.card.imageUrl} alt={name} fill className="object-contain" sizes="40px" />
        ) : (
          <div className="size-full bg-muted" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{name}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-meta">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-1.5 py-0.5 text-overlay uppercase tracking-wide",
              meta.pillClass,
            )}
          >
            {t(lang, meta.labelKey)}
          </span>
          <span className="truncate font-price tabular-nums">
            ×{tx.quantity}
            {tx.pricePerUnit != null && (
              <>
                {" "}
                <span className="text-muted-foreground/60">@</span>{" "}
                {hideBalance ? "••" : formatJpyAmount(tx.pricePerUnit, currency)}
              </>
            )}
          </span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        {total != null ? (
          <p className={cn("font-price text-sm font-semibold tabular-nums", meta.amountClass)}>
            {hideBalance
              ? "••••"
              : `${meta.sign}${formatJpyAmount(total, currency)}`}
          </p>
        ) : (
          <p className="font-price text-sm font-semibold tabular-nums text-muted-foreground">—</p>
        )}
        <p className="text-meta tabular-nums">
          {date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {onDelete && (
        <button
          onClick={onDelete}
          className="ease-chrome shrink-0 rounded-lg p-1.5 text-muted-foreground/70 transition-all hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          title={t(lang, "deleteFilter")}
          aria-label={t(lang, "deleteFilter")}
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  )
}

/* ── No-match state ─────────────────────────────────────────────────── */

function NoMatch({ lang, onReset }: { lang: Language; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="text-sm text-muted-foreground">{t(lang, "noMatchingTransactions")}</p>
      <Button type="button" variant="outline" size="sm" onClick={onReset}>
        {t(lang, "clearFilters")}
      </Button>
    </div>
  )
}

/* ── Grouping ───────────────────────────────────────────────────────── */

type DayGroup = {
  key: string
  label: string
  items: TransactionRow[]
  dayNet: number
}

function groupByDay(transactions: TransactionRow[], lang: Language, locale: string): DayGroup[] {
  if (transactions.length === 0) return []
  const today = startOfDay(new Date())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const groups = new Map<string, DayGroup>()

  for (const tx of transactions) {
    const d = new Date(tx.createdAt)
    const dayStart = startOfDay(d)
    const key = dayStart.toISOString().slice(0, 10)
    let group = groups.get(key)
    if (!group) {
      let label: string
      if (sameDay(dayStart, today)) label = t(lang, "dayToday")
      else if (sameDay(dayStart, yesterday)) label = t(lang, "dayYesterday")
      else
        label = d.toLocaleDateString(locale, {
          day: "numeric",
          month: "short",
          year: "2-digit",
        })
      group = { key, label, items: [], dayNet: 0 }
      groups.set(key, group)
    }
    group.items.push(tx)
    if (tx.pricePerUnit != null) {
      const value = tx.pricePerUnit * tx.quantity
      if (tx.type === "BUY") group.dayNet -= value
      else if (tx.type === "SELL") group.dayNet += value
    }
  }

  return Array.from(groups.values())
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
