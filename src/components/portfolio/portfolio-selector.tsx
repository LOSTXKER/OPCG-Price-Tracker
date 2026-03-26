"use client"

import { useState } from "react"
import { Check, ChevronDown, Edit2, Plus, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type PortfolioMeta = {
  id: number
  name: string
  totalValue: number
  itemCount: number
}

export function PortfolioSelector({
  portfolios,
  activeId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: {
  portfolios: PortfolioMeta[]
  activeId: number | null
  onSelect: (id: number) => void
  onCreate: (name: string) => void
  onRename: (id: number, name: string) => void
  onDelete: (id: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")

  const active = portfolios.find((p) => p.id === activeId)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-left transition-colors hover:bg-muted/50"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{active?.name ?? "Portfolio"}</p>
          <p className="text-xs text-muted-foreground">
            {active ? `${active.itemCount} การ์ด · ¥${active.totalValue.toLocaleString()}` : "เลือกพอร์ต"}
          </p>
        </div>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-border bg-popover p-1 shadow-lg">
          {portfolios.map((p) => (
            <div key={p.id} className="group flex items-center gap-1">
              {editingId === p.id ? (
                <form
                  className="flex flex-1 items-center gap-1 px-2 py-1.5"
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
                    className="flex-1 rounded bg-muted px-2 py-0.5 text-sm outline-none"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <button type="submit" className="text-muted-foreground hover:text-foreground">
                    <Check className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="size-3.5" />
                  </button>
                </form>
              ) : (
                <>
                  <button
                    onClick={() => { onSelect(p.id); setOpen(false) }}
                    className={cn(
                      "flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                      p.id === activeId && "bg-muted font-medium"
                    )}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      ¥{p.totalValue.toLocaleString()}
                    </span>
                  </button>
                  <button
                    onClick={() => { setEditingId(p.id); setEditName(p.name) }}
                    className="hidden rounded p-1 text-muted-foreground hover:text-foreground group-hover:block"
                  >
                    <Edit2 className="size-3" />
                  </button>
                  {portfolios.length > 1 && (
                    <button
                      onClick={() => onDelete(p.id)}
                      className="hidden rounded p-1 text-muted-foreground hover:text-destructive group-hover:block"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}

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
                placeholder="ชื่อพอร์ต..."
                className="flex-1 rounded bg-muted px-2 py-1 text-sm outline-none placeholder:text-muted-foreground/60"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <button type="submit" className="text-muted-foreground hover:text-foreground">
                <Check className="size-3.5" />
              </button>
              <button type="button" onClick={() => setCreating(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Plus className="size-3.5" />
              สร้างพอร์ตใหม่
            </button>
          )}
        </div>
      )}
    </div>
  )
}
