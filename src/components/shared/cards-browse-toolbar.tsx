"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import type { FilterDefinition } from "@/components/shared/filter-chips"
import { FilterChips } from "@/components/shared/filter-chips"
import { SearchBar } from "@/components/shared/search-bar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type CardsBrowseToolbarProps = {
  className?: string
  initialSearch: string
  initialSelected: Record<string, string[]>
  filterDefinitions: FilterDefinition[]
  sort: string
  minPrice: number
  maxPrice: number
  page: number
}

function buildQuery(args: {
  search: string
  selected: Record<string, string[]>
  sort: string
  minPrice: number
  maxPrice: number
  page: number
}) {
  const params = new URLSearchParams()
  const s = args.search.trim()
  if (s) params.set("search", s)
  const setCodes = args.selected.set ?? []
  if (setCodes.length) params.set("set", setCodes.join(","))
  const rarities = args.selected.rarity ?? []
  if (rarities.length) params.set("rarity", rarities.join(","))
  const types = args.selected.type ?? []
  if (types.length) params.set("type", types.join(","))
  const colors = args.selected.color ?? []
  if (colors.length) params.set("color", colors.join(","))
  if (args.sort && args.sort !== "newest") params.set("sort", args.sort)
  if (args.minPrice > 0) params.set("minPrice", String(args.minPrice))
  if (args.maxPrice > 0) params.set("maxPrice", String(args.maxPrice))
  if (args.page > 1) params.set("page", String(args.page))
  const q = params.toString()
  return q ? `/cards?${q}` : "/cards"
}

export function CardsBrowseToolbar({
  className,
  initialSearch,
  initialSelected,
  filterDefinitions,
  sort: initialSort,
  minPrice: initialMin,
  maxPrice: initialMax,
  page: _initialPage,
}: CardsBrowseToolbarProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [selected, setSelected] =
    useState<Record<string, string[]>>(initialSelected)
  const [sort, setSort] = useState(initialSort)
  const [minPrice, setMinPrice] = useState(
    initialMin > 0 ? String(initialMin) : ""
  )
  const [maxPrice, setMaxPrice] = useState(
    initialMax > 0 ? String(initialMax) : ""
  )

  useEffect(() => {
    setSearch(initialSearch)
    setSelected(initialSelected)
    setSort(initialSort)
    setMinPrice(initialMin > 0 ? String(initialMin) : "")
    setMaxPrice(initialMax > 0 ? String(initialMax) : "")
  }, [
    initialSearch,
    initialSelected,
    initialSort,
    initialMin,
    initialMax,
  ])

  const navigate = useCallback(
    (next: {
      search?: string
      selected?: Record<string, string[]>
      sort?: string
      minPrice?: number
      maxPrice?: number
      page?: number
    }) => {
      const href = buildQuery({
        search: next.search ?? search,
        selected: next.selected ?? selected,
        sort: next.sort ?? sort,
        minPrice: next.minPrice ?? (Number(minPrice) || 0),
        maxPrice: next.maxPrice ?? (Number(maxPrice) || 0),
        page: next.page ?? 1,
      })
      router.push(href)
    },
    [router, search, selected, sort, minPrice, maxPrice]
  )

  const onFilterChange = useCallback(
    (key: string, values: string[]) => {
      const next = { ...selected, [key]: values }
      setSelected(next)
      navigate({ selected: next, page: 1 })
    },
    [navigate, selected]
  )

  const sortOptions = useMemo(
    () =>
      [
        { value: "newest", label: "ล่าสุด" },
        { value: "price_asc", label: "ราคา ↑" },
        { value: "price_desc", label: "ราคา ↓" },
        { value: "change_desc", label: "เปลี่ยน 24 ชม." },
        { value: "change_7d_desc", label: "เปลี่ยน 7 วัน" },
        { value: "name", label: "ชื่อ A–Z" },
      ] as const,
    []
  )

  return (
    <div className={cn("space-y-4", className)}>
      <SearchBar
        initialQuery={initialSearch}
        onSearch={(q) => setSearch(q)}
        onCommitSearch={(trimmed) => {
          setSearch(trimmed)
          navigate({ search: trimmed, page: 1 })
        }}
        className="max-w-xl"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="grid w-full max-w-xs gap-1.5 sm:max-w-[220px]">
          <span className="text-muted-foreground text-xs">เรียงตาม</span>
          <Select
            value={sort}
            onValueChange={(v) => {
              if (v == null) return
              setSort(v)
              navigate({ sort: v, page: 1 })
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid w-[7rem] gap-1.5">
            <span className="text-muted-foreground text-xs">ราคาต่ำสุด ¥</span>
            <Input
              inputMode="numeric"
              placeholder="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className="grid w-[7rem] gap-1.5">
            <span className="text-muted-foreground text-xs">ราคาสูงสุด ¥</span>
            <Input
              inputMode="numeric"
              placeholder="∞"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mb-0.5"
            onClick={() =>
              navigate({
                minPrice: Number(minPrice) || 0,
                maxPrice: Number(maxPrice) || 0,
                page: 1,
              })
            }
          >
            ใช้ช่วงราคา
          </Button>
        </div>
      </div>
      <FilterChips
        filters={filterDefinitions}
        selected={selected}
        onChange={onFilterChange}
      />
    </div>
  )
}
