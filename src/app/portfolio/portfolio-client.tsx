"use client"

import { useCallback, useState } from "react"
import { ArrowDown, ArrowUp, Eye, EyeOff, Lock, Plus } from "lucide-react"

import { KumaEmptyState } from "@/components/kuma/kuma-empty-state"
import { AuthPreviewGate } from "@/components/shared/login-gate"
import { Breadcrumb } from "@/components/shared/breadcrumb"
import { PageHeader } from "@/components/layout/page-header"
import { useAuthState } from "@/hooks/use-auth-state"
import { PortfolioHubCard } from "@/components/portfolio/portfolio-hub-card"
import { PortfolioGameBreakdown } from "@/components/portfolio/portfolio-game-breakdown"
import { PortfolioMovers } from "@/components/portfolio/portfolio-movers"
import { AddCardDialog } from "@/components/portfolio/add-card-dialog"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { PortfolioNameForm } from "@/components/portfolio/portfolio-name-form"
import { Skeleton } from "@/components/ui/skeleton"
import { Surface } from "@/components/ui/surface"
import { t } from "@/lib/i18n"
import { formatJpyAmount, formatPct } from "@/lib/utils/currency"
import { MASKED } from "@/lib/constants/ui"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"
import { usePortfolioApi } from "@/hooks/use-portfolio-api"
import { useTierLimits } from "@/hooks/use-tier-limits"
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog"
import { PortfolioMockPreview } from "./portfolio-mock-preview"
import type { CartItem } from "@/components/portfolio/add-card-types"

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
          <div className="h-8 w-48 animate-pulse rounded-sm bg-muted" />
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
      <PortfolioHubContent />
    </>
  )
}

/**
 * The hub — pick a portfolio, see the dashboard. This is deliberately NOT the
 * old single-page-with-a-switcher: each portfolio is a real destination at
 * `/portfolio/[id]` (bookmarkable, back-button-friendly), and this page is
 * only ever the picker + a cross-portfolio summary. No game filter, no tabs,
 * no per-portfolio chart — those live on the detail page where the numbers
 * are unambiguous (VISION honest-money: summing per-portfolio history across
 * portfolios of different ages would fabricate a curve, so the hub only shows
 * live totals, never a timeline).
 */
function PortfolioHubContent() {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const [hideBalance, setHideBalance] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { limits } = useTierLimits()
  const { openUpgradeDialog } = useUpgradeDialog()

  const {
    loading,
    error,
    portfolioMetas,
    totalAllPortfolios,
    allAssets,
    allGameBreakdown,
    createPortfolio,
    renamePortfolio,
    setPortfolioVisibility,
    deletePortfolio,
    addCardsBatch,
  } = usePortfolioApi()

  const totalCostAll = portfolioMetas.reduce((s, m) => s + m.totalCost, 0)
  const totalCards = portfolioMetas.reduce((s, m) => s + m.itemCount, 0)
  const hasOverallPnl = totalCostAll > 0
  const totalPnlPct = hasOverallPnl ? ((totalAllPortfolios - totalCostAll) / totalCostAll) * 100 : 0
  const pnlUp = totalPnlPct >= 0

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

  if (loading) {
    return (
      <div className="space-y-5 sm:space-y-6">
        <Surface variant="panel" className="space-y-3 p-4 sm:p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-3 w-32" />
        </Surface>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Surface key={i} variant="panel" className="space-y-3 p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-32" />
              <div className="flex gap-1.5">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="aspect-[63/88] w-7 rounded-sm" />
                ))}
              </div>
            </Surface>
          ))}
        </div>
      </div>
    )
  }

  const atLimit = limits.portfolioCount !== Infinity && portfolioMetas.length >= limits.portfolioCount

  if (portfolioMetas.length === 0) {
    return (
      <>
        <KumaEmptyState
          preset="empty-portfolio"
          action={
            <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
              <Plus className="size-4" />
              {t(lang, "addCard")}
            </Button>
          }
        />
        <AddCardDialog open={dialogOpen} onOpenChange={setDialogOpen} onAddBatch={addCardsBatchWithGate} />
      </>
    )
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Dashboard hero — sum of every portfolio. Glow follows the combined
          P/L direction honestly (never a game or brand color). */}
      <Surface variant="panel" className="relative overflow-hidden p-4 sm:p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-20 h-64 w-80 rounded-full blur-3xl"
          style={{
            background: `color-mix(in srgb, ${
              hasOverallPnl ? (pnlUp ? "var(--price-up)" : "var(--price-down)") : "var(--muted-foreground)"
            } 12%, transparent)`,
          }}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-eyebrow">{t(lang, "allPortfolios")}</p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="tabular-nums text-display leading-none">
                {hideBalance ? MASKED : formatJpyAmount(totalAllPortfolios, currency)}
              </span>
              {hasOverallPnl && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 pb-0.5 text-sm font-semibold tabular-nums",
                    pnlUp ? "text-price-up" : "text-price-down",
                  )}
                >
                  {pnlUp ? <ArrowUp className="size-3.5 shrink-0" /> : <ArrowDown className="size-3.5 shrink-0" />}
                  {hideBalance ? MASKED : `${pnlUp ? "+" : ""}${formatPct(totalPnlPct, 1)}%`}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-meta">
              {t(lang, "portfolioCountOnly").replace("{n}", String(portfolioMetas.length))} ·{" "}
              {totalCards} {t(lang, "card")}
            </p>
          </div>

          <IconButton
            onClick={() => setHideBalance((v) => !v)}
            aria-label={hideBalance ? t(lang, "showBalance") : t(lang, "hideBalance")}
          >
            {hideBalance ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </IconButton>
        </div>
      </Surface>

      {/* Portfolio picker — the hero of the page. Each card is a real link to
          /portfolio/[id]; the last tile creates a new one (or upsells at the
          plan limit). */}
      <div>
        <p className="mb-3 text-eyebrow">{t(lang, "selectPortfolio")}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {portfolioMetas.map((meta) => (
            <PortfolioHubCard
              key={meta.id}
              meta={meta}
              hideBalance={hideBalance}
              onRename={(id, name) => void renamePortfolio(id, name)}
              onDelete={(id) => void deletePortfolio(id)}
              onToggleVisibility={(id, next) => void setPortfolioVisibility(id, next)}
            />
          ))}

          {atLimit ? (
            <button
              type="button"
              onClick={() => openUpgradeDialog({ featureKey: "portfolioCount" })}
              className="ease-chrome flex min-h-[6.5rem] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-hair p-4 text-center transition-colors hover:bg-muted/40"
            >
              <Lock className="size-5 text-muted-foreground" />
              <span className="text-body-sm font-medium">
                {t(lang, "portfolioLimitUpTo").replace("{max}", String(limits.portfolioCount))}
              </span>
              <span className="text-micro font-semibold text-primary">
                {t(lang, "upgradeForMorePortfolios")} →
              </span>
            </button>
          ) : (
            <CreatePortfolioCard onCreate={(name) => void createPortfolio(name)} />
          )}
        </div>
      </div>

      {/* Cross-portfolio summary — by game + today's movers across every book. */}
      {allGameBreakdown.length > 1 && (
        <PortfolioGameBreakdown
          breakdown={allGameBreakdown}
          totalValueJpy={totalAllPortfolios}
          hideBalance={hideBalance}
        />
      )}

      {allAssets.length > 0 && (
        <Surface variant="panel" className="p-4 sm:p-5">
          <PortfolioMovers assets={allAssets} hideBalance={hideBalance} />
        </Surface>
      )}

      <AddCardDialog open={dialogOpen} onOpenChange={setDialogOpen} onAddBatch={addCardsBatchWithGate} />
    </div>
  )
}

function CreatePortfolioCard({ onCreate }: { onCreate: (name: string) => void }) {
  const lang = useUIStore((s) => s.language)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")

  if (creating) {
    return (
      <Surface variant="panel" className="p-4">
        <PortfolioNameForm
          size="md"
          lang={lang}
          placeholder={t(lang, "portfolioName")}
          value={name}
          onChange={setName}
          onSubmit={(n) => {
            onCreate(n)
            setName("")
            setCreating(false)
          }}
          onCancel={() => setCreating(false)}
        />
      </Surface>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setCreating(true)}
      className="ease-chrome flex min-h-[6.5rem] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-hair text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
    >
      <Plus className="size-5" />
      <span className="text-body-sm font-medium">{t(lang, "createPortfolio")}</span>
    </button>
  )
}

