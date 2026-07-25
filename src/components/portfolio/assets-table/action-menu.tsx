"use client"

import { ChevronRight } from "lucide-react"

import { IconButton } from "@/components/ui/icon-button"
import { t, type Language } from "@/lib/i18n"

export function AssetDetailsButton({
  lang,
  onOpen,
  contextLabel,
  appearance = "solid",
}: {
  lang: Language
  onOpen: () => void
  contextLabel: string
  /** `ghost` = bare chevron for the mobile list, where the whole row is already
   *  tappable and a filled circle per row was just weight (tap area stays 44px
   *  via `tap-safe`). */
  appearance?: "solid" | "ghost"
}) {
  const label = t(lang, "details")
  const accessibleLabel = `${label}: ${contextLabel}`
  const ghost = appearance === "ghost"

  return (
    <IconButton
      size={ghost ? "sm" : "md"}
      variant={ghost ? "ghost" : "solid"}
      onClick={(event) => {
        event.stopPropagation()
        onOpen()
      }}
      aria-label={accessibleLabel}
      title={label}
      aria-haspopup="dialog"
      data-slot="portfolio-purchase-details"
      className={
        ghost
          ? "text-muted-foreground/50 group-hover:text-foreground"
          : "rounded-full bg-muted/40 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
      }
    >
      <ChevronRight
        className="size-4 transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </IconButton>
  )
}
