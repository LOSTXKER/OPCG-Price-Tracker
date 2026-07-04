"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Eye, EyeOff, Globe, Lock, Plus, Share2 } from "lucide-react"
import { toast } from "sonner"

import { KumaEmptyState } from "@/components/kuma/kuma-empty-state"
import { AuthPreviewGate } from "@/components/shared/login-gate"
import { Breadcrumb } from "@/components/shared/breadcrumb"
import { BackButton } from "@/components/shared/back-button"
import { useAuthState } from "@/hooks/use-auth-state"
import { PortfolioSwitcher } from "@/components/portfolio/portfolio-switcher"
import { PortfolioHero } from "@/components/portfolio/portfolio-hero"
import { PortfolioHeroPanel } from "@/components/portfolio/portfolio-hero-panel"
import { PortfolioAllocationPanel } from "@/components/portfolio/portfolio-allocation-panel"
import { PortfolioMovers } from "@/components/portfolio/portfolio-movers"
import { PortfolioGameChips } from "@/components/portfolio/portfolio-game-chips"
import { PortfolioGameBreakdown } from "@/components/portfolio/portfolio-game-breakdown"
import { PortfolioAssetsTable } from "@/components/portfolio/portfolio-assets-table"
import { PortfolioShareDialog } from "@/components/portfolio/portfolio-share-dialog"
import { AddCardDialog } from "@/components/portfolio/add-card-dialog"
import { Button } from "@/components/ui/button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Skeleton } from "@/components/ui/skeleton"
import { Surface } from "@/components/ui/surface"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { useGameFilterReset } from "@/hooks/use-game-filter"
import { ALL_GAMES, DEFAULT_GAME } from "@/lib/game/constants"
import { getGameConfig, getGameAccentTint } from "@/lib/game-config"
import { usePortfolioApi } from "@/hooks/use-portfolio-api"
import { useTierLimits } from "@/hooks/use-tier-limits"
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog"
import { PortfolioMockPreview } from "../portfolio-mock-preview"
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

type PortfolioTab = "overview" | "insights"

export default function PortfolioDetailClient({ portfolioId }: { portfolioId: number }) {
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

  return <PortfolioDetailContent portfolioId={portfolioId} />
}

function PortfolioDetailContent({ portfolioId }: { portfolioId: number }) {
  const lang = useUIStore((s) => s.language)
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [hideBalance, setHideBalance] = useState(false)
  // Overview = value + the collection · Insights = chart/by-game/movers/allocation.
  const [tab, setTab] = useState<PortfolioTab>("overview")
  // The point under the finger while scrubbing the value chart; null when idle.
  const [scrub, setScrub] = useState<HistoryPoint | null>(null)
  const { limits } = useTierLimits()
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
    totalAllPortfolios,
    createPortfolio,
    renamePortfolio,
    setPortfolioVisibility,
    deletePortfolio,
    addCardsBatch,
    updateItem,
    removeItem,
  } = p

  const availableGames = useMemo(
    () => gameBreakdown.filter((b) => b.valueJpy > 0).map((b) => b.game?.slug ?? DEFAULT_GAME),
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

  // Deleting the portfolio you're currently looking at has nowhere left to
  // render — send the user back to the hub instead of a dead detail page.
  const handleDelete = useCallback(
    async (id: number) => {
      const ok = await deletePortfolio(id)
      if (ok && id === portfolioId) router.push("/portfolio")
    },
    [deletePortfolio, portfolioId, router],
  )

  const items = activePortfolio?.items ?? []

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
          <Skeleton className="h-9 w-48 rounded-xl" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
        <Surface variant="panel" className="space-y-4 p-4 sm:p-5">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-56" />
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-[var(--p-hair)] pt-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </Surface>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="aspect-[63/88] w-11 rounded-md" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="space-y-1.5 text-right">
                <Skeleton className="ml-auto h-4 w-20" />
                <Skeleton className="ml-auto h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Not one of the signed-in user's own portfolios — deleted, or a bad/foreign
  // id. Soft in-page state (not a hard 404): the user is one click from home.
  if (!activePortfolio) {
    return (
      <KumaEmptyState
        preset="not-found"
        title={t(lang, "portfolioNotFound")}
        description={t(lang, "portfolioNotFoundDesc")}
        action={
          <Button render={<Link href="/portfolio" />}>{t(lang, "backToPortfolios")}</Button>
        }
      />
    )
  }

  const portfolioPublic = activePortfolio.isPublic ?? true

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
      <Breadcrumb
        items={[
          { label: t(lang, "home"), href: "/" },
          { label: t(lang, "portfolioNav"), href: "/portfolio" },
          { label: activePortfolio.name },
        ]}
        className="mb-0"
        hideMobileBack
      />

      {/* Top bar: back (mobile) · switcher (navigates between portfolios) · tabs
          · actions. PortfolioSwitcher renders the mobile pill / desktop dropdown
          internally. */}
      <div className="flex items-center gap-2">
        <BackButton href="/portfolio" label={t(lang, "portfolioNav")} className="md:hidden" />
        <div className="min-w-0 flex-1">
          <PortfolioSwitcher
            portfolios={portfolioMetas}
            activeId={activePortfolio.id}
            activeName={activePortfolio.name}
            onSelect={(id) => router.push(`/portfolio/${id}`)}
            onCreate={createPortfolio}
            onRename={renamePortfolio}
            onDelete={handleDelete}
            totalAllPortfolios={totalAllPortfolios}
            totalPnlPctAll={totalPnlPctAll}
            hasOverallPnl={hasOverallPnl}
            hideBalance={hideBalance}
            totalVisible={gameFilter === ALL_GAMES}
            maxPortfolios={limits.portfolioCount}
          />
        </div>
        {items.length > 0 && <div className="hidden min-w-0 md:block">{tabControl}</div>}
        <div className="hidden flex-1 md:block" />

        <div className="flex shrink-0 items-center gap-1.5">
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

          <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1.5">
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t(lang, "addCard")}</span>
          </Button>
        </div>
      </div>

      {/* Mobile/tablet tabs — full-width under the top bar */}
      {items.length > 0 && <div className="md:hidden">{tabControl}</div>}

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
        portfolioName={activePortfolio.name}
        stats={stats}
        history={history}
        assets={assets}
      />
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
