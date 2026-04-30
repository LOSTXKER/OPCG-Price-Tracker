"use client"

import { useState } from "react"
import { Check, Edit2, Lock, MoreHorizontal, Plus, Trash2, X, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { formatJpyAmount, formatPct } from "@/lib/utils/currency"
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
import type { PortfolioMeta } from "@/lib/types/portfolio"

export function PortfolioSidebar({
  portfolios,
  activeId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  hideBalance,
  maxPortfolios,
}: {
  portfolios: PortfolioMeta[]
  activeId: number | null
  onSelect: (id: number) => void
  onCreate: (name: string) => void
  onRename: (id: number, name: string) => void
  onDelete: (id: number) => void
  hideBalance?: boolean
  maxPortfolios?: number
}) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const confirm = useConfirm()

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
    if (ok) onDelete(p.id)
  }

  const atLimit = maxPortfolios != null && isFinite(maxPortfolios) && portfolios.length >= maxPortfolios
  const { openUpgradeDialog } = useUpgradeDialog()

  return (
    <div className="p-1.5">
      {portfolios.map((p) => {
        const isActive = p.id === activeId

        if (editingId === p.id) {
          return (
            <form
              key={p.id}
              className="flex items-center gap-1 px-2 py-1.5"
              onSubmit={(e) => {
                e.preventDefault()
                if (editName.trim()) {
                  onRename(p.id, editName.trim())
                  setEditingId(null)
                }
              }}
            >
              <input
                autoFocus
                className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none ring-primary/30 transition-shadow focus:ring-2"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") setEditingId(null) }}
              />
              <button type="submit" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <Check className="size-3.5" />
              </button>
              <button type="button" onClick={() => setEditingId(null)} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </form>
          )
        }

        return (
          <div
            key={p.id}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all cursor-pointer",
              isActive
                ? "bg-primary/6"
                : "hover:bg-muted/50"
            )}
            onClick={() => onSelect(p.id)}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
            )}
            <div className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors",
              isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            )}>
              <Wallet className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p
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
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-meta">
                  {hideBalance ? "••••" : formatJpyAmount(p.totalValue, currency)}
                </span>
                {p.totalCost > 0 && (() => {
                  const pnlPct = ((p.totalValue - p.totalCost) / p.totalCost) * 100
                  return (
                    <span className={cn(
                      "text-micro font-medium tabular-nums",
                      pnlPct >= 0 ? "text-price-up/80" : "text-price-down/80"
                    )}>
                      {pnlPct >= 0 ? "+" : ""}{formatPct(pnlPct, 1)}%
                    </span>
                  )
                })()}
              </div>
            </div>
            {isActive && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <MoreHorizontal className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
                  <DropdownMenuItem onClick={() => { setEditingId(p.id); setEditName(p.name) }}>
                    <Edit2 />
                    {t(lang, "edit")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => void handleDelete(p)}>
                    <Trash2 />
                    {t(lang, "deletePortfolio")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )
      })}

      {/* Add portfolio */}
      {creating ? (
        <form
          className="flex items-center gap-1 px-2 py-1.5"
          onSubmit={(e) => {
            e.preventDefault()
            if (newName.trim()) {
              onCreate(newName.trim())
              setNewName("")
              setCreating(false)
            }
          }}
        >
          <input
            autoFocus
            placeholder={t(lang, "portfolioName")}
            className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none ring-primary/30 transition-shadow placeholder:text-muted-foreground/60 focus:ring-2"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setCreating(false) }}
          />
          <button type="submit" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Check className="size-3.5" />
          </button>
          <button type="button" onClick={() => setCreating(false)} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <X className="size-3.5" />
          </button>
        </form>
      ) : (
        <div className="mt-0.5 px-1">
          <button
            onClick={() =>
              atLimit
                ? openUpgradeDialog({ featureKey: "portfolioCount" })
                : setCreating(true)
            }
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <div className="flex size-7 items-center justify-center rounded-lg border border-dashed border-border/60">
              <Plus className="size-3.5" />
            </div>
            <span className="text-xs font-medium">{t(lang, "createPortfolio")}</span>
          </button>
        </div>
      )}

    </div>
  )
}
