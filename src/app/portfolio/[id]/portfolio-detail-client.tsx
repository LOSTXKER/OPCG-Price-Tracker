"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Eye, EyeOff, Plus, Share2 } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { AuthPreviewGate } from "@/components/shared/login-gate"
import { useAuthState } from "@/hooks/use-auth-state"
import { PortfolioSwitcher } from "@/components/portfolio/portfolio-switcher"
import { PortfolioHero } from "@/components/portfolio/portfolio-hero"
import { PortfolioKpis } from "@/components/portfolio/portfolio-kpis"
import { PortfolioAllocationPanel } from "@/components/portfolio/portfolio-allocation-panel"
import { PortfolioMovers } from "@/components/portfolio/portfolio-movers"
import { PortfolioGameChips } from "@/components/portfolio/portfolio-game-chips"
import { PortfolioGameBreakdown } from "@/components/portfolio/portfolio-game-breakdown"
import { PortfolioAssetsTable } from "@/components/portfolio/portfolio-assets-table"
import { PortfolioDetailSkeleton } from "@/components/portfolio/portfolio-detail-skeleton"
import { PortfolioShareDialog } from "@/components/portfolio/portfolio-share-dialog"
import { AddCardDialog } from "@/components/portfolio/add-card-dialog"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { Surface } from "@/components/ui/surface"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { useGameFilterReset } from "@/hooks/use-game-filter"
import { ALL_GAMES, DEFAULT_GAME } from "@/lib/game/constants"
import { getGameConfig } from "@/lib/game-config"
import {
  clearLastActivePortfolioId,
  setLastActivePortfolioId,
} from "@/lib/portfolio/last-active"
import { usePortfolioApi } from "@/hooks/use-portfolio-api"
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog"
import { PortfolioMockPreview } from "../portfolio-mock-preview"
import type { CartItem } from "@/components/portfolio/add-card-types"
import type { HistoryPoint } from "@/lib/types/portfolio"
import { getPortfolioIdAfterDelete } from "./portfolio-navigation"

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

export default function PortfolioDetailClient({
  portfolioId,
  openAddOnLoad = false,
}: {
  portfolioId: number
  openAddOnLoad?: boolean
}) {
  const { authed, error: authError, retry: retryAuth } = useAuthState()
  const lang = useUIStore((s) => s.language)

  if (authed === null) {
    if (authError) {
      return (
        <EmptyState
          preset="error"
          variant="error"
          lang={lang}
          action={<Button onClick={retryAuth}>{t(lang, "retry")}</Button>}
        />
      )
    }
    return <PortfolioDetailSkeleton />
  }

  if (authed === false) {
    return <AuthPreviewGate preview={<PortfolioMockPreview lang={lang} />} />
  }

  return (
    <PortfolioDetailContent
      portfolioId={portfolioId}
      openAddOnLoad={openAddOnLoad}
    />
  )
}

function PortfolioDetailContent({
  portfolioId,
  openAddOnLoad,
}: {
  portfolioId: number
  openAddOnLoad: boolean
}) {
  const lang = useUIStore((s) => s.language)
  const router = useRouter()
  const [manualDialogOpen, setDialogOpen] = useState(false)
  const dialogOpen = openAddOnLoad || manualDialogOpen
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const wasDialogOpenRef = useRef(dialogOpen)
  const [shareOpen, setShareOpen] = useState(false)
  const [deletedActiveId, setDeletedActiveId] = useState<number | null>(null)
  const hideBalance = useUIStore((s) => s.portfolioBalanceHidden)
  const setHideBalance = useUIStore((s) => s.setPortfolioBalanceHidden)
  // The point under the finger while scrubbing the value chart; null when idle.
  const [scrub, setScrub] = useState<HistoryPoint | null>(null)
  // Per-page game filter — local, session-only (never shared with watchlist/alerts).
  const [gameFilter, setGameFilter] = useState<string>(ALL_GAMES)

  const p = usePortfolioApi(gameFilter, portfolioId)

  const {
    history,
    loading,
    error,
    activePortfolio,
    stats,
    allocation,
    assets,
    gameBreakdown,
    portfolioMetas,
    portfolioQuota,
    totalAllPortfolios,
    createPortfolio,
    renamePortfolio,
    setPortfolioVisibility,
    deletePortfolio,
    addCardsBatch,
    updateItem,
    removeItem,
    reload,
  } = p

  const availableGames = useMemo(
    () => gameBreakdown.filter((b) => b.count > 0).map((b) => b.game?.slug ?? DEFAULT_GAME),
    [gameBreakdown],
  )
  useGameFilterReset(gameFilter, availableGames, setGameFilter)

  const scopeGameName =
    gameFilter === ALL_GAMES
      ? null
      : getGameConfig(gameFilter)?.shortName ??
        gameBreakdown.find((b) => b.game?.slug === gameFilter)?.game?.nameEn ??
        gameFilter

  const { openUpgradeDialog } = useUpgradeDialog()
  const maxPortfolios = portfolioQuota?.portfolioCount ?? Infinity

  // Only remember an id after the portfolio API confirms it belongs to the
  // signed-in user. A stale or foreign route id must never become the gateway
  // preference merely because it appeared in the URL.
  useEffect(() => {
    if (activePortfolio?.id === portfolioId) {
      setLastActivePortfolioId(portfolioId)
    }
  }, [activePortfolio?.id, portfolioId])

  useEffect(() => {
    if (wasDialogOpenRef.current && !dialogOpen) {
      addButtonRef.current?.focus()
    }
    wasDialogOpenRef.current = dialogOpen
  }, [dialogOpen])

  const handleAddDialogOpenChange = useCallback(
    (open: boolean) => {
      setDialogOpen(open)
      if (!open && openAddOnLoad) {
        router.replace(`/portfolio/${portfolioId}`, { scroll: false })
      }
    },
    [openAddOnLoad, portfolioId, router],
  )

  const addCardsBatchWithGate = useCallback(
    async (cartItems: CartItem[]) => {
      const res = await addCardsBatch(portfolioId, cartItems)
      if (res.limitReached) {
        openUpgradeDialog({ featureKey: "portfolioCards" })
      }
      return res
    },
    [addCardsBatch, openUpgradeDialog, portfolioId],
  )

  // Choose the next row in the stable API order, then the previous row. This
  // keeps deletion on the detail surface instead of bouncing through the
  // `/portfolio` gateway when another portfolio is already available.
  const handleDelete = useCallback(
    async (id: number) => {
      const nextPortfolioId = getPortfolioIdAfterDelete(
        portfolioMetas.map((portfolio) => portfolio.id),
        id,
      )
      // Keep the current detail mounted until replace navigation starts. A
      // pre-navigation reload would remove the active row and flash Not Found.
      const result = await deletePortfolio(id, {
        reloadAfter: id !== portfolioId,
      })
      if (result.ok && id === portfolioId) {
        setDeletedActiveId(id)
        if (nextPortfolioId == null) clearLastActivePortfolioId()
        router.replace(nextPortfolioId ? `/portfolio/${nextPortfolioId}` : "/portfolio")
        if (nextPortfolioId != null) void reload()
      }
      return result
    },
    [deletePortfolio, portfolioId, portfolioMetas, reload, router],
  )

  const items = activePortfolio?.items ?? []

  const activeScrub = gameFilter === ALL_GAMES ? scrub : null
  const heroValueJpy = activeScrub ? activeScrub.value : stats.totalValueJpy
  // Legacy snapshots do not record price/cost coverage. Scrubbing therefore
  // changes the estimated value only; deriving historical P/L would imply a
  // level of completeness the stored data cannot prove.
  const heroDeltaJpy = activeScrub ? null : stats.unrealizedPnl
  const heroDeltaPct = activeScrub ? null : stats.unrealizedPnlPercent
  const heroHasPnl = !activeScrub && stats.performanceComplete

  if (loading || deletedActiveId === portfolioId) {
    return <PortfolioDetailSkeleton />
  }

  if (error) {
    return (
      <EmptyState
        preset="error"
        variant="error"
        lang={lang}
        action={<Button onClick={() => void reload()}>{t(lang, "retry")}</Button>}
      />
    )
  }

  // Not one of the signed-in user's own portfolios — deleted, or a bad/foreign
  // id. Soft in-page state (not a hard 404): the user is one click from home.
  if (!activePortfolio) {
    return (
      <EmptyState
        preset="not-found"
        lang={lang}
        title={t(lang, "portfolioNotFound")}
        description={t(lang, "portfolioNotFoundDesc")}
        action={
          <Button onClick={() => router.replace("/portfolio")}>
            {t(lang, "backToPortfolios")}
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <h1 className="sr-only">{activePortfolio.name}</h1>

      {/* Top bar: portfolio switcher/management · page actions. */}
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <PortfolioSwitcher
            portfolios={portfolioMetas}
            activeId={activePortfolio.id}
            onSelect={(id) => router.push(`/portfolio/${id}`)}
            onCreate={createPortfolio}
            onCreatedPortfolio={(id) => router.replace(`/portfolio/${id}?add=1`)}
            onRename={renamePortfolio}
            onSetVisibility={setPortfolioVisibility}
            onDelete={handleDelete}
            totalAllPortfolios={totalAllPortfolios}
            hideBalance={hideBalance}
            totalVisible={gameFilter === ALL_GAMES}
            maxPortfolios={maxPortfolios}
          />
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <IconButton
            variant="solid"
            onClick={() => setHideBalance(!hideBalance)}
            aria-label={hideBalance ? t(lang, "showBalance") : t(lang, "hideBalance")}
          >
            {hideBalance ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </IconButton>

          <IconButton
            variant="solid"
            onClick={() => setShareOpen(true)}
            aria-label={t(lang, "sharePortfolio")}
            disabled={items.length === 0}
          >
            <Share2 className="size-4" />
          </IconButton>

          <Button
            ref={addButtonRef}
            onClick={() => setDialogOpen(true)}
            size="sm"
            aria-label={t(lang, "addCard")}
            className="gap-1.5 sm:min-h-11 md:min-h-0"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t(lang, "addCard")}</span>
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          preset="empty-portfolio"
          lang={lang}
          action={
            <Button
              onClick={() => setDialogOpen(true)}
              className="gap-1.5 sm:min-h-11 md:min-h-0"
            >
              <Plus className="size-4" />
              {t(lang, "addCard")}
            </Button>
          }
        />
      ) : (
        /* Single Robinhood-style page (VISION §5.3) — no more overview/insights
           tabs. Mobile: one column, hero → chart → KPI → movers → chips →
           holdings → by-game → allocation. Desktop (lg:): a two-zone grid
           (main + 320px rail) built with `display:contents` wrappers so every
           leaf mounts exactly once — `order-N`/`lg:order-none` reorders leaves
           into the mobile sequence, then each wrapper becomes a real block at
           `lg:` and its children fall back to normal DOM order inside it. */
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
          <div className="contents lg:block lg:min-w-0 lg:space-y-5">
            <div className="order-1 lg:order-none">
              <PortfolioHero
                valueJpy={heroValueJpy}
                deltaJpy={heroDeltaJpy}
                deltaPct={heroDeltaPct}
                hasPnl={heroHasPnl}
                valueAvailable={activeScrub != null || stats.valuedCopyCount > 0}
                valuationComplete={activeScrub ? false : stats.valuationComplete}
                live={!!activeScrub}
                hideBalance={hideBalance}
                scopeLabel={scopeGameName}
              />
            </div>

            <div className="order-2 lg:order-none">
              {gameFilter === ALL_GAMES ? (
                <PortfolioScrubChart data={history} onScrub={setScrub} hideBalance={hideBalance} />
              ) : (
                // No per-game history yet (snapshots are whole-portfolio) — one
                // honest line instead of a faked curve.
                <p className="text-meta text-muted-foreground/70">{t(lang, "chartAllGamesOnly")}</p>
              )}
            </div>

            {/* Quiet ticker-tape movers — mobile/tablet only; the desktop rail
                gets the fuller "list" variant instead (see below). */}
            <div className="order-4 lg:order-none lg:hidden">
              <PortfolioMovers assets={assets} hideBalance={hideBalance} variant="inline" />
            </div>

            <div className="order-5 lg:order-none">
              <PortfolioGameChips
                breakdown={gameBreakdown}
                activeGame={gameFilter}
                onSelect={setGameFilter}
              />
            </div>

            <div className="order-6 lg:order-none">
              <PortfolioAssetsTable
                assets={assets}
                onUpdate={updateItem}
                onRemove={removeItem}
                hideBalance={hideBalance}
                showGameBadge={availableGames.length >= 2}
              />
            </div>
          </div>

          <aside className="contents lg:block lg:space-y-6">
            <div className="order-3 lg:order-none">
              <PortfolioKpis stats={stats} hideBalance={hideBalance} />
            </div>

            {/* Desktop-only "list" movers — cheap to double-mount (pure memo
                over assets, no fetch); the mobile row above stays "inline". */}
            <div className="hidden lg:block">
              <Surface variant="panel" className="p-4">
                <PortfolioMovers assets={assets} hideBalance={hideBalance} variant="list" />
              </Surface>
            </div>

            {gameFilter === ALL_GAMES && (
              <div className="order-7 lg:order-none">
                <PortfolioGameBreakdown
                  breakdown={gameBreakdown}
                  totalValueJpy={stats.totalValueJpy}
                  onSelect={setGameFilter}
                  hideBalance={hideBalance}
                />
              </div>
            )}

            {stats.valuationComplete && (
              <div className="order-8 lg:order-none">
                <PortfolioAllocationPanel allocation={allocation} hideBalance={hideBalance} />
              </div>
            )}
          </aside>
        </div>
      )}

      <AddCardDialog
        open={dialogOpen}
        onOpenChange={handleAddDialogOpenChange}
        onAddBatch={addCardsBatchWithGate}
        portfolioName={activePortfolio.name}
      />

      <PortfolioShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        portfolioName={activePortfolio.name}
        stats={stats}
        history={history}
        assets={assets}
        hideBalance={hideBalance}
      />
    </div>
  )
}
