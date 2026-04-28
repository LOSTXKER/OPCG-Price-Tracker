"use client"

import { Edit2, MoreHorizontal, Trash2 } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { formatPct } from "@/lib/utils/currency"

export function AssetActionMenu({
  lang,
  onEdit,
  onRemove,
}: {
  lang: Language
  onEdit: () => void
  onRemove: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
        <DropdownMenuItem onClick={onEdit}>
          <Edit2 />
          {t(lang, "edit")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onRemove}>
          <Trash2 />
          {t(lang, "remove")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ChangeCell({
  value,
  label,
}: {
  value?: number | null
  label?: string
}) {
  if (value == null)
    return label ? (
      <span className="font-price text-meta text-muted-foreground/60">
        {label} —
      </span>
    ) : (
      <span className="font-price text-xs text-muted-foreground">—</span>
    )
  return (
    <span
      className={cn(
        "font-price text-micro tabular-nums",
        value > 0
          ? "text-price-up"
          : value < 0
            ? "text-price-down"
            : "text-muted-foreground",
      )}
    >
      {label && <span className="mr-0.5 font-sans text-muted-foreground/60">{label}</span>}
      {value > 0 ? "+" : ""}
      {formatPct(value)}%
    </span>
  )
}
