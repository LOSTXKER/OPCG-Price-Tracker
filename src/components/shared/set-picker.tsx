"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Check, ChevronDown, LayoutGrid, Package, Search } from "lucide-react"

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
   * pill   — compact rounded pill (used in page header, e.g. Drop Calculator)
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
}: SetPickerProps) {
  const lang = useUIStore((s) => s.language)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  const selectedSet = sets.find((s) => s.code === selectedCode)

  const groupedSets = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? sets.filter(
          (s) =>
            s.code.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q) ||
            s.nameEn?.toLowerCase().includes(q) ||
            s.nameTh?.toLowerCase().includes(q)
        )
      : sets

    const boosters = filtered.filter((s) => s.type === "BOOSTER")
    const extras = filtered.filter((s) => s.type === "EXTRA_BOOSTER")
    const others = filtered.filter(
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
  }, [sets, query, lang])

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
    if (variant === "inline") return <Skeleton className="h-9 w-full rounded-lg" />
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
        onClick={() => { setOpen(!open); setQuery("") }}
        className={cn(
          "flex items-center gap-2 transition-colors",
          isCta && cn(
            "h-12 w-full rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-3 text-base text-foreground",
            "hover:border-primary/60 hover:bg-primary/10",
            open && "border-primary/60 bg-primary/10",
          ),
          isPill && cn(
            "h-9 max-w-[18rem] rounded-full border border-border bg-background pl-1 pr-3 text-sm",
            "hover:bg-muted/50",
            open && "bg-muted/50",
          ),
          isInline && cn(
            "h-9 w-full rounded-lg border bg-background px-2.5 text-sm",
            selectedSet
              ? "border-primary/40 bg-primary/10"
              : prominent
                ? "border-primary/40 bg-[var(--p-honey-soft)] font-medium text-foreground hover:bg-primary/15"
                : "border-border hover:bg-muted/40",
            open && (selectedSet || prominent ? "bg-primary/15" : "bg-muted/40"),
          ),
        )}
      >
        {selectedSet ? (
          <>
            {selectedSet.imageUrl ? (
              <span className={cn(
                "relative shrink-0 overflow-hidden bg-muted",
                isCta ? "size-9 rounded-full" : isInline ? "size-6 rounded" : "size-7 rounded-full",
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
                isCta ? "size-9 rounded-full" : isInline ? "size-6 rounded" : "size-7 rounded-full",
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
              isCta ? "size-9 rounded-full bg-primary/10" : isInline ? "size-6 rounded bg-muted" : "size-7 rounded-full bg-primary/10",
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
          "absolute z-30 mt-2 overflow-hidden rounded-xl border border-border bg-popover shadow-xl",
          isCta && "left-0 right-0 w-full",
          isInline && cn(
            "min-w-full w-[min(22rem,calc(100vw-2rem))]",
            popoverAlign === "right" ? "right-0" : "left-0",
          ),
          isPill && (popoverAlign === "right"
            ? "right-0 w-[min(22rem,calc(100vw-2rem))]"
            : "left-0 w-[min(22rem,calc(100vw-2rem))]"),
        )}>
          <div className="sticky top-0 z-10 border-b border-border bg-popover p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(lang, "searchSet")}
                className="h-8 w-full rounded-md border border-border bg-muted/30 pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            {nullable && query.trim().length === 0 && (
              <button
                type="button"
                onClick={() => { onSelect(null); setOpen(false); setQuery("") }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60",
                  !selectedCode && "bg-primary/5 font-medium",
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded bg-muted">
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
                <div className="border-b border-border/40 bg-muted/40 px-3 py-1.5 text-eyebrow">
                  {group.label}
                  <span className="ml-1.5 text-muted-foreground/60">({group.items.length})</span>
                </div>
                {group.items.map((s) => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => { onSelect(s.code); setOpen(false); setQuery("") }}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60",
                      s.code === selectedCode && "bg-primary/5 font-medium",
                    )}
                  >
                    {s.imageUrl ? (
                      <span className="relative size-8 shrink-0 overflow-hidden rounded bg-muted">
                        <Image src={s.imageUrl} alt={s.code} fill className="object-contain" sizes="32px" />
                      </span>
                    ) : (
                      <span className="flex size-8 shrink-0 items-center justify-center rounded bg-muted">
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
