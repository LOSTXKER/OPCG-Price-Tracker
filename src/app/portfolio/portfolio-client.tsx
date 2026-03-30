"use client"

import { useEffect, useState } from "react"
import { Eye, EyeOff, Plus } from "lucide-react"

import { KumaEmptyState } from "@/components/kuma/kuma-empty-state"
import { AuthPreviewGate } from "@/components/shared/login-gate"
import { useAuthState } from "@/hooks/use-auth-state"
import { PortfolioSidebar } from "@/components/portfolio/portfolio-selector"
import { PortfolioStatsStrip } from "@/components/portfolio/portfolio-stats-strip"
import { PortfolioHero } from "@/components/portfolio/portfolio-hero"
import { PortfolioCharts } from "@/components/portfolio/portfolio-charts"
import { PortfolioAssetsTable } from "@/components/portfolio/portfolio-assets-table"
import { PortfolioTransactions } from "@/components/portfolio/portfolio-transactions"
import { AddCardDialog } from "@/components/portfolio/add-card-dialog"
import { Price } from "@/components/shared/price-inline"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { t, type Language } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { usePortfolioApi } from "@/hooks/use-portfolio-api"

type TabId = "overview" | "transactions"

export default function PortfolioClient() {
  const { authed } = useAuthState()
  const lang = useUIStore((s) => s.language)

  if (authed === null) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (authed === false) {
    return <AuthPreviewGate preview={<PortfolioMockPreview lang={lang} />} />
  }

  return <PortfolioContent />
}

function PortfolioContent() {
  const lang = useUIStore((s) => s.language)
  const [tab, setTab] = useState<TabId>("overview")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [hideBalance, setHideBalance] = useState(false)

  const p = usePortfolioApi()

  useEffect(() => {
    if (tab === "transactions") void p.loadTransactions()
  }, [tab, p.loadTransactions])

  const {
    history, transactions, loading, error, activeId, setActiveId,
    activePortfolio, stats, allocation, assets, portfolioMetas,
    totalAllPortfolios, createPortfolio, renamePortfolio, deletePortfolio,
    addCardsBatch, updateItem, removeItem,
  } = p

  const items = activePortfolio?.items ?? []

  if (loading) {
    return (
      <div className="flex gap-6">
        <div className="hidden w-60 shrink-0 space-y-3 md:block">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
        <div className="min-w-0 flex-1 space-y-6">
          <Skeleton className="h-28 rounded-xl" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* ──── Sidebar ──── */}
      <aside className="w-full shrink-0 md:w-60">
        <div className="md:sticky md:top-20 md:space-y-4">
          {/* Total across all portfolios */}
          <div className="panel p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{t(lang, "overview")}</p>
              <button
                onClick={() => setHideBalance(!hideBalance)}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {hideBalance ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            <p className="mt-1 font-price text-2xl font-bold tabular-nums tracking-tight">
              {hideBalance ? "••••••" : <Price jpy={totalAllPortfolios} />}
            </p>
          </div>

          {/* Portfolio list */}
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
              <p className="text-[11px] font-medium text-muted-foreground">{t(lang, "portfolio")} ({portfolioMetas.length})</p>
            </div>
            <PortfolioSidebar
              portfolios={portfolioMetas}
              activeId={activeId}
              onSelect={setActiveId}
              onCreate={createPortfolio}
              onRename={renamePortfolio}
              onDelete={deletePortfolio}
              hideBalance={hideBalance}
            />
          </div>
        </div>
      </aside>

      {/* ──── Main content ──── */}
      <main className="min-w-0 flex-1 space-y-6">
        {/* Top bar: portfolio name + tabs + add button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{activePortfolio?.name ?? t(lang, "portfolio")}</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              {items.length} {t(lang, "card")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-lg bg-muted/60 p-0.5">
              {(["overview", "transactions"] as const).map((tabId) => (
                <button
                  key={tabId}
                  onClick={() => setTab(tabId)}
                  className={cn(
                    "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                    tab === tabId
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tabId === "overview" ? t(lang, "overviewTab") : t(lang, "transactionsTab")}
                </button>
              ))}
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
              <Plus className="size-4" />
              <span className="hidden sm:inline">{t(lang, "addCard")}</span>
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {items.length === 0 && tab === "overview" ? (
          <KumaEmptyState
            preset="empty-portfolio"
            action={
              <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
                <Plus className="size-4" />
                {t(lang, "addCard")}
              </Button>
            }
          />
        ) : tab === "overview" ? (
          <>
            {/* Hero value card */}
            <PortfolioHero
              totalValueJpy={stats.totalValueJpy}
              totalCostJpy={stats.totalCostJpy}
              unrealizedPnl={stats.unrealizedPnl}
              unrealizedPnlPercent={stats.unrealizedPnlPercent}
              hideBalance={hideBalance}
            />

            {/* Stats strip */}
            <PortfolioStatsStrip stats={stats} hideBalance={hideBalance} cardCount={items.length} />

            {/* Charts row */}
            <PortfolioCharts history={history} allocation={allocation} cardCount={items.length} />

            {/* Assets table */}
            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/40 px-5 py-3.5">
                <p className="text-sm font-semibold">{t(lang, "assets")}</p>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {assets.length} {t(lang, "card")}
                </span>
              </div>
              <PortfolioAssetsTable
                assets={assets}
                onUpdate={updateItem}
                onRemove={removeItem}
              />
            </div>
          </>
        ) : (
          <div className="panel overflow-hidden">
            <div className="border-b border-border/40 px-5 py-3.5">
              <p className="text-sm font-semibold">{t(lang, "transactionsTab")}</p>
            </div>
            <PortfolioTransactions transactions={transactions} />
          </div>
        )}
      </main>

      <AddCardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAddBatch={addCardsBatch}
      />
    </div>
  )
}

function PortfolioMockPreview({ lang }: { lang: Language }) {
  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <aside className="w-full shrink-0 md:w-60">
        <div className="md:space-y-4">
          <div className="panel p-4">
            <p className="text-xs font-medium text-muted-foreground">{t(lang, "overview")}</p>
            <p className="mt-1 font-price text-2xl font-bold tabular-nums tracking-tight">¥15,800</p>
          </div>
          <div className="panel overflow-hidden">
            <div className="border-b border-border/40 px-4 py-2.5">
              <p className="text-[11px] font-medium text-muted-foreground">{t(lang, "portfolio")} (2)</p>
            </div>
            <div className="space-y-px">
              <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5">
                <span className="text-sm font-medium">Main Collection</span>
                <span className="text-xs text-muted-foreground">¥12,300</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm font-medium">OP-09 Pulls</span>
                <span className="text-xs text-muted-foreground">¥3,500</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Main Collection</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">8 {t(lang, "card")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-lg bg-muted/60 p-0.5">
              <span className="rounded-md bg-background px-3.5 py-1.5 text-sm font-medium shadow-sm">{t(lang, "overviewTab")}</span>
              <span className="rounded-md px-3.5 py-1.5 text-sm font-medium text-muted-foreground">{t(lang, "transactionsTab")}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
              <Plus className="size-4" />
              <span className="hidden sm:inline">{t(lang, "addCard")}</span>
            </div>
          </div>
        </div>

        <div className="panel p-5">
          <p className="text-xs font-medium text-muted-foreground">{t(lang, "totalValue")}</p>
          <p className="mt-1 font-price text-3xl font-bold tabular-nums tracking-tight">¥12,300</p>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="text-green-500">+¥1,200 (+10.8%)</span>
            <span className="text-muted-foreground">Cost ¥11,100</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {["¥12,300", "¥11,100", "+¥1,200", "8"].map((v, i) => (
            <div key={i} className="panel p-4">
              <p className="text-xs text-muted-foreground">{["Value", "Cost", "P&L", "Cards"][i]}</p>
              <p className="mt-1 text-lg font-semibold">{v}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="panel flex h-40 items-center justify-center">
            <div className="h-24 w-full rounded bg-muted/40" />
          </div>
          <div className="panel flex h-40 items-center justify-center">
            <div className="size-24 rounded-full bg-muted/40" />
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/40 px-5 py-3.5">
            <p className="text-sm font-semibold">{t(lang, "assets")}</p>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">8 {t(lang, "card")}</span>
          </div>
          <div className="divide-y divide-border/40">
            {[
              { code: "OP09-001", name: "Monkey D. Luffy", price: "¥3,200" },
              { code: "OP09-019", name: "Roronoa Zoro", price: "¥2,800" },
              { code: "OP09-044", name: "Boa Hancock", price: "¥1,900" },
            ].map((row) => (
              <div key={row.code} className="flex items-center gap-3 px-5 py-3">
                <div className="size-10 rounded bg-muted" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{row.code}</p>
                </div>
                <p className="font-price text-sm font-semibold">{row.price}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
