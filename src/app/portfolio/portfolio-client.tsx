"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Eye, EyeOff, Globe, Lock, Plus, Receipt, Share2 } from "lucide-react"
import { toast } from "sonner"

import { KumaEmptyState } from "@/components/kuma/kuma-empty-state"
import { AuthPreviewGate } from "@/components/shared/login-gate"
import { Breadcrumb } from "@/components/shared/breadcrumb"
import { PageHeader } from "@/components/layout/page-header"
import { useAuthState } from "@/hooks/use-auth-state"
import { PortfolioSwitcher } from "@/components/portfolio/portfolio-switcher"
import { PortfolioSidebar } from "@/components/portfolio/portfolio-selector"
import { PortfolioHero } from "@/components/portfolio/portfolio-hero"
import { PortfolioHeroPanel } from "@/components/portfolio/portfolio-hero-panel"
import { PortfolioAllocationPanel } from "@/components/portfolio/portfolio-allocation-panel"
import { PortfolioMovers } from "@/components/portfolio/portfolio-movers"
import { PortfolioGameChips } from "@/components/portfolio/portfolio-game-chips"
import { PortfolioGameBreakdown } from "@/components/portfolio/portfolio-game-breakdown"
import { PortfolioAssetsTable } from "@/components/portfolio/portfolio-assets-table"
import { PortfolioTransactions } from "@/components/portfolio/portfolio-transactions"
import { PortfolioShareDialog } from "@/components/portfolio/portfolio-share-dialog"
import { AddCardDialog } from "@/components/portfolio/add-card-dialog"
import { Button } from "@/components/ui/button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Skeleton } from "@/components/ui/skeleton"
import { Surface } from "@/components/ui/surface"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { t } from "@/lib/i18n"
import { formatJpyAmount, formatPct } from "@/lib/utils/currency"
import { MASKED } from "@/lib/constants/ui"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"
import { useGameFilterReset } from "@/hooks/use-game-filter"
import { ALL_GAMES, DEFAULT_GAME } from "@/lib/game/constants"
import { getGameConfig, getGameAccentTint } from "@/lib/game-config"
import { PortfolioMockPreview } from "./portfolio-mock-preview"
import { usePortfolioApi } from "@/hooks/use-portfolio-api"
import { useTierLimits } from "@/hooks/use-tier-limits"
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog"
import type { CartItem } from "@/components/portfolio/add-card-types"
import type { HistoryPoint } from "@/lib/types/portfolio"

const PortfolioScrubChart = dynamic(
  () =>
    import("@/components/portfolio/portfolio-scrub-chart").then(
      (m) => m.PortfolioScrubChart,
    ),
  {
    ssr: false,
    loading: () => <div className="h-44 animate-pulse rounded-xl bg-muted sm:h-56" />,
  },
)

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

  // Signed-in: skip the big page header (breadcrumb + title + blurb) — the nav
  // already marks Portfolio active, and the money should be the first thing on
  // screen (VISION §5.3 zone order). Keep an sr-only h1 for a11y.
  return (
    <>
      <h1 className="sr-only">{t(lang, "portfolioNav")}</h1>
      <PortfolioContent />
    </>
  )
}

type PortfolioTab = "overview" | "insights"

function PortfolioContent() {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [hideBalance, setHideBalance] = useState(false)
  const [txOpen, setTxOpen] = useState(false)
  // Overview = value + the collection · Insights = chart/by-game/movers/allocation.
  // Splitting analytics into its own tab is what keeps the overview un-cluttered.
  const [tab, setTab] = useState<PortfolioTab>("overview")
  // The point under the finger while scrubbing the value chart; null when idle.
  const [scrub, setScrub] = useState<HistoryPoint | null>(null)
  const { limits } = useTierLimits()
  // One unified portfolio across every game, filtered in-view by game. The filter
  // is PER-PAGE (local, session-only) — never shared with watchlist/alerts, so a
  // filter here can't strand the user on an empty list elsewhere.
  const [gameFilter, setGameFilter] = useState<string>(ALL_GAMES)

  const p = usePortfolioApi(gameFilter)

  useEffect(() => {
    if (txOpen) void p.loadTransactions()
  }, [txOpen, p.loadTransactions])

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
    gameBreakdown,
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

  // Games the user actually holds (value > 0) — the chip rail is built from these,
  // so the filter resets to "all" whenever the active game leaves the set.
  const availableGames = useMemo(
    () => gameBreakdown.filter((b) => b.valueJpy > 0).map((b) => b.game?.slug ?? DEFAULT_GAME),
    [gameBreakdown],
  )
  useGameFilterReset(gameFilter, availableGames, setGameFilter)

  // Short name of the filtered game (null in the all-games view) — labels the
  // hero so a scoped total never reads as the whole-portfolio value.
  const scopeGameName =
    gameFilter === ALL_GAMES
      ? null
      : getGameConfig(gameFilter)?.shortName ??
        gameBreakdown.find((b) => b.game?.slug === gameFilter)?.game?.nameEn ??
        gameFilter

  const { openUpgradeDialog } = useUpgradeDialog()

  const totalCostAllPortfolios = portfolioMetas.reduce((s, m) => s + m.totalCost, 0)
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

  // Scrub-bound hero. While dragging, show the historical market value and the
  // unrealized P/L *at that point* (value − money invested then) — honest, never
  // counting an inflow as a gain. Idle: the live total + live P/L.
  // The chart (and thus scrubbing) only shows in the all-games view — snapshots
  // aren't per-game yet. Ignore any lingering scrub once a game is filtered so
  // the hero reflects the scoped live total, not a stale chart point.
  const activeScrub = gameFilter === ALL_GAMES ? scrub : null
  const heroValueJpy = activeScrub ? activeScrub.value : stats.totalValueJpy
  const heroDeltaJpy = activeScrub ? activeScrub.value - activeScrub.netInvested : stats.unrealizedPnl
  const heroHasPnl = activeScrub ? activeScrub.netInvested > 0 : stats.totalCostJpy > 0
  const heroDeltaPct = activeScrub
    ? activeScrub.netInvested > 0
      ? ((activeScrub.value - activeScrub.netInvested) / activeScrub.netInvested) * 100
      : 0
    : stats.unrealizedPnlPercent

  if (loading) {
    return (
      <div className="space-y-5 sm:space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-12 w-56 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-44 w-full rounded-xl sm:h-56" />
        </div>
        <Surface variant="panel" className="grid grid-cols-2 overflow-hidden sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2 p-4">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </Surface>
        <div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[63/88] w-full rounded-xl" />
              <Skeleton className="mt-2 h-3.5 w-3/4" />
              <Skeleton className="mt-1.5 h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const portfolioPublic = activePortfolio?.isPublic ?? true

  const tabControl = (
    <SegmentedControl<PortfolioTab>
      options={[
        { value: "overview", label: t(lang, "overviewTab") },
        { value: "insights", label: t(lang, "insightsTab") },
      ]}
      value={tab}
      onChange={setTab}
      size="sm"
      ariaLabel={t(lang, "portfolio")}
    />
  )

  return (
    <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-6">
      {/* Desktop sidebar — all-portfolios overview + the portfolio list/manager
          (the live site's layout). Mobile keeps the switcher pill instead. */}
      <aside className="hidden lg:sticky lg:top-24 lg:block">
        {/* One quiet block — total on top, hairline, then the portfolio list.
            Two stacked boxes read as chrome; one reads as a sidebar. */}
        <Surface variant="panel" className="p-4">
          <p className="text-eyebrow">{t(lang, "allPortfolios")}</p>
          <p className="mt-1.5 font-price text-xl font-bold tabular-nums">
            {hideBalance ? MASKED : formatJpyAmount(totalAllPortfolios, currency)}
          </p>
          {hasOverallPnl && !hideBalance && (
            <p
              className={cn(
                "mt-0.5 font-price text-meta tabular-nums",
                totalPnlPctAll >= 0 ? "text-price-up" : "text-price-down",
              )}
            >
              {totalPnlPctAll >= 0 ? "+" : ""}
              {formatPct(totalPnlPctAll, 1)}%
            </p>
          )}
          <div className="mt-4 border-t border-[var(--p-hair)] pt-3">
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
        </Surface>
      </aside>

      <div className="min-w-0 space-y-5 sm:space-y-6">
      {/* Top bar: (mobile) switcher pill · (desktop) tabs · actions */}
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1 lg:hidden">
          <PortfolioSwitcher
            portfolios={portfolioMetas}
            activeId={activeId}
            activeName={activePortfolio?.name ?? t(lang, "portfolio")}
            onSelect={setActiveId}
            onCreate={createPortfolio}
            onRename={renamePortfolio}
            onDelete={deletePortfolio}
            totalAllPortfolios={totalAllPortfolios}
            totalPnlPctAll={totalPnlPctAll}
            hasOverallPnl={hasOverallPnl}
            hideBalance={hideBalance}
            totalVisible={gameFilter === ALL_GAMES}
            maxPortfolios={limits.portfolioCount}
          />
        </div>
        {items.length > 0 && <div className="hidden min-w-0 lg:block">{tabControl}</div>}
        <div className="hidden flex-1 lg:block" />

        <div className="flex shrink-0 items-center gap-1.5">
          <IconButton onClick={() => setTxOpen(true)} label={t(lang, "transactionHistory")}>
            <Receipt className="size-4" />
          </IconButton>

          <IconButton
            onClick={() => setHideBalance((v) => !v)}
            label={hideBalance ? t(lang, "showBalance") : t(lang, "hideBalance")}
          >
            {hideBalance ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </IconButton>

          <IconButton
            onClick={() => setShareOpen(true)}
            label={t(lang, "sharePortfolio")}
            disabled={items.length === 0}
          >
            <Share2 className="size-4" />
          </IconButton>

          {activePortfolio && (
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
              className="inline-flex size-9 items-center justify-center rounded-lg border border-[var(--p-hair)] bg-card text-muted-foreground ease-chrome transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={t(lang, portfolioPublic ? "portfolioPublic" : "portfolioPrivate")}
              title={t(lang, "perPortfolioVisibility")}
            >
              {portfolioPublic ? <Globe className="size-4" /> : <Lock className="size-4" />}
            </button>
          )}

          <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1.5">
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t(lang, "addCard")}</span>
          </Button>
        </div>
      </div>

      {/* Mobile tabs — full-width under the top bar */}
      {items.length > 0 && <div className="lg:hidden">{tabControl}</div>}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {items.length === 0 ? (
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
          {/* OVERVIEW — one hero card (value + P/L · Cost · Best · Worst),
              game chips, then the collection immediately. */}
          <PortfolioHeroPanel
            stats={stats}
            hideBalance={hideBalance}
            scopeLabel={scopeGameName}
            scopeTint={gameFilter === ALL_GAMES ? null : getGameAccentTint(gameFilter)}
          />
          <PortfolioGameChips
            breakdown={gameBreakdown}
            activeGame={gameFilter}
            onSelect={setGameFilter}
          />
          <PortfolioAssetsTable
            assets={assets}
            onUpdate={updateItem}
            onRemove={removeItem}
            hideBalance={hideBalance}
            showGameBadge={availableGames.length >= 2}
          />
        </>
      ) : (
        <>
          {/* INSIGHTS — history (scrub-bound value) → by-game → movers → allocation */}
          <Surface variant="panel" className="space-y-3 p-4 sm:p-5">
            <PortfolioHero
              valueJpy={heroValueJpy}
              deltaJpy={heroDeltaJpy}
              deltaPct={heroDeltaPct}
              hasPnl={heroHasPnl}
              live={!!activeScrub}
              hideBalance={hideBalance}
              scopeLabel={scopeGameName}
            />
            {gameFilter === ALL_GAMES ? (
              <PortfolioScrubChart data={history} onScrub={setScrub} hideBalance={hideBalance} />
            ) : (
              // No per-game history yet (snapshots are whole-portfolio) — one
              // honest line instead of a faked curve.
              <p className="text-meta text-muted-foreground/70">{t(lang, "chartAllGamesOnly")}</p>
            )}
          </Surface>

          {gameFilter === ALL_GAMES && (
            <PortfolioGameBreakdown
              breakdown={gameBreakdown}
              totalValueJpy={stats.totalValueJpy}
              onSelect={setGameFilter}
              hideBalance={hideBalance}
            />
          )}

          <Surface variant="panel" className="p-4 sm:p-5">
            <PortfolioMovers assets={assets} hideBalance={hideBalance} />
          </Surface>

          <PortfolioAllocationPanel allocation={allocation} />
        </>
      )}

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

      <Sheet open={txOpen} onOpenChange={setTxOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl pb-10">
          <SheetHeader className="pb-2">
            <SheetTitle>{t(lang, "transactionHistory")}</SheetTitle>
          </SheetHeader>
          <PortfolioTransactions
            transactions={transactions}
            onDelete={deleteTransaction}
            hideBalance={hideBalance}
          />
        </SheetContent>
      </Sheet>
      </div>
    </div>
  )
}

function IconButton({
  onClick,
  label,
  disabled,
  children,
}: {
  onClick: () => void
  label: string
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex size-9 items-center justify-center rounded-lg border border-[var(--p-hair)] bg-card text-muted-foreground ease-chrome transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}
