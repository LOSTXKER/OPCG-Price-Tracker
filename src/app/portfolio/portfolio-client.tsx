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
import { PortfolioHero } from "@/components/portfolio/portfolio-hero"
import { PortfolioAssetsTable } from "@/components/portfolio/portfolio-assets-table"
import { PortfolioTransactions } from "@/components/portfolio/portfolio-transactions"
import { PortfolioShareDialog } from "@/components/portfolio/portfolio-share-dialog"
import { AddCardDialog } from "@/components/portfolio/add-card-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Surface } from "@/components/ui/surface"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

function PortfolioContent() {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [hideBalance, setHideBalance] = useState(false)
  const [txOpen, setTxOpen] = useState(false)
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

  // Game filter as quiet text tabs (the proto-D language). With one live game
  // the tabs collapse to the plain heading + a coming-soon teaser link.
  const gameTabs =
    availableGames.length >= 2 ? (
      <div className="flex items-center gap-4">
        {[
          { slug: ALL_GAMES, label: t(lang, "allGames") },
          ...availableGames.map((slug) => ({
            slug,
            label: getGameConfig(slug)?.shortName ?? slug.toUpperCase(),
          })),
        ].map((tab) => (
          <button
            key={tab.slug}
            type="button"
            onClick={() => setGameFilter(tab.slug)}
            className={cn(
              "relative pb-1 text-body-sm transition-colors",
              gameFilter === tab.slug
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {gameFilter === tab.slug && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
        <span className="text-meta tabular-nums">
          {assets.length} {t(lang, "card")}
        </span>
      </div>
    ) : undefined

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Action row: portfolio switcher · view actions · add card */}
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
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
      ) : (
        <>
          {/* Money band — ONE instrument: number + embedded stats on the left,
              the scrub chart paired on the right (Robinhood desktop). Mobile
              stacks: number → chart → table. */}
          <div className="gap-10 lg:grid lg:grid-cols-[minmax(300px,5fr)_7fr] lg:items-end">
            <div>
              <PortfolioHero
                valueJpy={heroValueJpy}
                deltaJpy={heroDeltaJpy}
                deltaPct={heroDeltaPct}
                hasPnl={heroHasPnl}
                live={!!activeScrub}
                hideBalance={hideBalance}
                scopeLabel={scopeGameName}
                scopeTint={gameFilter === ALL_GAMES ? null : getGameAccentTint(gameFilter)}
              />
              {/* Stats live WITH the number — not a separate slab */}
              <dl className="mt-5 space-y-2 border-t border-[var(--p-hair)] pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{t(lang, "costBasis")}</dt>
                  <dd className="font-price tabular-nums">
                    {hideBalance ? MASKED : formatJpyAmount(stats.totalCostJpy, currency)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{t(lang, "roi")}</dt>
                  <dd
                    className={cn(
                      "font-price tabular-nums",
                      stats.totalCostJpy > 0
                        ? stats.unrealizedPnlPercent >= 0
                          ? "text-price-up"
                          : "text-price-down"
                        : "text-muted-foreground",
                    )}
                  >
                    {stats.totalCostJpy > 0
                      ? `${stats.unrealizedPnlPercent >= 0 ? "+" : ""}${formatPct(stats.unrealizedPnlPercent, 1)}%`
                      : "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{t(lang, "quantity")}</dt>
                  <dd className="font-price tabular-nums">
                    {assets.reduce((s, a) => s + a.quantity, 0)} {t(lang, "card")}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 lg:mt-0">
              {gameFilter === ALL_GAMES ? (
                <PortfolioScrubChart data={history} onScrub={setScrub} hideBalance={hideBalance} />
              ) : (
                // No per-game history yet (snapshots are whole-portfolio) — one
                // honest line instead of a faked curve.
                <p className="text-meta text-muted-foreground/70">
                  {t(lang, "chartAllGamesOnly")}
                </p>
              )}
            </div>
          </div>

          {/* The collection — game tabs live in the table toolbar */}
          <PortfolioAssetsTable
            assets={assets}
            onUpdate={updateItem}
            onRemove={removeItem}
            hideBalance={hideBalance}
            showGameBadge={availableGames.length >= 2}
            leading={gameTabs}
          />
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

      {/* Centered modal — the owner vetoed bottom sheets app-wide. */}
      <Dialog open={txOpen} onOpenChange={setTxOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader className="pb-2">
            <DialogTitle>{t(lang, "transactionHistory")}</DialogTitle>
          </DialogHeader>
          <PortfolioTransactions
            transactions={transactions}
            onDelete={deleteTransaction}
            hideBalance={hideBalance}
          />
        </DialogContent>
      </Dialog>
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
