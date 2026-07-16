"use client"

import { useState } from "react"
import {
  Briefcase,
  Edit2,
  Globe,
  Loader2,
  Lock,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { PortfolioNameForm } from "./portfolio-name-form"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { formatJpyAmount } from "@/lib/utils/currency"
import { MASKED } from "@/lib/constants/ui"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useConfirm } from "@/components/shared/confirm-dialog"
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog"

export type { PortfolioMeta } from "@/lib/types/portfolio"
import type { PortfolioMeta, PortfolioMutationResult } from "@/lib/types/portfolio"

export function shouldConfirmPortfolioVisibility(nextIsPublic: boolean) {
  return nextIsPublic
}

export function PortfolioSidebar({
  portfolios,
  activeId,
  onSelect,
  onCreateRequest,
  onRename,
  onSetVisibility,
  onDelete,
  hideBalance,
  maxPortfolios,
}: {
  portfolios: PortfolioMeta[]
  activeId: number | null
  onSelect: (id: number) => void
  onCreateRequest: () => void
  onRename: (id: number, name: string) => Promise<PortfolioMutationResult<unknown>>
  onSetVisibility: (
    id: number,
    isPublic: boolean,
  ) => Promise<PortfolioMutationResult<unknown>>
  onDelete: (id: number) => Promise<PortfolioMutationResult<unknown>>
  hideBalance?: boolean
  maxPortfolios?: number
}) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [rowErrors, setRowErrors] = useState<Record<number, string | undefined>>({})
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const confirm = useConfirm()

  const setRowError = (id: number, error?: string) => {
    setRowErrors((current) => ({ ...current, [id]: error }))
  }

  const reportMutationError = (portfolio: PortfolioMeta, error?: string) => {
    const message = error || t(lang, "portfolioMutationFailed")
    setRowError(portfolio.id, message)
    toast.error(t(lang, "portfolioMutationFailed"), { description: message })
  }

  const runMutation = async (
    portfolio: PortfolioMeta,
    mutation: () => Promise<PortfolioMutationResult<unknown>>,
    successMessage: string,
  ) => {
    setPendingId(portfolio.id)
    setRowError(portfolio.id)
    try {
      const result = await mutation()
      if (!result.ok) {
        reportMutationError(portfolio, result.error)
        return false
      }
      toast.success(successMessage, { description: portfolio.name })
      return true
    } catch (error) {
      reportMutationError(
        portfolio,
        error instanceof Error ? error.message : undefined,
      )
      return false
    } finally {
      setPendingId(null)
    }
  }

  const handleRename = async (portfolio: PortfolioMeta, name: string) => {
    const ok = await runMutation(
      portfolio,
      () => onRename(portfolio.id, name),
      t(lang, "portfolioRenamed"),
    )
    if (ok) setEditingId(null)
  }

  const handleVisibility = async (portfolio: PortfolioMeta) => {
    const next = !portfolio.isPublic
    if (shouldConfirmPortfolioVisibility(next)) {
      let accepted = false
      try {
        accepted = await confirm({
          title: t(lang, "confirmMakePublicTitle"),
          description: t(lang, "confirmMakePublicDesc"),
          confirmLabel: t(lang, "makePublic"),
          cancelLabel: t(lang, "cancel"),
        })
      } catch (error) {
        reportMutationError(
          portfolio,
          error instanceof Error ? error.message : undefined,
        )
        return
      }
      if (!accepted) return
    }
    await runMutation(
      portfolio,
      () => onSetVisibility(portfolio.id, next),
      t(lang, next ? "madePortfolioPublic" : "madePortfolioPrivate"),
    )
  }

  const handleDelete = async (p: PortfolioMeta) => {
    if (p.itemCount > 0) {
      await confirm({
        title: t(lang, "deletePortfolio"),
        description: t(lang, "portfolioHasCards"),
        confirmLabel: "OK",
        variant: "default",
      })
      return
    }
    const ok = await confirm({
      title: `${t(lang, "remove")} "${p.name}"`,
      description: t(lang, "confirmDeletePortfolio"),
      confirmLabel: t(lang, "remove"),
      cancelLabel: t(lang, "cancel"),
      variant: "destructive",
    })
    if (!ok) return
    await runMutation(p, () => onDelete(p.id), t(lang, "portfolioDeleted"))
  }

  const atLimit =
    maxPortfolios != null &&
    isFinite(maxPortfolios) &&
    portfolios.length >= maxPortfolios
  const { openUpgradeDialog } = useUpgradeDialog()

  return (
    <div className="p-1.5">
      {portfolios.map((p) => {
        const isActive = p.id === activeId
        const busy = pendingId !== null
        const rowError = rowErrors[p.id]

        if (editingId === p.id) {
          return (
            <PortfolioNameForm
              key={p.id}
              size="sm"
              className="px-2 py-1.5"
              lang={lang}
              value={editName}
              onChange={setEditName}
              pending={pendingId === p.id}
              error={rowError}
              onSubmit={(name) => {
                void handleRename(p, name)
              }}
              onCancel={() => {
                setEditingId(null)
                setRowError(p.id)
              }}
            />
          )
        }

        return (
          <div key={p.id}>
            <div
              className={cn(
                "group ease-chrome relative flex min-h-11 items-center rounded-lg transition-all",
                isActive ? "bg-primary/6" : "hover:bg-muted",
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <button
                type="button"
                aria-current={isActive ? "page" : undefined}
                disabled={busy}
                onClick={() => onSelect(p.id)}
                className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Briefcase className="size-3.5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "flex items-center gap-1.5 truncate text-sm leading-tight",
                      isActive ? "font-semibold" : "font-medium",
                    )}
                  >
                    <span className="truncate">{p.name}</span>
                    {!p.isPublic && (
                      <Lock
                        className="size-3 shrink-0 text-amber-600/80 dark:text-amber-400/80"
                        aria-label={t(lang, "portfolioPrivate")}
                      />
                    )}
                  </span>
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-meta">
                      {hideBalance
                        ? MASKED
                        : p.valuedCopyCount === 0
                          ? "—"
                          : `${p.valuationComplete ? "" : "≈ "}${formatJpyAmount(p.totalValue, currency)}`}
                    </span>
                  </span>
                </span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={`${t(lang, "managePortfolio")} ${p.name}`}
                  aria-busy={pendingId === p.id}
                  disabled={busy}
                  className="ease-chrome mr-1 flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pendingId === p.id ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <MoreHorizontal className="size-4" aria-hidden />
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
                  <DropdownMenuItem
                    className="min-h-11"
                    onClick={() => {
                      setEditingId(p.id)
                      setEditName(p.name)
                      setRowError(p.id)
                    }}
                  >
                    <Edit2 />
                    {t(lang, "edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="min-h-11"
                    onClick={() => void handleVisibility(p)}
                  >
                    {p.isPublic ? <Lock /> : <Globe />}
                    {t(lang, p.isPublic ? "portfolioPrivate" : "portfolioPublic")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    className="min-h-11"
                    onClick={() => void handleDelete(p)}
                  >
                    <Trash2 />
                    {t(lang, "deletePortfolio")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {rowError && (
              <p className="px-2.5 py-1 text-meta text-destructive" role="alert">
                {rowError}
              </p>
            )}
          </div>
        )
      })}

      {/* Add portfolio */}
      {atLimit ? (
        /* At the plan limit — say so plainly and sell the upgrade, instead of a
           plus button that silently bounces to a dialog. */
        <div className="mt-0.5 px-1">
          <button
            type="button"
            onClick={() => openUpgradeDialog({ featureKey: "portfolioCount" })}
            className="ease-chrome flex min-h-11 w-full items-center gap-2.5 rounded-lg bg-primary/6 px-2 py-2 text-left transition-colors hover:bg-primary/10"
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <Lock className="size-3.5" />
            </div>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium leading-tight">
                {t(lang, "portfolioLimitUpTo").replace("{max}", String(maxPortfolios))}
              </span>
              <span className="block text-micro font-semibold text-primary">
                {t(lang, "upgradeForMorePortfolios")} →
              </span>
            </span>
          </button>
        </div>
      ) : (
        <div className="mt-0.5 px-1">
          <button
            type="button"
            onClick={onCreateRequest}
            className="ease-chrome flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <div className="flex size-7 items-center justify-center rounded-lg border border-dashed border-hair">
              <Plus className="size-3.5" />
            </div>
            <span className="text-xs font-medium">{t(lang, "createPortfolio")}</span>
          </button>
        </div>
      )}
    </div>
  )
}
