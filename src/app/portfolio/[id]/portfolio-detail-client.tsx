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
import { PortfolioHeroPanel } from "@/components/portfolio/portfolio-hero-panel"
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
import { SegmentedControl } from "@/components/ui/segmented-control"
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

type PortfolioTab = "overview" | "insights"

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
  // Overview = value + the collection · Insights = chart/by-game/movers/allocation.
  const [tab, setTab] = useState<PortfolioTab>("overview")
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
    <div className="space-y-4 sm:space-y-5">
      <h1 className="sr-only">{activePortfolio.name}</h1>

      {/* Top bar: portfolio switcher/management · tabs · page actions. */}
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
        {items.length > 0 && <div className="hidden min-w-0 md:block">{tabControl}</div>}
        <div className="hidden flex-1 md:block" />

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

      {/* Mobile/tablet tabs — full-width under the top bar */}
      {items.length > 0 && <div className="md:hidden">{tabControl}</div>}

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
      ) : tab === "overview" ? (
        <>
          {/* OVERVIEW — one hero card (value + P/L · Cost · Best · Worst),
              game chips, then the collection immediately. */}
          <PortfolioHeroPanel
            stats={stats}
            hideBalance={hideBalance}
            scopeLabel={scopeGameName}
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
              valueAvailable={activeScrub != null || stats.valuedCopyCount > 0}
              valuationComplete={activeScrub ? false : stats.valuationComplete}
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

          {stats.valuationComplete && (
            <PortfolioAllocationPanel allocation={allocation} hideBalance={hideBalance} />
          )}
        </>
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
