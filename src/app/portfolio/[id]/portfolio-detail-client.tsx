"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Plus, Share2 } from "lucide-react"
import { toast } from "sonner"

import { EmptyState } from "@/components/shared/empty-state"
import { AuthPreviewGate } from "@/components/shared/login-gate"
import { Breadcrumb } from "@/components/shared/breadcrumb"
import {
  getLimitPresentation,
  LimitCounter,
} from "@/components/shared/limit-counter"
import { PageHeader } from "@/components/layout/page-header"
import { useAuthState } from "@/hooks/use-auth-state"
import {
  getPortfolioCountLabel,
  PortfolioSwitcher,
} from "@/components/portfolio/portfolio-switcher"
import { PortfolioSidebar } from "@/components/portfolio/portfolio-selector"
import { PortfolioSummary } from "@/components/portfolio/portfolio-hero-panel"
import { PortfolioInsights } from "@/components/portfolio/portfolio-insights"
import { PortfolioGameChips } from "@/components/portfolio/portfolio-game-chips"
import { PortfolioAssetsTable } from "@/components/portfolio/portfolio-assets-table"
import { PortfolioDetailSkeleton } from "@/components/portfolio/portfolio-detail-skeleton"
import { PortfolioShareDialog } from "@/components/portfolio/portfolio-share-dialog"
import { AddCardDialog } from "@/components/portfolio/add-card-dialog"
import { PortfolioCreateDialog } from "@/components/portfolio/portfolio-create-dialog"
import { getPortfolioCreateCopy } from "@/components/portfolio/portfolio-create-copy"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { Surface } from "@/components/ui/surface"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { useGameFilterReset } from "@/hooks/use-game-filter"
import { DEFAULT_CARD_CONDITION } from "@/lib/constants/ui"
import { ALL_GAMES, DEFAULT_GAME } from "@/lib/game/constants"
import { getGameConfig, isGameSlugLaunchReady } from "@/lib/game-config"
import {
  clearLastActivePortfolioId,
  setLastActivePortfolioId,
} from "@/lib/portfolio/last-active"
import { usePortfolioApi } from "@/hooks/use-portfolio-api"
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog"
import { PortfolioMockPreview } from "../portfolio-mock-preview"
import type { CartItem } from "@/components/portfolio/add-card-types"
import { getPortfolioIdAfterDelete } from "./portfolio-navigation"

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
  const pageHeader = (
    <PageHeader
      title={t(lang, "portfolioNav")}
      description={t(lang, "portfolioPageDesc")}
      breadcrumb={
        <Breadcrumb
          items={[
            { label: t(lang, "home"), href: "/" },
            { label: t(lang, "portfolioNav") },
          ]}
        />
      }
    />
  )

  if (authed === null) {
    if (authError) {
      return (
        <>
          {pageHeader}
          <EmptyState
            preset="error"
            variant="error"
            lang={lang}
            action={<Button onClick={retryAuth}>{t(lang, "retry")}</Button>}
          />
        </>
      )
    }
    return (
      <>
        {pageHeader}
        <PortfolioDetailSkeleton />
      </>
    )
  }

  if (authed === false) {
    return (
      <>
        {pageHeader}
        <AuthPreviewGate preview={<PortfolioMockPreview lang={lang} />} />
      </>
    )
  }

  return (
    <>
      {pageHeader}
      <PortfolioDetailContent
        portfolioId={portfolioId}
        openAddOnLoad={openAddOnLoad}
      />
    </>
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
  const [createOpen, setCreateOpen] = useState(false)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const wasDialogOpenRef = useRef(dialogOpen)
  const [shareOpen, setShareOpen] = useState(false)
  const [deletedActiveId, setDeletedActiveId] = useState<number | null>(null)
  const hideBalance = useUIStore((s) => s.portfolioBalanceHidden)
  const setHideBalance = useUIStore((s) => s.setPortfolioBalanceHidden)
  // Overview = value + the collection · Insights = chart/by-game/movers/allocation.
  const [tab, setTab] = useState<PortfolioTab>("overview")
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
    allAssets,
    gameBreakdown,
    portfolioMetas,
    portfolioQuota,
    totalAllPortfolios,
    createPortfolio,
    renamePortfolio,
    setPortfolioVisibility,
    deletePortfolio,
    addCardsBatch,
    resetAddCardsBatchSession,
    updateItem,
    addLot,
    updateLot,
    removeLot,
    removeItem,
    reload,
  } = p

  const availableGames = useMemo(
    () => [
      ...new Set(
        gameBreakdown
          .filter((b) => b.count > 0)
          .map((b) => b.game?.slug ?? DEFAULT_GAME)
          .filter(isGameSlugLaunchReady),
      ),
    ],
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
  const maxPortfolioCards = portfolioQuota?.portfolioCards ?? Infinity

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
    async (cartItems: CartItem[], requestScopeId: string) => {
      const res = await addCardsBatch(portfolioId, cartItems, requestScopeId)
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
  const existingHoldingQuantities = useMemo(
    () =>
      Object.fromEntries(
        (activePortfolio?.items ?? [])
          .filter((item) => item.condition === DEFAULT_CARD_CONDITION)
          .map((item) => [item.card.id, item.quantity]),
      ),
    [activePortfolio?.items],
  )

  if (loading || deletedActiveId === portfolioId) {
    return <PortfolioDetailSkeleton tab={tab} />
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

  const switcher = (
    <PortfolioSwitcher
      portfolios={portfolioMetas}
      activeId={activePortfolio.id}
      onSelect={(id) => router.push(`/portfolio/${id}`)}
      onCreate={createPortfolio}
      onCreateRequest={() => setCreateOpen(true)}
      onCreatedPortfolio={(id) => router.replace(`/portfolio/${id}?add=1`)}
      onRename={renamePortfolio}
      onSetVisibility={setPortfolioVisibility}
      onDelete={handleDelete}
      totalAllPortfolios={totalAllPortfolios}
      hideBalance={hideBalance}
      totalVisible={gameFilter === ALL_GAMES}
      maxPortfolios={maxPortfolios}
    />
  )

  const actions = (
    <div className="flex shrink-0 items-center justify-end gap-2">
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

      {/* Label stays visible on phones too (เบส) — `size="sm"` already ships the
          44px mobile min-height and its own padding, so no width override. */}
      <Button
        ref={addButtonRef}
        onClick={() => setDialogOpen(true)}
        size="sm"
      >
        <Plus className="size-4" />
        {t(lang, "addCard")}
      </Button>
    </div>
  )

  const portfolioCountLabel = getPortfolioCountLabel(
    lang,
    portfolioMetas.length,
    maxPortfolios,
  )
  const holdingsQuota = (
    <LimitCounter
      variant="inline"
      label={t(lang, "portfolioHoldingsQuota")}
      current={allAssets.length}
      max={maxPortfolioCards}
    />
  )
  const holdingsQuotaPresentation = getLimitPresentation(
    allAssets.length,
    maxPortfolioCards,
  )
  const showEmptyHoldingsQuota =
    holdingsQuotaPresentation.isHigh || holdingsQuotaPresentation.isFull
  // The scope row (when it renders) already opens the gap under the rail rule,
  // so the panels take the smaller step instead of stacking two full gaps.
  const tabPanelPadding =
    availableGames.length > 0 ? "pt-3" : "pt-4 sm:pt-5"

  return (
    <div data-slot="portfolio-detail">
      <h2 className="sr-only">{activePortfolio.name}</h2>

      <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-6">
        <aside
          className="hidden lg:sticky lg:top-24 lg:block"
          data-slot="portfolio-detail-sidebar"
        >
          <Surface variant="panel" padding="none" className="overflow-hidden">
            <div className="px-4 pb-2 pt-4">
              <p className="text-eyebrow tabular-nums">{portfolioCountLabel}</p>
            </div>
            <PortfolioSidebar
              portfolios={portfolioMetas}
              activeId={activePortfolio.id}
              onSelect={(id) => router.push(`/portfolio/${id}`)}
              onCreateRequest={() => setCreateOpen(true)}
              onRename={renamePortfolio}
              onSetVisibility={setPortfolioVisibility}
              onDelete={handleDelete}
              hideBalance={hideBalance}
              maxPortfolios={maxPortfolios}
            />
          </Surface>
        </aside>

        <div className="min-w-0 space-y-4 sm:space-y-5">
          {items.length === 0 ? (
            <>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="min-w-0 lg:hidden">{switcher}</div>
                <div className="col-start-2">{actions}</div>
              </div>
              <EmptyState
                preset="empty-portfolio"
                lang={lang}
                action={
                  <div className="flex flex-col items-center gap-1.5">
                    <Button
                      onClick={() => setDialogOpen(true)}
                      className="min-h-11 gap-1.5 md:min-h-10"
                    >
                      <Plus className="size-4" />
                      {t(lang, "addCard")}
                    </Button>
                    {showEmptyHoldingsQuota ? holdingsQuota : null}
                  </div>
                }
              />
            </>
          ) : (
            <Tabs
              value={tab}
              onValueChange={(value) =>
                setTab(value === "insights" ? "insights" : "overview")
              }
              className="gap-0"
            >
              <div
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0 md:border-b md:border-hair lg:grid-cols-[auto_minmax(0,1fr)]"
                data-slot="portfolio-detail-toolbar"
              >
                <div className="col-start-1 row-start-1 min-w-0 lg:hidden">
                  {switcher}
                </div>

                {/* Tabs stay 44px tall at every width so their bottom edge is
                    flush with the rail rule — the active indicator then covers
                    the hairline (`-bottom-px`) instead of stacking a second line
                    above it, and the 36px action buttons keep real clearance
                    from the rule (เบส: เส้นขั้นวางไม่สวย). */}
                <TabsList
                  variant="line"
                  aria-label={t(lang, "portfolio")}
                  className="col-span-2 row-start-2 w-full justify-start gap-1 border-b border-hair p-0 group-data-horizontal/tabs:h-11 md:col-span-1 md:col-start-1 md:border-b-0 lg:row-start-1 lg:w-auto"
                >
                  <TabsTrigger
                    value="overview"
                    className="min-h-11 flex-none px-3.5 group-data-horizontal/tabs:after:-bottom-px"
                  >
                    {t(lang, "overviewTab")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="insights"
                    className="min-h-11 flex-none px-3.5 group-data-horizontal/tabs:after:-bottom-px"
                  >
                    {t(lang, "insightsTab")}
                  </TabsTrigger>
                </TabsList>

                <div className="col-start-2 row-start-1 lg:col-start-2">
                  {actions}
                </div>
              </div>

              {/* Scope filter belongs to the DATA, not the tab rail: wedged
                  between the tabs and the actions it read as a third tab
                  (เบส: ไว้ตรงนี้ไม่ค่อยเหมาะ). One instance below the rule
                  serves both tabs and keeps the same slot at every width. */}
              {availableGames.length > 0 && (
                <div
                  className="pt-3 sm:pt-4"
                  data-slot="portfolio-detail-game-filter"
                >
                  <PortfolioGameChips
                    breakdown={gameBreakdown}
                    activeGame={gameFilter}
                    onSelect={setGameFilter}
                  />
                </div>
              )}

              <TabsContent
                value="overview"
                className={tabPanelPadding}
                data-slot="portfolio-overview"
              >
                <div className="space-y-4 sm:space-y-5">
                  <PortfolioSummary
                    stats={stats}
                    hideBalance={hideBalance}
                    scopeLabel={scopeGameName}
                  />

                  <Surface
                    as="section"
                    variant="panel"
                    padding="none"
                    className="overflow-hidden p-4 sm:p-5"
                    data-slot="portfolio-assets-panel"
                  >
                    <PortfolioAssetsTable
                      assets={assets}
                      onUpdate={updateItem}
                      onAddLot={addLot}
                      onUpdateLot={updateLot}
                      onRemoveLot={removeLot}
                      onRemoveItem={removeItem}
                      hideBalance={hideBalance}
                      showGameBadge={availableGames.length >= 2}
                      quotaCurrent={allAssets.length}
                      quotaMax={maxPortfolioCards}
                    />
                  </Surface>
                </div>
              </TabsContent>

              <TabsContent value="insights" className={tabPanelPadding}>
                <PortfolioInsights
                  history={history}
                  assets={assets}
                  allocation={allocation}
                  gameBreakdown={gameBreakdown}
                  stats={stats}
                  scopeLabel={scopeGameName}
                  gameFilter={gameFilter}
                  onGameSelect={setGameFilter}
                  hideBalance={hideBalance}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      <AddCardDialog
        open={dialogOpen}
        onOpenChange={handleAddDialogOpenChange}
        onAddBatch={addCardsBatchWithGate}
        onEndSession={resetAddCardsBatchSession}
        portfolioName={activePortfolio.name}
        existingHoldingQuantities={existingHoldingQuantities}
      />

      <PortfolioCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={createPortfolio}
        onCreated={(result, input) => {
          toast.success(t(lang, "portfolioCreated"), { description: input.name })
          router.replace(`/portfolio/${result.data.id}?add=1`)
        }}
        title={t(lang, "createPortfolioTitle")}
        description={t(lang, "createPortfolioDesc")}
        copy={getPortfolioCreateCopy(lang, t(lang, "createAndAddCards"))}
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
