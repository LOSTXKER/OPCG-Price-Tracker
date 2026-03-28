"use client"

import { useState } from "react"
import { Check, Edit2, Plus, Trash2, X, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

export type PortfolioMeta = {
  id: number
  name: string
  totalValue: number
  itemCount: number
}

export function PortfolioSidebar({
  portfolios,
  activeId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  hideBalance,
}: {
  portfolios: PortfolioMeta[]
  activeId: number | null
  onSelect: (id: number) => void
  onCreate: (name: string) => void
  onRename: (id: number, name: string) => void
  onDelete: (id: number) => void
  hideBalance?: boolean
}) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")

  return (
    <div className="p-1.5">
      {portfolios.map((p) => {
        const isActive = p.id === activeId

        if (editingId === p.id) {
          return (
            <form
              key={p.id}
              className="flex items-center gap-1 px-2.5 py-2"
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
                className="flex-1 rounded bg-muted px-2 py-1 text-sm outline-none"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <button type="submit" className="rounded p-1 text-muted-foreground hover:text-foreground">
                <Check className="size-3.5" />
              </button>
              <button type="button" onClick={() => setEditingId(null)} className="rounded p-1 text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </form>
          )
        }

        return (
          <div
            key={p.id}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all cursor-pointer",
              isActive
                ? "bg-primary/6"
                : "hover:bg-muted/50"
            )}
            onClick={() => onSelect(p.id)}
          >
            <div className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
              isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            )}>
              <Wallet className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-sm", isActive ? "font-semibold" : "font-medium")}>
                {p.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {hideBalance ? "••••" : `¥${p.totalValue.toLocaleString()}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={(e) => { e.stopPropagation(); setEditingId(p.id); setEditName(p.name) }}
                className="rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="size-3" />
              </button>
              {portfolios.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(p.id) }}
                  className="rounded p-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3" />
                </button>
              )}
            </div>
          </div>
        )
      })}

      {/* Create new */}
      {creating ? (
        <form
          className="flex items-center gap-1 px-2.5 py-2"
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
            placeholder="ชื่อพอร์ต..."
            className="flex-1 rounded bg-muted px-2 py-1 text-sm outline-none placeholder:text-muted-foreground/60"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="rounded p-1 text-muted-foreground hover:text-foreground">
            <Check className="size-3.5" />
          </button>
          <button type="button" onClick={() => setCreating(false)} className="rounded p-1 text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        </form>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <div className="flex size-8 items-center justify-center rounded-lg border-2 border-dashed border-border">
            <Plus className="size-3.5" />
          </div>
          สร้างพอร์ตใหม่
        </button>
      )}
    </div>
  )
}
