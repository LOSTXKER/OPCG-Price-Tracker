"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Check, ChevronDown, Package, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"
import { Skeleton } from "@/components/ui/skeleton"
import type { SetListItem } from "./types"

interface SetSelectorProps {
  sets: SetListItem[]
  selectedCode: string
  setsLoading: boolean
  onSelect: (code: string) => void
}

export function SetSelector({ sets, selectedCode, setsLoading, onSelect }: SetSelectorProps) {
  const lang = useUIStore((s) => s.language)
  const [showDropdown, setShowDropdown] = useState(false)
  const [setSearch, setSetSearch] = useState("")

  const selectedSet = sets.find((s) => s.code === selectedCode)

  const groupedSets = useMemo(() => {
    const q = setSearch.trim().toLowerCase()
    const filtered = q
      ? sets.filter(
          (s) =>
            s.code.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q) ||
            s.nameEn?.toLowerCase().includes(q) ||
            s.nameTh?.toLowerCase().includes(q)
        )
      : sets

    const groups: { label: string; items: SetListItem[] }[] = []
    const boosters = filtered.filter((s) => s.type === "BOOSTER")
    const extras = filtered.filter((s) => s.type === "EXTRA_BOOSTER")
    const others = filtered.filter(
      (s) => s.type !== "BOOSTER" && s.type !== "EXTRA_BOOSTER"
    )

    const codeSort = (a: SetListItem, b: SetListItem) => {
      const aMatch = a.code.match(/(\D+)-?(\d+)/)
      const bMatch = b.code.match(/(\D+)-?(\d+)/)
      if (aMatch && bMatch) {
        if (aMatch[1] !== bMatch[1]) return aMatch[1].localeCompare(bMatch[1])
        return parseInt(bMatch[2]) - parseInt(aMatch[2])
      }
      return b.code.localeCompare(a.code)
    }

    if (boosters.length)
      groups.push({ label: "Booster Pack", items: boosters.sort(codeSort) })
    if (extras.length)
      groups.push({ label: "Extra Booster", items: extras.sort(codeSort) })
    if (others.length)
      groups.push({ label: "อื่นๆ", items: others.sort(codeSort) })

    return groups
  }, [sets, setSearch])

  return (
    <section className="panel space-y-3 p-4">
      <label className="block text-sm font-semibold">เลือกชุดการ์ด</label>
      {setsLoading ? (
        <Skeleton className="h-10 w-full rounded-lg" />
      ) : (
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowDropdown(!showDropdown); setSetSearch("") }}
            className="flex h-11 w-full items-center justify-between rounded-lg border border-border bg-background px-3 text-sm transition-all hover:bg-muted/40 hover:shadow-sm"
          >
            {selectedSet ? (
              <span className="flex items-center gap-2.5 text-foreground">
                {selectedSet.imageUrl && (
                  <span className="relative size-7 shrink-0 overflow-hidden rounded bg-muted">
                    <Image src={selectedSet.imageUrl} alt={selectedSet.code} fill className="object-contain" sizes="28px" />
                  </span>
                )}
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {selectedSet.code}
                </span>
                <span className="truncate">
                  {lang === "EN" ? (selectedSet.nameEn ?? selectedSet.name) : selectedSet.name}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">เลือกชุดการ์ด...</span>
            )}
            <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showDropdown && "rotate-180")} />
          </button>

          {showDropdown && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
              <div className="sticky top-0 z-10 border-b border-border bg-popover p-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={setSearch}
                    onChange={(e) => setSetSearch(e.target.value)}
                    placeholder="ค้นหาชุดการ์ด..."
                    className="h-8 w-full rounded-md border border-border bg-muted/30 pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto py-1">
                {groupedSets.length === 0 && (
                  <p className="px-3 py-4 text-center text-sm text-muted-foreground">ไม่พบชุดการ์ด</p>
                )}
                {groupedSets.map((group) => (
                  <div key={group.label}>
                    <div className="border-b border-border/40 bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                      {group.label}
                      <span className="ml-1.5 text-muted-foreground/60">({group.items.length})</span>
                    </div>
                    {group.items.map((s) => (
                      <button
                        key={s.code}
                        type="button"
                        onClick={() => { onSelect(s.code); setShowDropdown(false); setSetSearch("") }}
                        className={cn(
                          "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60",
                          s.code === selectedCode && "bg-primary/5 font-medium"
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
                            <span className="truncate">{lang === "EN" ? (s.nameEn ?? s.name) : s.name}</span>
                          </span>
                        </span>
                        {s.releaseDate && (
                          <span className="shrink-0 text-xs text-muted-foreground/50">
                            {new Date(s.releaseDate).getFullYear()}
                          </span>
                        )}
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
      )}
    </section>
  )
}
