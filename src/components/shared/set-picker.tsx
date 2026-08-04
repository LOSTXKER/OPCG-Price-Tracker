"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Check, ChevronDown, LayoutGrid, Package } from "lucide-react"

import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { Skeleton } from "@/components/ui/skeleton"

export interface SetPickerItem {
  code: string
  name: string
  nameEn: string | null
  nameTh?: string | null
  type: string
  releaseDate?: string | null
  imageUrl?: string | null
  /** Optional card count, shown at the end of the row when provided. */
  cardCount?: number
}

function setName(s: SetPickerItem, lang: string) {
  if (lang === "TH") return s.nameTh ?? s.nameEn ?? s.name
  if (lang === "EN") return s.nameEn ?? s.name
  return s.name
}

interface SetPickerProps {
  sets: SetPickerItem[]
  selectedCode: string | null
  loading?: boolean
  onSelect: (code: string | null) => void
  /**
   * pill   — compact rounded-sm pill (used in page header, e.g. Drop Calculator)
   * cta    — large dashed-border CTA (used in empty states)
   * inline — full-width square trigger (used inside filter panels / forms)
   */
  variant?: "pill" | "cta" | "inline"
  /** When true, the popover renders an "All sets" row that calls onSelect(null). */
  nullable?: boolean
  /** Popover horizontal alignment relative to the trigger. */
  align?: "left" | "right"
  /**
   * Honey-accented trigger for the `inline` variant — used where set selection is
   * the primary browse axis (e.g. the home market toolbar) and should stand out
   * even before a set is picked.
   */
  prominent?: boolean
  /** Optional inline-trigger styling for a specific surface without changing the popover. */
  triggerClassName?: string
}

export function SetPicker({
  sets,
  selectedCode,
  loading,
  onSelect,
  variant = "pill",
  nullable = false,
  align,
  prominent = false,
  triggerClassName,
}: SetPickerProps) {
  const lang = useUIStore((s) => s.language)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selectedSet = sets.find((s) => s.code === selectedCode)

  const groupedSets = useMemo(() => {
    const boosters = sets.filter((s) => s.type === "BOOSTER")
    const extras = sets.filter((s) => s.type === "EXTRA_BOOSTER")
    const others = sets.filter(
      (s) => s.type !== "BOOSTER" && s.type !== "EXTRA_BOOSTER"
    )

    const codeSort = (a: SetPickerItem, b: SetPickerItem) => {
      const aMatch = a.code.match(/(\D+)-?(\d+)/)
      const bMatch = b.code.match(/(\D+)-?(\d+)/)
      if (aMatch && bMatch) {
        if (aMatch[1] !== bMatch[1]) return aMatch[1].localeCompare(bMatch[1])
        return parseInt(aMatch[2]) - parseInt(bMatch[2])
      }
      return a.code.localeCompare(b.code)
    }

    const groups: { label: string; items: SetPickerItem[] }[] = []
    if (boosters.length)
      groups.push({ label: "Booster Pack", items: boosters.sort(codeSort) })
    if (extras.length)
      groups.push({ label: "Extra Booster", items: extras.sort(codeSort) })
    if (others.length)
      groups.push({ label: t(lang, "other"), items: others.sort(codeSort) })

    return groups
  }, [sets, lang])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [open])

  if (loading) {
    if (variant === "cta") return <Skeleton className="h-12 w-72 rounded-xl" />
    if (variant === "inline") return <Skeleton className="h-11 w-full rounded-lg sm:h-9" />
    return <Skeleton className="h-9 w-56 rounded-full" />
  }

  const isCta = variant === "cta"
  const isInline = variant === "inline"
  const isPill = variant === "pill"
  const popoverAlign = align ?? (isPill ? "right" : "left")

  return (
    <div ref={ref} className={cn("relative", (isCta || isInline) && "w-full", isCta && "max-w-md")}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 motion-base",
          isCta && cn(
            "h-12 w-full rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-3 text-base text-foreground",
            "hover:border-primary/60 hover:bg-primary/10",
            open && "border-primary/60 bg-primary/10",
          ),
          isPill && cn(
            "h-11 max-w-[18rem] rounded-full border border-border bg-background pl-1 pr-3 text-sm sm:h-9",
            "hover:bg-muted/70",
            open && "bg-muted/70",
          ),
          isInline && cn(
            "h-11 w-full rounded-lg border bg-background px-2.5 text-sm sm:h-9",
            selectedSet
              ? "border-primary/40 bg-primary/10"
              : prominent
                ? "border-primary/40 bg-[var(--p-honey-soft)] font-medium text-foreground hover:bg-primary/15"
                : "border-border hover:bg-muted/70",
            triggerClassName,
            open && (selectedSet || prominent ? "bg-primary/15" : "bg-muted/70"),
            // square off the bottom so the dropdown reads as one attached unit
            open && "rounded-b-none",
          ),
        )}
      >
        {selectedSet ? (
          <>
            {selectedSet.imageUrl ? (
              <span className={cn(
                "relative shrink-0 overflow-hidden bg-muted",
                isCta ? "size-9 rounded-full" : isInline ? "size-6 rounded-sm" : "size-7 rounded-full",
              )}>
                <Image
                  src={selectedSet.imageUrl}
                  alt={selectedSet.code}
                  fill
                  className="object-contain"
                  sizes={isCta ? "36px" : isInline ? "24px" : "28px"}
                />
              </span>
            ) : (
              <span className={cn(
                "flex shrink-0 items-center justify-center bg-muted",
                isCta ? "size-9 rounded-full" : isInline ? "size-6 rounded-sm" : "size-7 rounded-full",
              )}>
                <Package className={cn(
                  isCta ? "size-4" : "size-3.5",
                  "text-muted-foreground/60",
                )} />
              </span>
            )}
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {selectedSet.code}
            </span>
            <span className="truncate text-foreground">
              {setName(selectedSet, lang)}
            </span>
          </>
        ) : (
          <>
            <span className={cn(
              "flex shrink-0 items-center justify-center",
              isCta ? "size-9 rounded-full bg-primary/10" : isInline ? "size-6 rounded-sm bg-muted" : "size-7 rounded-full bg-primary/10",
            )}>
              {isInline ? (
                <LayoutGrid className="size-3.5 text-muted-foreground/60" />
              ) : (
                <Package className={cn(
                  isCta ? "size-4 text-primary" : "size-3.5 text-muted-foreground/60",
                )} />
              )}
            </span>
            <span className={cn(
              isCta && "font-medium text-foreground",
              !isCta && "text-muted-foreground",
            )}>
              {nullable ? t(lang, "allSets") : t(lang, "selectSet")}
            </span>
          </>
        )}
        <ChevronDown className={cn(
          "ml-auto shrink-0 transition-transform",
          isCta ? "size-5 text-primary" : "size-4 text-muted-foreground",
          open && "rotate-180",
        )} />
      </button>

      {open && (
        <div className={cn(
          "absolute z-dropdown overflow-hidden border border-border bg-popover shadow-[var(--elev-overlay)]",
          isCta && "mt-2 left-0 right-0 w-full rounded-xl",
          // inline: attach directly under the trigger (overlap its border by 1px,
          // square top, MATCH the trigger width) so trigger + list read as one
          // connected unit of equal width — เบส. Give the trigger enough width
          // at the call site (e.g. home sm:w-[19rem]) so names fit.
          isInline && "-mt-px left-0 right-0 w-full rounded-b-xl rounded-t-none",
          isPill && (popoverAlign === "right"
            ? "mt-2 right-0 w-[min(22rem,calc(100vw-2rem))] rounded-xl"
            : "mt-2 left-0 w-[min(22rem,calc(100vw-2rem))] rounded-xl"),
        )}>
          <div className="max-h-72 overflow-y-auto py-1">
            {nullable && (
              <button
                type="button"
                onClick={() => { onSelect(null); setOpen(false) }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm motion-base hover:bg-muted/70",
                  !selectedCode && "bg-primary/5 font-medium",
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-muted">
                  <LayoutGrid className="size-3.5 text-muted-foreground/60" />
                </span>
                <span className="min-w-0 flex-1 truncate">{t(lang, "allSets")}</span>
                {!selectedCode && <Check className="size-3.5 shrink-0 text-primary" />}
              </button>
            )}

            {groupedSets.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">{t(lang, "noSetsFound")}</p>
            )}

            {groupedSets.map((group) => (
              <div key={group.label}>
                <div className="border-b border-hair bg-muted/40 px-3 py-1.5 text-eyebrow">
                  {group.label}
                  <span className="ml-1.5 text-muted-foreground/60">({group.items.length})</span>
                </div>
                {group.items.map((s) => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => { onSelect(s.code); setOpen(false) }}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm motion-base hover:bg-muted/70",
                      s.code === selectedCode && "bg-primary/5 font-medium",
                    )}
                  >
                    {s.imageUrl ? (
                      <span className="relative size-8 shrink-0 overflow-hidden rounded-sm bg-muted">
                        <Image src={s.imageUrl} alt={s.code} fill className="object-contain" sizes="32px" />
                      </span>
                    ) : (
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-muted">
                        <Package className="size-3.5 text-muted-foreground/40" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">{s.code}</span>
                        <span className="truncate">{setName(s, lang)}</span>
                      </span>
                    </span>
                    {s.cardCount != null ? (
                      <span className="shrink-0 text-meta text-muted-foreground/50">
                        {s.cardCount}
                      </span>
                    ) : s.releaseDate ? (
                      <span className="shrink-0 text-meta text-muted-foreground/50">
                        {new Date(s.releaseDate).getFullYear()}
                      </span>
                    ) : null}
                    {s.code === selectedCode && (
                      <Check className="size-3.5 shrink-0 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
