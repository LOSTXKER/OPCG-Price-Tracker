"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { CONDITIONS, RARITIES } from "./types"

export function BrowseFiltersSheet({
  conditions,
  rarities,
  onToggleCondition,
  onToggleRarity,
  onClear,
}: {
  conditions: string[]
  rarities: string[]
  onToggleCondition: (value: string) => void
  onToggleRarity: (value: string) => void
  onClear: () => void
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">สภาพการ์ด</p>
        <div className="flex flex-wrap gap-1.5">
          {CONDITIONS.map((c) => (
            <button
              key={c}
              onClick={() => onToggleCondition(c)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                conditions.includes(c)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">ความหายาก</p>
        <div className="flex flex-wrap gap-1.5">
          {RARITIES.map((r) => (
            <button
              key={r}
              onClick={() => onToggleRarity(r)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                rarities.includes(r)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      {(conditions.length > 0 || rarities.length > 0) && (
        <Button variant="ghost" size="xs" onClick={onClear}>
          ล้างตัวกรอง
        </Button>
      )}
    </div>
  )
}
