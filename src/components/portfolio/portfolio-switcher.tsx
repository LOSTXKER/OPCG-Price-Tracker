"use client"

import { useState } from "react"
import { Check, ChevronDown, Settings2, Wallet } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { formatJpyAmount, formatPct } from "@/lib/utils/currency"
import { MASKED } from "@/lib/constants/ui"
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
  const multi = portfolios.length > 1

  const pill = (
    <span className="flex min-w-0 items-center gap-2.5 rounded-xl border border-[var(--p-hair)] bg-card px-3 py-2 text-left ease-chrome transition-colors hover:bg-muted/70">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Wallet className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block max-w-[9rem] truncate text-sm font-semibold leading-tight sm:max-w-[12rem]">
          {activeName}
        </span>
        {totalVisible && (
          <span className="block font-price text-meta tabular-nums leading-tight">
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
        onClick={() => setSheetOpen(true)}
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
            {multi && (
              <>
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>{t(lang, "allPortfolios")}</span>
                  <span className="font-price tabular-nums text-foreground">
                    {hideBalance ? "••••" : formatJpyAmount(totalAllPortfolios, currency)}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
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
                    <Wallet className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                  <span className="shrink-0 text-right">
                    <span className="block font-price text-xs tabular-nums">
                      {hideBalance ? "••••" : formatJpyAmount(p.totalValue, currency)}
                    </span>
                    {pnlPct != null && !hideBalance && (
                      <span
                        className={cn(
                          "block font-price text-micro tabular-nums",
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
            <DropdownMenuItem onClick={() => setSheetOpen(true)} className="gap-2.5">
              <Settings2 className="size-4 text-muted-foreground" />
              {t(lang, "managePortfolios")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Shared management sheet (create / rename / delete / select) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[78vh] overflow-y-auto rounded-t-2xl pb-10">
          <SheetHeader className="pb-2">
            <SheetTitle>{t(lang, "portfolio")}</SheetTitle>
            {multi && (
              <SheetDescription className="font-price tabular-nums">
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
              </SheetDescription>
            )}
          </SheetHeader>
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
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
