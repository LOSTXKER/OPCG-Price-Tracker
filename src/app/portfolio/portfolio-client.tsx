"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronDown, Eye, EyeOff, Plus, Wallet } from "lucide-react"

import { KumaEmptyState } from "@/components/kuma/kuma-empty-state"
import { AuthPreviewGate } from "@/components/shared/login-gate"
import { useAuthState } from "@/hooks/use-auth-state"
import { PortfolioSidebar } from "@/components/portfolio/portfolio-selector"
import { PortfolioHero, MiniSparkline } from "@/components/portfolio/portfolio-hero"
import { PortfolioInsights } from "@/components/portfolio/portfolio-insights"
import { PortfolioAssetsTable } from "@/components/portfolio/portfolio-assets-table"
import { PortfolioTransactions } from "@/components/portfolio/portfolio-transactions"
import { AddCardDialog } from "@/components/portfolio/add-card-dialog"
import { Price } from "@/components/shared/price-inline"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { t, type Language } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { usePortfolioApi } from "@/hooks/use-portfolio-api"
import { useTierLimits } from "@/hooks/use-tier-limits"
import { formatJpyAmount } from "@/lib/utils/currency"

type TabId = "overview" | "insights" | "transactions"

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

const VALID_TABS: TabId[] = ["overview", "insights", "transactions"]

function getTabFromHash(): TabId {
  if (typeof window === "undefined") return "overview"
  const hash = window.location.hash.slice(1)
  return VALID_TABS.includes(hash as TabId) ? (hash as TabId) : "overview"
}

function PortfolioContent() {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const [tab, setTabState] = useState<TabId>(getTabFromHash)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [hideBalance, setHideBalance] = useState(false)
  const [sidebarSheetOpen, setSidebarSheetOpen] = useState(false)
  const { limits } = useTierLimits()

  const setTab = useCallback((id: TabId) => {
    setTabState(id)
    window.history.replaceState(null, "", id === "overview" ? window.location.pathname : `#${id}`)
  }, [])

  useEffect(() => {
    const onHashChange = () => setTabState(getTabFromHash())
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  const p = usePortfolioApi()

  useEffect(() => {
    if (tab === "transactions") void p.loadTransactions()
  }, [tab, p.loadTransactions])

  const {
    history,
    transactions,
    loading,
    error,
    activeId,
    setActiveId,
    activePortfolio,
    stats,
    allocation,
    assets,
    portfolioMetas,
    totalAllPortfolios,
    createPortfolio,
    renamePortfolio,
    deletePortfolio,
    addCardsBatch,
    updateItem,
    removeItem,
    deleteTransaction,
  } = p

  const items = activePortfolio?.items ?? []

  if (loading) {
    return (
      <div className="flex gap-6">
        <div className="hidden w-52 shrink-0 space-y-3 lg:block xl:w-56">
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-48 rounded-xl" />
          <div className="grid gap-3 lg:grid-cols-12">
            <Skeleton className="h-52 rounded-xl lg:col-span-7" />
            <Skeleton className="h-52 rounded-xl lg:col-span-5" />
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 md:flex-row md:gap-6">
      {/* ──── Mobile portfolio picker ──── */}
      <div className="flex items-center gap-2 md:hidden">
        <button
          onClick={() => setSidebarSheetOpen(true)}
          className="panel flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3.5 py-3 active:bg-muted/50"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="size-5" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-semibold">
              {activePortfolio?.name ?? t(lang, "portfolio")}
            </p>
            <p className="font-price text-xs tabular-nums text-muted-foreground">
              {hideBalance
                ? "••••"
                : formatJpyAmount(totalAllPortfolios, currency)}
            </p>
          </div>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
        <button
          onClick={() => setHideBalance(!hideBalance)}
          className="panel flex size-[46px] shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:text-foreground"
        >
          {hideBalance ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </button>
      </div>

      {/* ──── Mobile sidebar sheet ──── */}
      <Sheet open={sidebarSheetOpen} onOpenChange={setSidebarSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[75vh] overflow-y-auto rounded-t-2xl pb-10"
        >
          <SheetHeader>
            <SheetTitle>{t(lang, "portfolio")}</SheetTitle>
          </SheetHeader>
          <div className="mx-4 mb-4 rounded-xl bg-muted/40 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              {t(lang, "overview")}
            </p>
            <p className="mt-1 font-price text-2xl font-bold tabular-nums tracking-tight">
              {hideBalance ? "••••••" : <Price jpy={totalAllPortfolios} />}
            </p>
          </div>
          <PortfolioSidebar
            portfolios={portfolioMetas}
            activeId={activeId}
            onSelect={(id) => {
              setActiveId(id)
              setSidebarSheetOpen(false)
            }}
            onCreate={createPortfolio}
            onRename={renamePortfolio}
            onDelete={deletePortfolio}
            hideBalance={hideBalance}
            maxPortfolios={limits.portfolioCount}
          />
        </SheetContent>
      </Sheet>

      {/* ──── Desktop sidebar (consolidated single panel) ──── */}
      <aside className="hidden w-52 shrink-0 lg:block xl:w-56">
        <div className="lg:sticky lg:top-20">
          <div className="panel overflow-hidden rounded-xl">
            {/* Overview section */}
            <div className="p-4 pb-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {t(lang, "overview")}
                </p>
                <button
                  onClick={() => setHideBalance(!hideBalance)}
                  className="rounded-md p-1 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
                >
                  {hideBalance ? (
                    <EyeOff className="size-3.5" />
                  ) : (
                    <Eye className="size-3.5" />
                  )}
                </button>
              </div>
              <div className="mt-2 flex items-end gap-2">
                <p className="font-price text-xl font-extrabold tabular-nums tracking-tight">
                  {hideBalance ? (
                    "••••••"
                  ) : (
                    <Price jpy={totalAllPortfolios} />
                  )}
                </p>
              </div>
              {history.length >= 2 && (
                <div className="mt-2.5 h-7 w-full">
                  <MiniSparkline
                    data={history.slice(-14).map((d) => d.value)}
                    width={180}
                    height={28}
                    className="h-full w-full opacity-70"
                  />
                </div>
              )}
            </div>

            {/* Portfolio list section */}
            <div className="border-t border-border/20">
              <div className="flex items-center justify-between px-4 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {t(lang, "portfolio")}
                </p>
                {isFinite(limits.portfolioCount) && (
                  <span className="text-[10px] tabular-nums text-muted-foreground/40">
                    {portfolioMetas.length}/{limits.portfolioCount}
                  </span>
                )}
              </div>
              <PortfolioSidebar
                portfolios={portfolioMetas}
                activeId={activeId}
                onSelect={setActiveId}
                onCreate={createPortfolio}
                onRename={renamePortfolio}
                onDelete={deletePortfolio}
                hideBalance={hideBalance}
                maxPortfolios={limits.portfolioCount}
              />
            </div>

          </div>
        </div>
      </aside>

      {/* ──── Main content ──── */}
      <main className="min-w-0 flex-1 space-y-5 sm:space-y-6">
        {/* Top bar: tabs + add card */}
        <div className="flex items-center justify-between gap-3">
          <div
            role="tablist"
            className="flex items-center gap-1 rounded-xl bg-muted/50 p-1"
            onKeyDown={(e) => {
              const tabs = VALID_TABS
              const idx = tabs.indexOf(tab)
              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault()
                const next = tabs[(idx + 1) % tabs.length]
                setTab(next)
                ;(e.currentTarget.children[(idx + 1) % tabs.length] as HTMLElement)?.focus()
              } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault()
                const prev = tabs[(idx - 1 + tabs.length) % tabs.length]
                setTab(prev)
                ;(e.currentTarget.children[(idx - 1 + tabs.length) % tabs.length] as HTMLElement)?.focus()
              }
            }}
          >
            {VALID_TABS.map((tabId) => (
              <button
                key={tabId}
                role="tab"
                aria-selected={tab === tabId}
                tabIndex={tab === tabId ? 0 : -1}
                onClick={() => setTab(tabId)}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all",
                  tab === tabId
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/20"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(lang, `${tabId}Tab` as "overviewTab" | "insightsTab" | "transactionsTab")}
              </button>
            ))}
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            size="sm"
            className="gap-1.5 rounded-lg shadow-sm"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t(lang, "addCard")}</span>
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {items.length === 0 && tab === "overview" ? (
          <KumaEmptyState
            preset="empty-portfolio"
            action={
              <Button
                onClick={() => setDialogOpen(true)}
                className="gap-1.5"
              >
                <Plus className="size-4" />
                {t(lang, "addCard")}
              </Button>
            }
          />
        ) : tab === "overview" ? (
          <>
            <PortfolioHero
              portfolioName={
                activePortfolio?.name ?? t(lang, "portfolio")
              }
              totalValueJpy={stats.totalValueJpy}
              totalCostJpy={stats.totalCostJpy}
              unrealizedPnl={stats.unrealizedPnl}
              unrealizedPnlPercent={stats.unrealizedPnlPercent}
              hideBalance={hideBalance}
              cardCount={items.length}
              history={history}
              bestPerformer={stats.bestPerformer}
              worstPerformer={stats.worstPerformer}
            />

            <div className="panel overflow-hidden rounded-xl ring-1 ring-border/10">
              <PortfolioAssetsTable
                assets={assets}
                onUpdate={updateItem}
                onRemove={removeItem}
              />
            </div>
          </>
        ) : tab === "insights" ? (
          <PortfolioInsights history={history} allocation={allocation} />
        ) : (
          <div className="panel overflow-hidden rounded-xl">
            <div className="border-b border-border/40 px-4 py-3 sm:px-5">
              <p className="text-sm font-semibold">
                {t(lang, "transactionsTab")}
              </p>
            </div>
            <PortfolioTransactions transactions={transactions} onDelete={deleteTransaction} />
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
    <div className="flex flex-col gap-5 md:flex-row md:gap-6">
      {/* Mobile compact picker mock */}
      <div className="panel flex items-center gap-3 rounded-xl px-3.5 py-3 md:hidden">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Wallet className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Main Collection</p>
          <p className="font-price text-xs tabular-nums text-muted-foreground">
            ¥15,800
          </p>
        </div>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </div>

      <aside className="hidden w-52 shrink-0 lg:block xl:w-56">
        <div className="panel overflow-hidden rounded-xl">
          <div className="p-4">
            <p className="text-xs font-medium text-muted-foreground">
              {t(lang, "overview")}
            </p>
            <p className="mt-1 font-price text-xl font-bold tabular-nums tracking-tight">
              ¥15,800
            </p>
          </div>
          <div className="border-t border-border/30">
            <div className="px-4 py-2.5">
              <p className="text-xs font-medium text-muted-foreground">
                {t(lang, "portfolio")} (2)
              </p>
            </div>
            <div className="space-y-px p-1.5">
              <div className="flex items-center gap-3 rounded-lg bg-primary/6 px-3 py-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Wallet className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold">Main Collection</span>
                  <p className="text-xs text-muted-foreground">¥12,300</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Wallet className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium">OP-09 Pulls</span>
                  <p className="text-xs text-muted-foreground">¥3,500</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 space-y-4 sm:space-y-5">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-0.5 rounded-lg bg-muted/60 p-0.5">
            <span className="rounded-md bg-background px-3 py-1.5 text-sm font-medium shadow-sm">
              {t(lang, "overviewTab")}
            </span>
            <span className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground">
              {t(lang, "insightsTab")}
            </span>
            <span className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground">
              {t(lang, "transactionsTab")}
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t(lang, "addCard")}</span>
          </div>
        </div>

        {/* Hero mock */}
        <div className="panel panel-hero overflow-hidden rounded-xl">
          <div className="p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="text-base font-bold tracking-tight">Main Collection</span>
              <span className="rounded-full bg-primary/12 px-2.5 py-0.5 text-xs font-bold tabular-nums text-primary">
                8
              </span>
            </div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              {t(lang, "portfolioValue")}
            </p>
            <div className="mt-1.5 flex items-baseline gap-3">
              <span className="font-price text-3xl font-extrabold tabular-nums tracking-tighter sm:text-[2.75rem] sm:leading-none">
                ¥12,300
              </span>
              <span className="rounded-full bg-price-up/12 px-2.5 py-1 text-xs font-bold tabular-nums text-price-up">
                +10.8%
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px]">
              <span className="text-muted-foreground">
                {t(lang, "unrealizedPnl")}{" "}
                <span className="font-price font-bold tabular-nums text-price-up">+¥1,200</span>
              </span>
              <span className="hidden h-3.5 w-px bg-border/50 sm:block" />
              <span className="text-muted-foreground">
                {t(lang, "costBasis")}{" "}
                <span className="font-price font-semibold tabular-nums text-foreground/80">¥11,100</span>
              </span>
            </div>
          </div>
        </div>

        {/* Assets mock */}
        <div className="panel overflow-hidden rounded-xl ring-1 ring-border/10">
          <div className="flex items-center justify-between border-b border-border/30 px-5 py-3 sm:px-6">
            <div className="flex items-center gap-2.5">
              <p className="text-sm font-bold">{t(lang, "assets")}</p>
              <span className="rounded-full bg-primary/8 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary/80">
                8 {t(lang, "card")}
              </span>
            </div>
          </div>
          <div className="divide-y divide-border/10">
            {[
              { code: "OP09-001", name: "Monkey D. Luffy", price: "¥3,200" },
              { code: "OP09-019", name: "Roronoa Zoro", price: "¥2,800" },
              { code: "OP09-044", name: "Boa Hancock", price: "¥1,900" },
            ].map((row) => (
              <div
                key={row.code}
                className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-muted/30 sm:px-6"
              >
                <div className="size-11 rounded-lg bg-muted/60 ring-1 ring-border/20" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{row.name}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/60">
                    {row.code}
                  </p>
                </div>
                <p className="font-price text-sm font-bold tabular-nums">{row.price}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
