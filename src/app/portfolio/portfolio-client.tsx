"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronDown, Eye, EyeOff, Globe, Lock, Plus, Share2, Wallet } from "lucide-react"
import { toast } from "sonner"

import { KumaEmptyState } from "@/components/kuma/kuma-empty-state"
import { AuthPreviewGate } from "@/components/shared/login-gate"
import { Breadcrumb } from "@/components/shared/breadcrumb"
import { PageHeader } from "@/components/layout/page-header"
import { useAuthState } from "@/hooks/use-auth-state"
import { PortfolioSidebar } from "@/components/portfolio/portfolio-selector"
import { PortfolioHero, MiniSparkline } from "@/components/portfolio/portfolio-hero"
import { PortfolioInsights } from "@/components/portfolio/portfolio-insights"
import { PortfolioAssetsTable } from "@/components/portfolio/portfolio-assets-table"
import { PortfolioTransactions } from "@/components/portfolio/portfolio-transactions"
import { PortfolioShareDialog } from "@/components/portfolio/portfolio-share-dialog"
import { AddCardDialog } from "@/components/portfolio/add-card-dialog"
import { Price } from "@/components/shared/price-inline"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control"
import { Surface } from "@/components/ui/surface"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { t, type Language } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { usePortfolioApi } from "@/hooks/use-portfolio-api"
import { useTierLimits } from "@/hooks/use-tier-limits"
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog"
import { cn } from "@/lib/utils"
import { formatJpyAmount, formatPct } from "@/lib/utils/currency"
import type { CartItem } from "@/components/portfolio/add-card-types"

type TabId = "overview" | "insights" | "transactions"

export default function PortfolioClient() {
  const { authed } = useAuthState()
  const lang = useUIStore((s) => s.language)

  const header = (
    <PageHeader
      title={t(lang, "portfolioNav")}
      description={t(lang, "portfolioPageDesc")}
      breadcrumb={
        <Breadcrumb items={[{ label: t(lang, "home"), href: "/" }, { label: t(lang, "portfolioNav") }]} />
      }
    />
  )

  if (authed === null) {
    return (
      <>
        {header}
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
      </>
    )
  }

  if (authed === false) {
    return (
      <>
        {header}
        <AuthPreviewGate preview={<PortfolioMockPreview lang={lang} />} />
      </>
    )
  }

  return (
    <>
      {header}
      <PortfolioContent />
    </>
  )
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
  const [shareOpen, setShareOpen] = useState(false)
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
    setPortfolioVisibility,
    deletePortfolio,
    addCardsBatch,
    updateItem,
    removeItem,
    deleteTransaction,
  } = p

  const { openUpgradeDialog } = useUpgradeDialog()

  const totalCostAllPortfolios = portfolioMetas.reduce((s, p) => s + p.totalCost, 0)
  const totalPnlPctAll =
    totalCostAllPortfolios > 0
      ? ((totalAllPortfolios - totalCostAllPortfolios) / totalCostAllPortfolios) * 100
      : 0
  const hasOverallPnl = totalCostAllPortfolios > 0

  const addCardsBatchWithGate = useCallback(
    async (cartItems: CartItem[]) => {
      const res = await addCardsBatch(cartItems)
      if (res.limitReached) {
        openUpgradeDialog({ featureKey: "portfolioCards" })
      }
      return res
    },
    [addCardsBatch, openUpgradeDialog],
  )

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
      <div className="panel flex items-center overflow-hidden rounded-xl md:hidden">
        <button
          onClick={() => setSidebarSheetOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3 transition-colors active:bg-muted/40"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="size-5" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-semibold">
              {activePortfolio?.name ?? t(lang, "portfolio")}
            </p>
            <p className="font-price text-xs tabular-nums text-muted-foreground">
              {hideBalance ? (
                <>
                  ••••
                  {hasOverallPnl && (
                    <span
                      className={cn(
                        "ml-1.5 font-semibold",
                        totalPnlPctAll >= 0 ? "text-price-up" : "text-price-down",
                      )}
                    >
                      {totalPnlPctAll >= 0 ? "+" : ""}
                      {formatPct(totalPnlPctAll, 1)}%
                    </span>
                  )}
                </>
              ) : (
                formatJpyAmount(totalAllPortfolios, currency)
              )}
            </p>
          </div>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
        <div aria-hidden className="h-8 w-px shrink-0 bg-border/40" />
        <button
          onClick={() => setHideBalance(!hideBalance)}
          aria-label={hideBalance ? "Show balance" : "Hide balance"}
          className="flex size-[52px] shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground active:bg-muted/40"
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
          <SheetHeader className="pb-2">
            <SheetTitle>{t(lang, "portfolio")}</SheetTitle>
            {portfolioMetas.length > 1 && (
              <SheetDescription className="font-price tabular-nums">
                {t(lang, "overview")}{" "}
                {hideBalance ? (
                  <>
                    <span className="font-semibold text-foreground">••••••</span>
                    {hasOverallPnl && (
                      <span
                        className={cn(
                          "ml-1.5 font-semibold",
                          totalPnlPctAll >= 0 ? "text-price-up" : "text-price-down",
                        )}
                      >
                        {totalPnlPctAll >= 0 ? "+" : ""}
                        {formatPct(totalPnlPctAll, 1)}%
                      </span>
                    )}
                  </>
                ) : (
                  <span className="font-semibold text-foreground">
                    <Price jpy={totalAllPortfolios} />
                  </span>
                )}
              </SheetDescription>
            )}
          </SheetHeader>
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
                <p className="text-eyebrow text-muted-foreground/60">
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
              <div className="mt-2 flex items-baseline gap-2">
                {hideBalance ? (
                  <>
                    <p className="font-price text-xl font-extrabold tabular-nums tracking-tight">
                      ••••••
                    </p>
                    {hasOverallPnl && (
                      <span
                        className={cn(
                          "font-price text-sm font-bold tabular-nums",
                          totalPnlPctAll >= 0 ? "text-price-up" : "text-price-down",
                        )}
                      >
                        {totalPnlPctAll >= 0 ? "+" : ""}
                        {formatPct(totalPnlPctAll, 1)}%
                      </span>
                    )}
                  </>
                ) : (
                  <p className="font-price text-xl font-extrabold tabular-nums tracking-tight">
                    <Price jpy={totalAllPortfolios} />
                  </p>
                )}
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
                <p className="text-eyebrow text-muted-foreground/60">
                  {t(lang, "portfolio")}
                </p>
                {isFinite(limits.portfolioCount) && (
                  <span className="text-overlay tabular-nums text-muted-foreground/40">
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
          <SegmentedControl<TabId>
            ariaLabel={t(lang, "portfolio")}
            options={VALID_TABS.map<SegmentedOption<TabId>>((tabId) => ({
              value: tabId,
              label: t(
                lang,
                `${tabId}Tab` as "overviewTab" | "insightsTab" | "transactionsTab",
              ),
            }))}
            value={tab}
            onChange={setTab}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareOpen(true)}
              disabled={items.length === 0}
              className="gap-1.5"
              aria-label={t(lang, "sharePortfolio")}
              title={t(lang, "sharePortfolio")}
            >
              <Share2 className="size-4" />
              <span className="hidden sm:inline">{t(lang, "sharePortfolio")}</span>
            </Button>
            {activePortfolio ? (
              (() => {
                const portfolioPublic = activePortfolio.isPublic ?? true
                return (
                  <button
                    type="button"
                    onClick={async () => {
                      const next = !portfolioPublic
                      const ok = await setPortfolioVisibility(activePortfolio.id, next)
                      if (ok) {
                        toast.success(
                          t(lang, next ? "madePortfolioPublic" : "madePortfolioPrivate"),
                          { description: activePortfolio.name },
                        )
                      } else {
                        toast.error(t(lang, "loadFailed"))
                      }
                    }}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-3",
                      portfolioPublic
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400",
                    )}
                    aria-label={t(lang, portfolioPublic ? "portfolioPublic" : "portfolioPrivate")}
                    title={t(lang, "perPortfolioVisibility")}
                  >
                    {portfolioPublic ? (
                      <Globe className="size-3.5" />
                    ) : (
                      <Lock className="size-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {t(lang, portfolioPublic ? "portfolioPublic" : "portfolioPrivate")}
                    </span>
                  </button>
                )
              })()
            ) : null}
            <Button
              onClick={() => setDialogOpen(true)}
              size="sm"
              className="gap-1.5"
            >
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
              totalValueJpy={stats.totalValueJpy}
              totalCostJpy={stats.totalCostJpy}
              unrealizedPnl={stats.unrealizedPnl}
              unrealizedPnlPercent={stats.unrealizedPnlPercent}
              hideBalance={hideBalance}
              history={history}
              bestPerformer={stats.bestPerformer}
              worstPerformer={stats.worstPerformer}
            />

            <Surface variant="panel" padding="none" className="overflow-hidden">
              <PortfolioAssetsTable
                assets={assets}
                onUpdate={updateItem}
                onRemove={removeItem}
                hideBalance={hideBalance}
              />
            </Surface>
          </>
        ) : tab === "insights" ? (
          <PortfolioInsights history={history} allocation={allocation} />
        ) : (
          <PortfolioTransactions
            transactions={transactions}
            onDelete={deleteTransaction}
            hideBalance={hideBalance}
          />
        )}
      </main>

      <AddCardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAddBatch={addCardsBatchWithGate}
      />

      <PortfolioShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        portfolioName={activePortfolio?.name ?? t(lang, "portfolio")}
        stats={stats}
        history={history}
        assets={assets}
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
                  <p className="text-meta">¥12,300</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Wallet className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium">OP-09 Pulls</span>
                  <p className="text-meta">¥3,500</p>
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
        <div className="panel relative isolate overflow-hidden rounded-xl ring-1 ring-border/30">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full opacity-[0.14] blur-3xl sm:-right-24 sm:-top-24 sm:size-72 sm:opacity-[0.18]"
            style={{ background: "var(--color-price-up)" }}
          />
          <div className="relative p-5 sm:p-6">
            <p className="text-eyebrow text-muted-foreground/70">
              {t(lang, "portfolioValue")}
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <span className="font-price text-display">¥12,300</span>
              <span className="rounded-full bg-price-up/12 px-3 py-1 text-sm font-bold tabular-nums text-price-up sm:px-2.5 sm:text-xs">
                +10.8%
              </span>
            </div>
            <div className="mt-5 flex flex-wrap items-stretch gap-x-5 gap-y-3 sm:mt-6 sm:gap-x-7">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-eyebrow text-muted-foreground/60">
                  {t(lang, "unrealizedPnl")}
                </span>
                <span className="font-price text-sm font-bold tabular-nums text-price-up">
                  +¥1,200
                </span>
              </div>
              <div aria-hidden className="hidden w-px self-stretch bg-border/40 sm:block" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-eyebrow text-muted-foreground/60">
                  {t(lang, "costBasis")}
                </span>
                <span className="font-price text-sm font-semibold tabular-nums text-foreground/85">
                  ¥11,100
                </span>
              </div>
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
                  <p className="mt-0.5 font-mono text-meta text-muted-foreground/60">
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
