"use client"

import { useState } from "react"
import { Briefcase, Check, ChevronDown, Lock, Plus, Settings2 } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { formatJpyAmount, formatPct } from "@/lib/utils/currency"
import { MASKED } from "@/lib/constants/ui"
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog"
import { PortfolioSidebar } from "./portfolio-selector"
import type { PortfolioMeta } from "@/lib/types/portfolio"

interface PortfolioSwitcherProps {
  portfolios: PortfolioMeta[]
  activeId: number | null
  activeName: string
  onSelect: (id: number) => void
  onCreate: (name: string) => void
  onRename: (id: number, name: string) => void
  onDelete: (id: number) => void
  totalAllPortfolios: number
  totalPnlPctAll: number
  hasOverallPnl: boolean
  hideBalance?: boolean
  /** Hide the pill's total while the page is scoped to one game — the pill's
   *  number is the ALL-GAMES book total and would contradict the scoped hero. */
  totalVisible?: boolean
  maxPortfolios?: number
}

export function PortfolioSwitcher(props: PortfolioSwitcherProps) {
  const {
    portfolios,
    activeId,
    activeName,
    onSelect,
    totalAllPortfolios,
    totalPnlPctAll,
    hasOverallPnl,
    hideBalance,
    totalVisible = true,
  } = props
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const [sheetOpen, setSheetOpen] = useState(false)
  // When true, the manage dialog opens straight into the create form.
  const [createOnOpen, setCreateOnOpen] = useState(false)
  const multi = portfolios.length > 1
  const { openUpgradeDialog } = useUpgradeDialog()

  const maxPortfolios = props.maxPortfolios
  const hasLimit = maxPortfolios != null && isFinite(maxPortfolios)
  const atLimit = hasLimit && portfolios.length >= maxPortfolios
  // "N/5 พอร์ต" for capped tiers, "N พอร์ต" for unlimited — the counter is the
  // quiet signal that more portfolios exist behind the plan.
  const countLabel = hasLimit
    ? t(lang, "portfolioCountOf")
        .replace("{n}", String(portfolios.length))
        .replace("{max}", String(maxPortfolios))
    : t(lang, "portfolioCountOnly").replace("{n}", String(portfolios.length))

  const openManage = (create: boolean) => {
    setCreateOnOpen(create)
    setSheetOpen(true)
  }

  const handleCreateClick = () => {
    if (atLimit) {
      openUpgradeDialog({ featureKey: "portfolioCount" })
    } else {
      openManage(true)
    }
  }

  const pill = (
    <span className="flex min-w-0 items-center gap-2.5 rounded-xl border border-hair bg-card px-3 py-2 text-left ease-chrome transition-colors hover:bg-muted/70">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Briefcase className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block max-w-[9rem] truncate text-sm font-semibold leading-tight sm:max-w-[12rem]">
          {activeName}
        </span>
        {totalVisible && (
          <span className="block tabular-nums text-meta leading-tight">
            {hideBalance ? "••••" : formatJpyAmount(totalAllPortfolios, currency)}
            {multi && hasOverallPnl && !hideBalance && (
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
          </span>
        )}
      </span>
      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
    </span>
  )

  return (
    <>
      {/* Mobile / tablet: open management sheet */}
      <button
        type="button"
        className="min-w-0 md:hidden"
        onClick={() => openManage(false)}
        aria-label={t(lang, "switchPortfolio")}
      >
        {pill}
      </button>

      {/* Desktop: quick-switch dropdown */}
      <div className="hidden min-w-0 md:block">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="min-w-0 outline-none"
            aria-label={t(lang, "switchPortfolio")}
          >
            {pill}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            {/* Header — count vs plan limit (always) + all-portfolio total (multi).
                Base UI requires GroupLabel to live inside a Group. */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>{multi ? t(lang, "allPortfolios") : t(lang, "portfolio")}</span>
                <span className="flex items-center gap-2">
                  {multi && (
                    <span className="tabular-nums text-foreground">
                      {hideBalance ? "••••" : formatJpyAmount(totalAllPortfolios, currency)}
                    </span>
                  )}
                  <span className="tabular-nums font-normal text-muted-foreground">
                    {countLabel}
                  </span>
                </span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {portfolios.map((p) => {
              const active = p.id === activeId
              const pnlPct =
                p.totalCost > 0 ? ((p.totalValue - p.totalCost) / p.totalCost) * 100 : null
              return (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  className="gap-2.5"
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-md",
                      active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Briefcase className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                  <span className="shrink-0 text-right">
                    <span className="block tabular-nums text-xs">
                      {hideBalance ? "••••" : formatJpyAmount(p.totalValue, currency)}
                    </span>
                    {pnlPct != null && !hideBalance && (
                      <span
                        className={cn(
                          "block tabular-nums text-micro",
                          pnlPct >= 0 ? "text-price-up/80" : "text-price-down/80",
                        )}
                      >
                        {pnlPct >= 0 ? "+" : ""}
                        {formatPct(pnlPct, 1)}%
                      </span>
                    )}
                  </span>
                  {active && <Check className="size-3.5 shrink-0 text-primary" />}
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
            {/* Create — always visible so users learn more portfolios exist.
                At the plan limit it routes to the upgrade dialog instead. */}
            <DropdownMenuItem onClick={handleCreateClick} className="gap-2.5">
              {atLimit ? (
                <Lock className="size-4 text-muted-foreground" />
              ) : (
                <Plus className="size-4 text-muted-foreground" />
              )}
              <span className="flex-1">{t(lang, "createPortfolio")}</span>
              {atLimit && (
                <span className="rounded-full bg-primary/12 px-2 py-0.5 text-micro font-semibold text-primary">
                  PRO
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openManage(false)} className="gap-2.5">
              <Settings2 className="size-4 text-muted-foreground" />
              {t(lang, "managePortfolios")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Shared management dialog (create / rename / delete / select) —
          centered modal; the owner vetoed bottom sheets app-wide. */}
      <Dialog
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) setCreateOnOpen(false)
        }}
      >
        <DialogContent className="max-h-[78vh] overflow-y-auto sm:max-w-md">
          <DialogHeader className="pb-2">
            <DialogTitle>{t(lang, "portfolio")}</DialogTitle>
            <DialogDescription className="tabular-nums">
              {multi && (
                <>
                  {t(lang, "allPortfolios")}{" "}
                  <span className="font-semibold text-foreground">
                    {hideBalance ? MASKED : formatJpyAmount(totalAllPortfolios, currency)}
                  </span>
                  {hasOverallPnl && !hideBalance && (
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
                  <span aria-hidden className="mx-1.5 text-muted-foreground/40">
                    ·
                  </span>
                </>
              )}
              {countLabel}
            </DialogDescription>
          </DialogHeader>
          <PortfolioSidebar
            portfolios={portfolios}
            activeId={activeId}
            onSelect={(id) => {
              onSelect(id)
              setSheetOpen(false)
            }}
            onCreate={props.onCreate}
            onRename={props.onRename}
            onDelete={props.onDelete}
            hideBalance={hideBalance}
            maxPortfolios={props.maxPortfolios}
            initialCreating={createOnOpen}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
