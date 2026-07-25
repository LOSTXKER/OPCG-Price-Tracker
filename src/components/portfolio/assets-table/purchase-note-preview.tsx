import { StickyNote } from "lucide-react"

import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function PurchaseNotePreview({
  note,
  lang,
}: {
  note: string | null
  lang: Language
}) {
  const savedNote = note?.trim() || null
  const text = savedNote ?? t(lang, "addPortfolioNote")

  return (
    <span
      className={cn(
        "mt-0.5 flex min-w-0 max-w-full items-center gap-1.5 text-meta",
        savedNote ? "text-muted-foreground" : "text-primary",
      )}
      data-slot="portfolio-purchase-note-preview"
      data-state={savedNote ? "saved" : "empty"}
      title={text}
    >
      <StickyNote className="size-3 shrink-0" aria-hidden />
      <span className="truncate">{text}</span>
    </span>
  )
}
