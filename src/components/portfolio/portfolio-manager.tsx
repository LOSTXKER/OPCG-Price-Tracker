"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Check,
  ChevronRight,
  Edit2,
  Eye,
  EyeOff,
  Globe,
  Lock,
  MoreHorizontal,
  Plus,
  Trash2,
  X,
} from "lucide-react"

import { useConfirm } from "@/components/shared/confirm-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconButton } from "@/components/ui/icon-button"
import { Input } from "@/components/ui/input"
import { Surface } from "@/components/ui/surface"
import { MASKED } from "@/lib/constants/ui"
import { getLocale, t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/utils/currency"
import type { PortfolioMeta } from "@/lib/types/portfolio"

import {
  PortfolioManagerSummary,
  type PortfolioManagerSummaryData,
} from "./portfolio-manager-summary"

/** PortfolioMeta already carries the value coverage needed by the manager. */
export type PortfolioManagerRow = PortfolioMeta

export type PortfolioManagerMutationResult =
  | boolean
  | { ok: boolean; status?: number; error?: string | null; data?: unknown }

type MaybePromise<T> = T | Promise<T>

export type PortfolioManagerProps = {
  rows: PortfolioManagerRow[]
  lang: Language
  formatMoney: (valueJpy: number) => string
  masked?: boolean
  maskText?: string
  className?: string
  showCreateAction?: boolean
  atPortfolioLimit?: boolean
  onToggleMasked?: () => void
  portfolioHref?: (row: PortfolioManagerRow) => string
  onCreatePortfolio?: () => void
  onAddCards: (row: PortfolioManagerRow) => void
  onRename: (
    row: PortfolioManagerRow,
    name: string,
  ) => MaybePromise<PortfolioManagerMutationResult>
  onSetVisibility: (
    row: PortfolioManagerRow,
    isPublic: boolean,
  ) => MaybePromise<PortfolioManagerMutationResult>
  onDelete: (
    row: PortfolioManagerRow,
  ) => MaybePromise<PortfolioManagerMutationResult>
  /** Optional product-owned confirmation. When omitted, the shared confirm
   * dialog asks before a private portfolio becomes public. */
  onConfirmMakePublic?: (row: PortfolioManagerRow) => MaybePromise<boolean>
}

function normalizeMutationResult(
  result: PortfolioManagerMutationResult,
): { ok: boolean; error?: string | null } {
  return typeof result === "boolean" ? { ok: result } : result
}

export function PortfolioManager({
  rows,
  lang,
  formatMoney,
  masked = false,
  maskText = MASKED,
  className,
  showCreateAction = true,
  atPortfolioLimit = false,
  onToggleMasked,
  portfolioHref = (row) => `/portfolio/${row.id}`,
  onCreatePortfolio,
  onAddCards,
  onRename,
  onSetVisibility,
  onDelete,
  onConfirmMakePublic,
}: PortfolioManagerProps) {
  const confirm = useConfirm()
  const locale = getLocale(lang)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [pending, setPending] = useState(false)
  const [errors, setErrors] = useState<Record<number, string | undefined>>({})

  const summary = useMemo<PortfolioManagerSummaryData>(
    () => {
      const totalCopyCount = rows.reduce(
        (sum, row) => sum + row.totalCopyCount,
        0,
      )
      const valuedCopyCount = rows.reduce(
        (sum, row) => sum + row.valuedCopyCount,
        0,
      )

      return {
        totalValueJpy: rows.reduce(
          (sum, row) => sum + row.estimatedValueJpy,
          0,
        ),
        portfolioCount: rows.length,
        valuedCopyCount,
        valuationComplete:
          totalCopyCount > 0 && valuedCopyCount === totalCopyCount,
      }
    },
    [rows],
  )

  const setRowError = (id: number, error?: string) => {
    setErrors((current) => ({ ...current, [id]: error }))
  }

  const runMutation = async (
    row: PortfolioManagerRow,
    mutation: () => MaybePromise<PortfolioManagerMutationResult>,
  ) => {
    setPending(true)
    setRowError(row.id)
    try {
      const result = normalizeMutationResult(await mutation())
      if (!result.ok) {
        setRowError(row.id, result.error ?? t(lang, "saveFailed"))
      }
      return result.ok
    } catch (error) {
      setRowError(
        row.id,
        error instanceof Error && error.message ? error.message : t(lang, "saveFailed"),
      )
      return false
    } finally {
      setPending(false)
    }
  }

  const startRename = (row: PortfolioManagerRow) => {
    setEditingId(row.id)
    setEditName(row.name)
    setRowError(row.id)
  }

  const submitRename = async (row: PortfolioManagerRow) => {
    const name = editName.trim()
    if (!name) return
    const ok = await runMutation(row, () => onRename(row, name))
    if (ok) setEditingId(null)
  }

  const requestVisibility = async (row: PortfolioManagerRow) => {
    const next = !row.isPublic
    if (next) {
      let approved = false
      try {
        approved = onConfirmMakePublic
          ? await onConfirmMakePublic(row)
          : await confirm({
              title: t(lang, "confirmMakePublicTitle"),
              description: t(lang, "confirmMakePublicDesc"),
              confirmLabel: t(lang, "makePublic"),
              cancelLabel: t(lang, "cancel"),
            })
      } catch (error) {
        setRowError(
          row.id,
          error instanceof Error && error.message ? error.message : t(lang, "saveFailed"),
        )
        return
      }
      if (!approved) return
    }
    await runMutation(row, () => onSetVisibility(row, next))
  }

  const requestDelete = async (row: PortfolioManagerRow) => {
    if (row.itemCount > 0) {
      await confirm({
        title: t(lang, "deletePortfolio"),
        description: t(lang, "portfolioHasCards"),
        confirmLabel: "OK",
      })
      return
    }
    const approved = await confirm({
      title: `${t(lang, "deletePortfolio")}: ${row.name}`,
      description: t(lang, "confirmDeletePortfolio"),
      confirmLabel: t(lang, "deletePortfolio"),
      cancelLabel: t(lang, "cancel"),
      variant: "destructive",
    })
    if (!approved) return
    await runMutation(row, () => onDelete(row))
  }

  const renderRenameForm = (row: PortfolioManagerRow) => {
    const busy = pending
    return (
      <form
        className="flex min-w-0 items-center gap-1.5"
        onSubmit={(event) => {
          event.preventDefault()
          void submitRename(row)
        }}
      >
        <Input
          autoFocus
          value={editName}
          onChange={(event) => setEditName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setEditingId(null)
          }}
          aria-label={t(lang, "portfolioName")}
          aria-invalid={Boolean(errors[row.id])}
          disabled={busy}
          className="h-11 sm:h-10"
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon-sm"
          aria-label={t(lang, "save")}
          disabled={busy || !editName.trim()}
          className="sm:size-11"
        >
          <Check />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t(lang, "cancel")}
          disabled={busy}
          onClick={() => setEditingId(null)}
          className="sm:size-11"
        >
          <X />
        </Button>
      </form>
    )
  }

  const renderPrivacy = (row: PortfolioManagerRow) => (
    <Badge variant="neutral" className="gap-1">
      {row.isPublic ? <Globe aria-hidden /> : <Lock aria-hidden />}
      {t(lang, row.isPublic ? "portfolioPublic" : "portfolioPrivate")}
    </Badge>
  )

  const renderPreviews = (row: PortfolioManagerRow) => {
    if (row.previewItems.length === 0) return null
    return (
      <div className="flex shrink-0 items-center -space-x-2" aria-hidden>
        {row.previewItems.slice(0, 2).map((preview, index) => (
          <span
            key={`${preview.cardCode}-${index}`}
            data-slot="portfolio-preview"
            className="relative aspect-[63/88] w-9 shrink-0 overflow-hidden rounded-md bg-muted ring-2 ring-card"
          >
            {preview.imageUrl && (
              <Image
                src={preview.imageUrl}
                alt=""
                fill
                sizes="36px"
                className="object-contain"
              />
            )}
          </span>
        ))}
      </div>
    )
  }

  const renderValue = (row: PortfolioManagerRow) => {
    if (masked) return <span className="font-semibold text-foreground">{maskText}</span>
    if (row.valuedCopyCount === 0) {
      return (
        <span
          className="font-semibold text-muted-foreground"
          aria-label={t(lang, "portfolioValueUnavailable")}
        >
          —
        </span>
      )
    }
    return (
      <span
        className="font-semibold text-foreground"
        aria-label={
          row.valuationComplete
            ? undefined
            : `${t(lang, "portfolioValuePartial")}: ${formatMoney(row.estimatedValueJpy)}`
        }
        title={row.valuationComplete ? undefined : t(lang, "portfolioValuePartial")}
      >
        {!row.valuationComplete && "≈ "}
        {formatMoney(row.estimatedValueJpy)}
      </span>
    )
  }

  const renderActions = (row: PortfolioManagerRow) => {
    const busy = pending
    const addCardsLabel = t(lang, "addCardsToPortfolio").replace("{name}", row.name)
    const manageLabel = `${t(lang, "managePortfolio")}: ${row.name}`
    return (
      <div className="flex shrink-0 items-center gap-1">
        <IconButton
          size="lg"
          variant="ghost"
          aria-label={addCardsLabel}
          disabled={busy}
          onClick={() => onAddCards(row)}
        >
          <Plus className="size-4" aria-hidden />
        </IconButton>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={manageLabel}
            title={manageLabel}
            disabled={busy}
            className="ease-chrome inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
          >
            <MoreHorizontal className="size-4" aria-hidden />
            <span className="sr-only">{t(lang, "managePortfolio")}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="min-h-11" onClick={() => startRename(row)}>
              <Edit2 />
              {t(lang, "edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="min-h-11"
              onClick={() => void requestVisibility(row)}
            >
              {row.isPublic ? <Lock /> : <Globe />}
              {t(lang, row.isPublic ? "portfolioPrivate" : "portfolioPublic")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="min-h-11"
              onClick={() => void requestDelete(row)}
            >
              <Trash2 />
              {t(lang, "deletePortfolio")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className={className} data-slot="portfolio-manager">
        <EmptyState
          title={t(lang, "noPortfolioYet")}
          description={t(lang, "portfolioManagerDesc")}
          lang={lang}
          action={
            showCreateAction && onCreatePortfolio ? (
              <Button onClick={onCreatePortfolio} className="min-h-11 gap-1.5">
                <Plus className="size-4" aria-hidden />
                {t(lang, "createPortfolio")}
              </Button>
            ) : undefined
          }
        />
      </div>
    )
  }

  return (
    <section
      className={cn("space-y-3", className)}
      data-slot="portfolio-manager"
      aria-label={t(lang, "portfolioManagerSection")}
    >
      <div className="flex min-h-11 flex-wrap items-center justify-end gap-2">
        {rows.length > 1 && (
          <PortfolioManagerSummary
            data={summary}
            lang={lang}
            formatMoney={formatMoney}
            masked={masked}
            maskText={maskText}
            className="mr-auto"
          />
        )}

        {onToggleMasked && (
          <IconButton
            size="lg"
            variant="ghost"
            onClick={onToggleMasked}
            aria-label={masked ? t(lang, "showBalance") : t(lang, "hideBalance")}
          >
            {masked ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </IconButton>
        )}

        {showCreateAction && onCreatePortfolio && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCreatePortfolio}
            className="min-h-11 gap-1.5"
          >
            {atPortfolioLimit ? (
              <Lock className="size-4" aria-hidden />
            ) : (
              <Plus className="size-4" aria-hidden />
            )}
            {t(lang, atPortfolioLimit ? "upgrade" : "createPortfolio")}
          </Button>
        )}
      </div>

      <Surface variant="panel" className="overflow-hidden">
        <div className="divide-y divide-hair">
          {rows.map((row) => {
            const href = portfolioHref(row)
            const countLabel =
              row.totalCopyCount === 0
                ? t(lang, "portfolioNoCards")
                : `${formatCount(row.totalCopyCount, locale)} ${t(lang, "cardCopiesShort")}`

            return (
              <article
                key={row.id}
                className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-3 sm:px-4"
                data-portfolio-id={row.id}
              >
                {editingId === row.id ? (
                  <div className="col-span-2 min-w-0">{renderRenameForm(row)}</div>
                ) : (
                  <>
                    <Link
                      href={href}
                      className="group flex min-h-14 min-w-0 items-center gap-3 rounded-lg p-1 -m-1 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {renderPreviews(row)}
                      <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                          <span className="truncate text-h5 group-hover:text-primary">{row.name}</span>
                          {renderPrivacy(row)}
                        </span>
                        <span className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-meta tabular-nums">
                          <span>{countLabel}</span>
                          <span aria-hidden>·</span>
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <span className="sr-only">
                              {t(lang, "portfolioEstimatedValue")}: {" "}
                            </span>
                            {renderValue(row)}
                          </span>
                        </span>
                      </span>
                      <ChevronRight
                        className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </Link>
                    {renderActions(row)}
                  </>
                )}

                {errors[row.id] && (
                  <p role="alert" className="col-span-2 text-meta text-destructive">
                    {errors[row.id]}
                  </p>
                )}
              </article>
            )
          })}
        </div>
      </Surface>
    </section>
  )
}
