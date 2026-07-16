"use client"

import { Pencil } from "lucide-react"

import { t, type Language } from "@/lib/i18n"

export function AssetEditButton({
  lang,
  onEdit,
}: {
  lang: Language
  onEdit: () => void
}) {
  const label = t(lang, "edit")
  // Ghost icon — no border chrome on every row (minimal pass); aria-label +
  // title carry the name, hover/focus reveal the affordance.
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={label}
      title={label}
      className="tap-safe inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <Pencil className="size-3.5" />
    </button>
  )
}
