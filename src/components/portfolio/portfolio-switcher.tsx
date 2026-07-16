"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import {
  Briefcase,
  Check,
  ChevronDown,
  Globe,
  Lock,
  Plus,
  Settings2,
} from "lucide-react"

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
import { formatJpyAmount } from "@/lib/utils/currency"
import { MASKED } from "@/lib/constants/ui"
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog"
import { PortfolioSidebar } from "./portfolio-selector"
import {
  PortfolioCreateDialog,
  type PortfolioCreateHandler,
} from "./portfolio-create-dialog"
import { getPortfolioCreateCopy } from "./portfolio-create-copy"
import type { PortfolioMeta, PortfolioMutationResult } from "@/lib/types/portfolio"

interface PortfolioSwitcherProps {
  portfolios: PortfolioMeta[]
  activeId: number | null
  onSelect: (id: number) => void
  onCreate: PortfolioCreateHandler<{ id: number }>
  onCreatedPortfolio: (id: number) => void
  onRename: (id: number, name: string) => Promise<PortfolioMutationResult<unknown>>
  onSetVisibility: (
    id: number,
    isPublic: boolean,
  ) => Promise<PortfolioMutationResult<unknown>>
  onDelete: (id: number) => Promise<PortfolioMutationResult<unknown>>
  totalAllPortfolios: number
  hideBalance?: boolean
  /** Hide the multi-portfolio total while the page is scoped to one game. */
  totalVisible?: boolean
  maxPortfolios?: number
}

export function PortfolioSwitcher(props: PortfolioSwitcherProps) {
  const {
    portfolios,
    activeId,
    onSelect,
    totalAllPortfolios,
    hideBalance,
    totalVisible = true,
  } = props
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const mobileTriggerRef = useRef<HTMLButtonElement>(null)
  const desktopTriggerRef = useRef<HTMLButtonElement>(null)
  const activePortfolio = portfolios.find((portfolio) => portfolio.id === activeId)
  const multi = portfolios.length > 1
  const overallCopyCount = portfolios.reduce(
    (sum, portfolio) => sum + portfolio.totalCopyCount,
    0,
  )
  const overallValuedCopyCount = portfolios.reduce(
    (sum, portfolio) => sum + portfolio.valuedCopyCount,
    0,
  )
  const overallValuationComplete =
    overallCopyCount > 0 && overallValuedCopyCount === overallCopyCount
  const overallValueAvailable = overallValuedCopyCount > 0
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
  const overallValueLabel = hideBalance
    ? MASKED
    : !overallValueAvailable
      ? "—"
      : `${overallValuationComplete ? "" : "≈ "}${formatJpyAmount(totalAllPortfolios, currency)}`
  const activePrivacyLabel = activePortfolio
    ? t(lang, activePortfolio.isPublic ? "portfolioPublic" : "portfolioPrivate")
    : null
  const switcherAccessibleLabel = activePortfolio
    ? `${t(lang, "switchPortfolio")}: ${activePortfolio.name}, ${activePrivacyLabel}`
    : t(lang, "switchPortfolio")

  const getVisibleSwitcherTrigger = () =>
    [mobileTriggerRef.current, desktopTriggerRef.current].find(
      (element): element is HTMLButtonElement =>
        element != null && element.getClientRects().length > 0,
    ) ?? null

  const handleCreateClick = () => {
    if (atLimit) {
      openUpgradeDialog({ featureKey: "portfolioCount" })
    } else {
      // Keep the create dialog outside the management dialog's focus trap.
      setSheetOpen(false)
      setCreateOpen(true)
    }
  }

  const pill = (
    <span className="flex min-w-0 items-center gap-2.5 rounded-xl border border-hair bg-card px-3 py-2 text-left ease-chrome transition-colors hover:bg-muted/70">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Briefcase className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block max-w-[9rem] truncate text-sm font-semibold leading-tight sm:max-w-[12rem]">
          {activePortfolio?.name ?? t(lang, "portfolio")}
        </span>
        {activePortfolio && (
          <span className="flex items-center gap-1 text-meta leading-tight">
            {activePortfolio.isPublic ? (
              <Globe className="size-3" aria-hidden />
            ) : (
              <Lock className="size-3" aria-hidden />
            )}
            {t(lang, activePortfolio.isPublic ? "portfolioPublic" : "portfolioPrivate")}
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
        ref={mobileTriggerRef}
        type="button"
        className="min-w-0 md:hidden"
        onClick={() => setSheetOpen(true)}
        aria-label={switcherAccessibleLabel}
        aria-haspopup="dialog"
        aria-expanded={sheetOpen}
      >
        {pill}
      </button>

      {/* Desktop: quick-switch dropdown */}
      <div className="hidden min-w-0 md:block">
        <DropdownMenu>
          <DropdownMenuTrigger
            ref={desktopTriggerRef}
            className="min-w-0 outline-none"
            aria-label={switcherAccessibleLabel}
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
                  {multi && totalVisible && (
                    <span className="tabular-nums text-foreground">
                      {overallValueLabel}
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
                      {hideBalance
                        ? MASKED
                        : p.valuedCopyCount === 0
                          ? "—"
                          : `${p.valuationComplete ? "" : "≈ "}${formatJpyAmount(p.totalValue, currency)}`}
                    </span>
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
            <DropdownMenuItem onClick={() => setSheetOpen(true)} className="gap-2.5">
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
        onOpenChange={setSheetOpen}
      >
        <DialogContent className="max-h-[78vh] overflow-y-auto sm:max-w-md">
          <DialogHeader className="pb-2">
            <DialogTitle>{t(lang, "portfolio")}</DialogTitle>
            <DialogDescription className="tabular-nums">
              {multi && totalVisible && (
                <>
                  {t(lang, "allPortfolios")}{" "}
                  <span className="font-semibold text-foreground">
                    {overallValueLabel}
                  </span>
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
            onCreateRequest={handleCreateClick}
            onRename={props.onRename}
            onSetVisibility={props.onSetVisibility}
            onDelete={props.onDelete}
            hideBalance={hideBalance}
            maxPortfolios={props.maxPortfolios}
          />
        </DialogContent>
      </Dialog>

      <PortfolioCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={props.onCreate}
        onCreated={(result, input) => {
          toast.success(t(lang, "portfolioCreated"), { description: input.name })
          props.onCreatedPortfolio(result.data.id)
        }}
        title={t(lang, "createPortfolioTitle")}
        description={t(lang, "createPortfolioDesc")}
        copy={getPortfolioCreateCopy(lang, t(lang, "createAndAddCards"))}
        finalFocus={getVisibleSwitcherTrigger}
      />
    </>
  )
}
