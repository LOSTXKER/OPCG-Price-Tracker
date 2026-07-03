"use client"

import { useCallback, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { ArrowDown, ArrowUp, Eye, EyeOff, Globe, Lock, Plus, Share2 } from "lucide-react"
import { toast } from "sonner"

import { KumaEmptyState } from "@/components/kuma/kuma-empty-state"
import { AuthPreviewGate } from "@/components/shared/login-gate"
import { Breadcrumb } from "@/components/shared/breadcrumb"
import { PageHeader } from "@/components/layout/page-header"
import { useAuthState } from "@/hooks/use-auth-state"
import { PortfolioSwitcher } from "@/components/portfolio/portfolio-switcher"
import { PortfolioHero } from "@/components/portfolio/portfolio-hero"
import { PortfolioAssetsTable } from "@/components/portfolio/portfolio-assets-table"
import { PortfolioGameBreakdown } from "@/components/portfolio/portfolio-game-breakdown"
import { PortfolioMovers } from "@/components/portfolio/portfolio-movers"
import { PortfolioAllocationPanel } from "@/components/portfolio/portfolio-allocation-panel"
import { PortfolioShareDialog } from "@/components/portfolio/portfolio-share-dialog"
import { AddCardDialog } from "@/components/portfolio/add-card-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
  // ภาพรวม = เงิน + ของสะสม (hero สด + KPI + holdings) · ข้อมูลเชิงลึก = analytics
  // (scrub chart + by-game + movers + allocation) — แยกให้ภาพรวมนิ่ง อ่านเร็ว
  const [tab, setTab] = useState<"overview" | "insights">("overview")
  // The point under the finger while scrubbing the value chart; null when idle.
  const [scrub, setScrub] = useState<HistoryPoint | null>(null)
  const { limits } = useTierLimits()
  // One unified portfolio across every game, filtered in-view by game. The filter
  // is PER-PAGE (local, session-only) — never shared with watchlist/alerts, so a
  // filter here can't strand the user on an empty list elsewhere.
  const [gameFilter, setGameFilter] = useState<string>(ALL_GAMES)

  const p = usePortfolioApi(gameFilter)

  const {
    history,
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
    // Mirrors the loaded overview tab (action row → underline tabs → hero
    // line → stat strip → holdings rows) so nothing jumps when data lands.
    return (
      <div className="space-y-5 sm:space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-12 w-56 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <div className="border-b border-[var(--p-hair)] pb-2.5">
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-11 w-64" />
        </div>
        <div className="flex gap-10 border-t border-[var(--p-hair)] pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
        <div className="space-y-3 border-t border-[var(--p-hair)] pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="aspect-[63/88] w-8 rounded" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="hidden h-4 w-16 sm:block" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const portfolioPublic = activePortfolio?.isPublic ?? true
  const multiGame = availableGames.length >= 2

  // Game filter as quiet text tabs (same grammar as the home market tab bar) —
  // lives in the holdings toolbar's leading slot. Single game = no tabs.
  const gameTabs = multiGame ? (
    <div className="flex items-center gap-4">
      {[
        { slug: ALL_GAMES, label: t(lang, "allGames"), tint: null as string | null },
        ...availableGames.map((slug) => ({
          slug,
          label: getGameConfig(slug)?.shortName ?? slug.toUpperCase(),
          tint: getGameAccentTint(slug),
        })),
      ].map((gt) => {
        const active = gameFilter === gt.slug
        return (
          <button
            key={gt.slug}
            type="button"
            onClick={() => setGameFilter(gt.slug)}
            className={cn(
              "ease-chrome relative flex items-center gap-1.5 pb-1 text-body-sm",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {gt.tint && (
              <span
                aria-hidden
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: gt.tint }}
              />
            )}
            {gt.label}
            {active && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        )
      })}
    </div>
  ) : undefined

  // Stats light up once there's a cost basis to compare against; otherwise
  // P/L and ROI read "—" instead of a fake 0%.
  const hasCost = stats.totalCostJpy > 0
  const pnlUp = stats.unrealizedPnl >= 0
  const totalQty = assets.reduce((s, a) => s + a.quantity, 0)

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
              className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground ease-chrome transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          {/* ═ Tabs — underline on a hairline baseline (same grammar as the
              home market tab bar; active border covers the hairline). ═ */}
          <div
            role="tablist"
            aria-label={t(lang, "portfolio")}
            className="flex items-center gap-1 border-b border-[var(--p-hair)]"
          >
            {(
              [
                { id: "overview" as const, label: t(lang, "overviewTab") },
                { id: "insights" as const, label: t(lang, "insightsTab") },
              ]
            ).map((tb) => (
              <button
                key={tb.id}
                type="button"
                role="tab"
                aria-selected={tab === tb.id}
                onClick={() => setTab(tb.id)}
                className={cn(
                  "ease-chrome relative -mb-px shrink-0 border-b-2 px-2.5 py-2.5 text-xs font-semibold",
                  tab === tb.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tb.label}
              </button>
            ))}
          </div>

          {tab === "overview" ? (
            <>
              {/* ═ Hero — one line on the bare canvas (card-detail grammar):
                  eyebrow → display number + delta + quiet meta. ═ */}
              <div className="relative">
                {gameFilter !== ALL_GAMES && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -left-4 -top-6 -z-10 h-24 w-56 rounded-full blur-2xl"
                    style={{
                      background: `color-mix(in srgb, ${getGameAccentTint(gameFilter)} 18%, transparent)`,
                    }}
                  />
                )}
                <p className="text-eyebrow">
                  {t(lang, "portfolioValue")}
                  {scopeGameName ? <span className="text-primary"> · {scopeGameName}</span> : null}
                </p>
                <div className="mt-2 flex flex-wrap items-end gap-x-2.5 gap-y-1">
                  <span className="tabular-nums text-display leading-none">
                    {hideBalance ? MASKED : formatJpyAmount(stats.totalValueJpy, currency)}
                  </span>
                  {hasCost && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 pb-0.5 text-sm font-semibold tabular-nums",
                        pnlUp ? "text-price-up" : "text-price-down",
                      )}
                    >
                      {pnlUp ? (
                        <ArrowUp className="size-3.5 shrink-0" aria-hidden />
                      ) : (
                        <ArrowDown className="size-3.5 shrink-0" aria-hidden />
                      )}
                      {hideBalance
                        ? MASKED
                        : `${pnlUp ? "+" : "-"}${formatJpyAmount(Math.abs(stats.unrealizedPnl), currency)}`}
                      <span className="font-normal opacity-70">
                        ({pnlUp ? "+" : ""}
                        {formatPct(stats.unrealizedPnlPercent, 1)}%)
                      </span>
                    </span>
                  )}
                  <span className="pb-0.5 text-meta">
                    {totalQty} {t(lang, "card")}
                  </span>
                </div>

                {/* Stat strip — flat labeled figures on one quiet line (buy-box
                    grammar), not a boxed KPI grid. */}
                <div className="mt-5 flex flex-wrap gap-x-10 gap-y-3 border-t border-[var(--p-hair)] pt-4">
                  <div>
                    <p className="text-eyebrow">{t(lang, "costBasis")}</p>
                    <p className="text-price tnum mt-1">
                      {hideBalance ? MASKED : formatJpyAmount(stats.totalCostJpy, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-eyebrow">{t(lang, "pnl")}</p>
                    <p
                      className={cn(
                        "text-price tnum mt-1 inline-flex items-center gap-1",
                        hasCost ? (pnlUp ? "text-price-up" : "text-price-down") : "text-muted-foreground",
                      )}
                    >
                      {hasCost &&
                        (pnlUp ? (
                          <ArrowUp className="size-3 shrink-0" aria-hidden />
                        ) : (
                          <ArrowDown className="size-3 shrink-0" aria-hidden />
                        ))}
                      {!hasCost
                        ? "—"
                        : hideBalance
                          ? MASKED
                          : `${pnlUp ? "+" : "-"}${formatJpyAmount(Math.abs(stats.unrealizedPnl), currency)}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-eyebrow">{t(lang, "roi")}</p>
                    <p
                      className={cn(
                        "text-price tnum mt-1 inline-flex items-center gap-1",
                        hasCost ? (pnlUp ? "text-price-up" : "text-price-down") : "text-muted-foreground",
                      )}
                    >
                      {hasCost &&
                        (pnlUp ? (
                          <ArrowUp className="size-3 shrink-0" aria-hidden />
                        ) : (
                          <ArrowDown className="size-3 shrink-0" aria-hidden />
                        ))}
                      {hasCost
                        ? `${pnlUp ? "+" : ""}${formatPct(stats.unrealizedPnlPercent, 1)}%`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* ═ Movers — quiet inline text rail (no chips, no rings) ═ */}
              {gameFilter === ALL_GAMES && (
                <PortfolioMovers assets={assets} hideBalance={hideBalance} variant="inline" />
              )}

              {/* ═ Holdings — game tabs live in the toolbar's leading slot ═ */}
              <PortfolioAssetsTable
                assets={assets}
                onUpdate={updateItem}
                onRemove={removeItem}
                hideBalance={hideBalance}
                showGameBadge={multiGame}
                leading={gameTabs}
              />
            </>
          ) : (
            <>
              {/* ═ Money band — scrub-bound hero paired with the chart (one
                  instrument, Robinhood-desktop). Stacks on mobile. ═ */}
              <div className="gap-8 lg:grid lg:grid-cols-[minmax(280px,5fr)_7fr] lg:items-end">
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
                <div className="mt-5 lg:mt-0">
                  {gameFilter === ALL_GAMES ? (
                    <PortfolioScrubChart data={history} onScrub={setScrub} hideBalance={hideBalance} />
                  ) : (
                    // No per-game history yet (snapshots are whole-portfolio) — one
                    // honest line instead of a faked curve.
                    <p className="flex h-44 items-center justify-center text-meta text-muted-foreground/70 sm:h-56">
                      {t(lang, "chartAllGamesOnly")}
                    </p>
                  )}
                </div>
              </div>

              {/* ═ By-game breakdown — deep-links into a game's scope ═ */}
              {gameFilter === ALL_GAMES && (
                <PortfolioGameBreakdown
                  breakdown={gameBreakdown}
                  totalValueJpy={stats.totalValueJpy}
                  onSelect={setGameFilter}
                  hideBalance={hideBalance}
                />
              )}

              {/* ═ Today's movers — flat section, whitespace-separated ═ */}
              <div className="border-t border-[var(--p-hair)] pt-5">
                <PortfolioMovers assets={assets} hideBalance={hideBalance} />
              </div>

              {/* ═ Allocation — top holdings share ═ */}
              <PortfolioAllocationPanel allocation={allocation} />
            </>
          )}
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
      className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground ease-chrome transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}
