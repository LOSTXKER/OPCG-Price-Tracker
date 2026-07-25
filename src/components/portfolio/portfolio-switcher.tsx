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
import { t, type Language } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { formatJpyAmount } from "@/lib/utils/currency"
import { MASKED } from "@/lib/constants/ui"
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog"
import {
  getPortfolioUpgradeTier,
  PortfolioSidebar,
} from "./portfolio-selector"
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
  /** Compact is the legacy toolbar trigger. Heading promotes the active
   * portfolio into the page's visual identity while keeping the same
   * switch/manage behavior. */
  appearance?: "compact" | "heading"
  /** Optional lifted create controller. The detail page uses this so the
   * mobile switcher and permanent desktop sidebar open one shared dialog. */
  onCreateRequest?: () => void
}

export function getPortfolioCountLabel(
  lang: Language,
  count: number,
  maxPortfolios?: number,
) {
  return maxPortfolios != null && Number.isFinite(maxPortfolios)
    ? t(lang, "portfolioCountOf")
        .replace("{n}", String(count))
        .replace("{max}", String(maxPortfolios))
    : t(lang, "portfolioCountOnly").replace("{n}", String(count))
}

export function PortfolioSwitcher(props: PortfolioSwitcherProps) {
  const {
    portfolios,
    activeId,
    onSelect,
    totalAllPortfolios,
    hideBalance,
    totalVisible = true,
    appearance = "compact",
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
  const hasLimit = maxPortfolios != null && Number.isFinite(maxPortfolios)
  const atLimit =
    maxPortfolios != null && hasLimit && portfolios.length >= maxPortfolios
  // "N/5 พอร์ต" for capped tiers, "N พอร์ต" for unlimited — the counter is the
  // quiet signal that more portfolios exist behind the plan.
  const countLabel = getPortfolioCountLabel(
    lang,
    portfolios.length,
    maxPortfolios,
  )
  const compactCountLabel = `${portfolios.length}/${
    hasLimit ? maxPortfolios : "∞"
  }`
  const overallValueLabel = hideBalance
    ? MASKED
    : !overallValueAvailable
      ? "—"
      : `${overallValuationComplete ? "" : "≈ "}${formatJpyAmount(totalAllPortfolios, currency)}`
  const activePrivacyLabel = activePortfolio
    ? t(lang, activePortfolio.isPublic ? "portfolioPublic" : "portfolioPrivate")
    : null
  const switcherAccessibleLabel = activePortfolio
    ? `${t(lang, "switchPortfolio")}: ${activePortfolio.name}, ${activePrivacyLabel}, ${countLabel}`
    : t(lang, "switchPortfolio")

  const getVisibleSwitcherTrigger = () =>
    [mobileTriggerRef.current, desktopTriggerRef.current].find(
      (element): element is HTMLButtonElement =>
        element != null && element.getClientRects().length > 0,
    ) ?? null

  const openPortfolioUpgrade = () => {
    // Never stack the upgrade dialog over the portfolio management dialog.
    setSheetOpen(false)
    openUpgradeDialog({
      featureKey: "portfolioCount",
      requiredTier: getPortfolioUpgradeTier(maxPortfolios),
    })
  }

  const handleCreateClick = () => {
    if (atLimit) {
      openPortfolioUpgrade()
      return
    }
    // Keep the create dialog outside the management dialog's focus trap.
    setSheetOpen(false)
    if (props.onCreateRequest) props.onCreateRequest()
    else setCreateOpen(true)
  }

  const triggerContent = (
    <span
      className={cn(
        "flex min-w-0 items-center text-left ease-chrome transition-colors",
        appearance === "heading"
          ? "gap-3 rounded-lg p-1 hover:bg-muted/40"
          : "gap-2.5 rounded-xl border border-hair bg-card px-3 py-2 hover:bg-muted/70",
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center bg-primary/10 text-primary",
          appearance === "heading" ? "size-10 rounded-xl" : "size-8 rounded-lg",
        )}
      >
        <Briefcase className={appearance === "heading" ? "size-5" : "size-4"} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate leading-tight",
            appearance === "heading"
              ? "max-w-[min(18rem,65vw)] text-h1 sm:max-w-[24rem]"
              : "max-w-[9rem] text-sm font-semibold sm:max-w-[12rem]",
          )}
        >
          {activePortfolio?.name ?? t(lang, "portfolio")}
        </span>
        {activePortfolio && (
          /* Compact trigger: the phone row is shared with the labelled
             "เพิ่มการ์ด" button, so this second line only appears from `sm` up —
             below that the trigger is one line (name + chevron) and privacy /
             count stay in the sheet and in the button's accessible name. Without
             this the line had no shrink escape and clipped its own chevron. */
          <span
            className={cn(
              "flex min-w-0 items-center gap-1 text-meta leading-tight",
              appearance === "heading" ? "mt-1 flex-wrap" : "hidden sm:flex",
            )}
          >
            {activePortfolio.isPublic ? (
              <Globe className="size-3 shrink-0" aria-hidden />
            ) : (
              <Lock className="size-3 shrink-0" aria-hidden />
            )}
            <span className="truncate">
              {t(lang, activePortfolio.isPublic ? "portfolioPublic" : "portfolioPrivate")}
            </span>
            {/* On a phone the row is narrow: keep the privacy word readable and
                drop the "1/1" counter (it is on the sidebar and in the sheet)
                rather than truncating "สาธารณะ" to "ส..". */}
            <span
              aria-hidden
              className={cn(
                "shrink-0 text-muted-foreground/40",
                appearance !== "heading" && "hidden sm:inline",
              )}
            >
              ·
            </span>
            <span
              className={cn(
                "shrink-0 whitespace-nowrap tabular-nums",
                appearance !== "heading" && "hidden sm:inline",
              )}
            >
              {appearance === "heading" ? countLabel : compactCountLabel}
            </span>
            {appearance === "heading" && (
              <>
                <span aria-hidden className="text-muted-foreground/40">·</span>
                <span>
                  {activePortfolio.copyCount.toLocaleString()} {t(lang, "card")}
                </span>
              </>
            )}
          </span>
        )}
      </span>
      <ChevronDown
        className={cn(
          "shrink-0 text-muted-foreground",
          appearance === "heading" ? "size-5" : "size-4",
        )}
      />
    </span>
  )

  return (
    <>
      {/* Mobile / tablet: open management sheet */}
      <button
        ref={mobileTriggerRef}
        type="button"
        className={cn(
          "min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:hidden",
          // w-full makes the box definite: as a shrink-to-fit inline-block it
          // inflated to its min-content and clipped its own chevron once the
          // labelled "เพิ่มการ์ด" button took its share of the phone row.
          appearance === "heading" ? "max-w-full rounded-lg text-left" : "w-full",
        )}
        onClick={() => setSheetOpen(true)}
        aria-label={switcherAccessibleLabel}
        aria-haspopup="dialog"
        aria-expanded={sheetOpen}
      >
        {triggerContent}
      </button>

      {/* Desktop: quick-switch dropdown */}
      <div className="hidden min-w-0 md:block">
        <DropdownMenu>
          <DropdownMenuTrigger
            ref={desktopTriggerRef}
            className={cn(
              "min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              appearance === "heading" && "max-w-full rounded-lg text-left",
            )}
            aria-label={switcherAccessibleLabel}
          >
            {triggerContent}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            {/* Header — count vs plan limit (always) + all-portfolio total (multi).
                Base UI requires GroupLabel to live inside a Group. */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>{multi ? t(lang, "allPortfolios") : t(lang, "portfolio")}</span>
                <span className="flex items-center gap-2">
                  {multi && totalVisible && (
                    <span className="font-price tabular-nums text-foreground">
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
                    <span className="block font-price tabular-nums text-xs">
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
            {/* Creation keeps the same affordance on every plan. At the limit,
                only the click outcome changes to the shared upgrade dialog. */}
            <DropdownMenuItem onClick={handleCreateClick} className="gap-2.5">
              <Plus className="size-4 text-muted-foreground" aria-hidden />
              <span>{t(lang, "createPortfolio")}</span>
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
            onUpgradeRequest={openPortfolioUpgrade}
          />
        </DialogContent>
      </Dialog>

      {!props.onCreateRequest ? (
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
      ) : null}
    </>
  )
}
