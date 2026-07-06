"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowDown, ArrowUp, Edit2, Globe, Lock, MoreHorizontal, Trash2 } from "lucide-react"

import { PortfolioNameForm } from "./portfolio-name-form"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Surface } from "@/components/ui/surface"
import { useConfirm } from "@/components/shared/confirm-dialog"
import { MASKED } from "@/lib/constants/ui"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { formatJpyAmount, formatPct } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"
import type { PortfolioMeta } from "@/lib/types/portfolio"

/**
 * One portfolio in the hub's grid — the entire card is a "stretched link" to
 * `/portfolio/[id]` (a full-bleed absolutely-positioned `<Link>` under the
 * visible content) so it gets real anchor semantics (ctrl/cmd-click, right-click
 * "open in new tab") without any nested-interactive-element hacks. The "..."
 * menu sits in its own pointer-events island above the link so it can be
 * clicked without triggering navigation — no stopPropagation needed.
 */
export function PortfolioHubCard({
  meta,
  hideBalance,
  onRename,
  onDelete,
  onToggleVisibility,
}: {
  meta: PortfolioMeta
  hideBalance: boolean
  onRename: (id: number, name: string) => void
  onDelete: (id: number) => void
  onToggleVisibility: (id: number, next: boolean) => void
}) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const confirm = useConfirm()
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(meta.name)

  const hasCost = meta.totalCost > 0
  const pnlPct = hasCost ? ((meta.totalValue - meta.totalCost) / meta.totalCost) * 100 : null
  const pnlUp = (pnlPct ?? 0) >= 0

  const handleDelete = async () => {
    if (meta.itemCount > 0) {
      await confirm({
        title: t(lang, "deletePortfolio"),
        description: t(lang, "portfolioHasCards"),
        confirmLabel: "OK",
        variant: "default",
      })
      return
    }
    const ok = await confirm({
      title: `${t(lang, "remove")} "${meta.name}"`,
      description: t(lang, "confirmDeletePortfolio"),
      confirmLabel: t(lang, "remove"),
      cancelLabel: t(lang, "cancel"),
      variant: "destructive",
    })
    if (ok) onDelete(meta.id)
  }

  if (editing) {
    return (
      <Surface variant="panel" className="p-4">
        <PortfolioNameForm
          size="md"
          lang={lang}
          value={editName}
          onChange={setEditName}
          onSubmit={(name) => {
            onRename(meta.id, name)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      </Surface>
    )
  }

  return (
    <Surface variant="panel" interactive className="relative p-4">
      <Link
        href={`/portfolio/${meta.id}`}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${t(lang, "viewDetails")} ${meta.name}`}
      />

      {/* No `relative`/`z-*` here — this is plain text, not an interactive
          island. Giving it a stacking context (like the old `relative z-10`)
          paints it ABOVE the stretched link and swallows taps meant to
          navigate; only the "..." menu below needs its own z-20 island. */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
            <span className="truncate">{meta.name}</span>
            {!meta.isPublic && (
              <Lock
                className="size-3 shrink-0 text-amber-600/80 dark:text-amber-400/80"
                aria-label={t(lang, "portfolioPrivate")}
              />
            )}
          </p>
          <p className="mt-1.5 text-price-lg tabular-nums">
            {hideBalance ? MASKED : formatJpyAmount(meta.totalValue, currency)}
          </p>
          {hasCost && !hideBalance && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-micro font-semibold tabular-nums",
                pnlUp ? "text-price-up" : "text-price-down",
              )}
            >
              {pnlUp ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
              {formatPct(Math.abs(pnlPct ?? 0), 1)}%
            </span>
          )}
        </div>

        {/* Menu — its own pointer-events island above the stretched link. */}
        <div className="pointer-events-auto relative z-20 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger className="ease-chrome rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditName(meta.name)
                  setEditing(true)
                }}
              >
                <Edit2 />
                {t(lang, "edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleVisibility(meta.id, !meta.isPublic)}>
                {meta.isPublic ? <Lock /> : <Globe />}
                {t(lang, meta.isPublic ? "portfolioPrivate" : "portfolioPublic")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => void handleDelete()}>
                <Trash2 />
                {t(lang, "deletePortfolio")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Thumbnail strip — top holdings by value, real card art. Same reasoning
          as above: no z-index here so taps fall through to the stretched link. */}
      <div className="mt-3 flex items-center gap-1.5">
        {meta.previewItems.length > 0 ? (
          meta.previewItems.map((it) => (
            <div
              key={it.cardCode}
              className="aspect-[63/88] w-7 shrink-0 overflow-hidden rounded bg-muted ring-1 ring-hair"
            >
              {it.imageUrl && (
                <Image
                  src={it.imageUrl}
                  alt={it.nameEn ?? it.nameJp}
                  width={28}
                  height={39}
                  className="h-full w-full object-contain"
                />
              )}
            </div>
          ))
        ) : (
          <span className="text-meta text-muted-foreground/60">{t(lang, "emptyPortfolio")}</span>
        )}
        <span className="ml-auto text-meta tabular-nums">
          {meta.itemCount} {t(lang, "card")}
        </span>
      </div>
    </Surface>
  )
}
