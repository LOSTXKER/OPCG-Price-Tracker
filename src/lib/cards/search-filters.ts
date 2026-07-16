export type SearchVariant = "" | "regular" | "parallel"

export interface SearchFilters {
  set: string
  rarities: string[]
  types: string[]
  colors: string[]
  variant: SearchVariant
  minPrice: string
  maxPrice: string
}

export type SearchMultiFilterKey = "rarities" | "types" | "colors"

export interface SerializedSearchFilters {
  set?: string
  rarity?: string
  type?: string
  color?: string
  variant?: Exclude<SearchVariant, "">
  minPrice?: number
  maxPrice?: number
}

export interface CardSearchFacetRow {
  setId: number
  rarity: string
  cardType: string
  colorEn: string | null
  isParallel: boolean
}

export interface CardSearchFacets {
  setIds: number[]
  rarities: string[]
  types: string[]
  colors: string[]
  variants: Array<Exclude<SearchVariant, "">>
}

export function createEmptySearchFilters(): SearchFilters {
  return {
    set: "",
    rarities: [],
    types: [],
    colors: [],
    variant: "",
    minPrice: "",
    maxPrice: "",
  }
}

export function toggleSearchMultiFilter(
  filters: SearchFilters,
  key: SearchMultiFilterKey,
  value: string,
): SearchFilters {
  const current = filters[key]
  return {
    ...filters,
    [key]: current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value],
  }
}

export function resetSearchModalFilters(filters: SearchFilters): SearchFilters {
  return {
    ...filters,
    rarities: [],
    types: [],
    colors: [],
    variant: "",
    minPrice: "",
    maxPrice: "",
  }
}

function positiveInteger(value: string): number | undefined {
  const parsed = Number.parseInt(value, 10)
  return parsed > 0 ? parsed : undefined
}

export function serializeSearchFilters(filters: SearchFilters): SerializedSearchFilters {
  return {
    set: filters.set || undefined,
    rarity: filters.rarities.join(",") || undefined,
    type: filters.types.join(",") || undefined,
    color: filters.colors.join(",") || undefined,
    variant: filters.variant || undefined,
    minPrice: positiveInteger(filters.minPrice),
    maxPrice: positiveInteger(filters.maxPrice),
  }
}

export function countSearchModalFilters(filters: SearchFilters): number {
  return filters.rarities.length
    + filters.types.length
    + filters.colors.length
    + (filters.variant ? 1 : 0)
    + (positiveInteger(filters.minPrice) ? 1 : 0)
    + (positiveInteger(filters.maxPrice) ? 1 : 0)
}

export function countAllSearchFilters(filters: SearchFilters): number {
  return countSearchModalFilters(filters) + (filters.set ? 1 : 0)
}

export function buildCardSearchFacets(rows: readonly CardSearchFacetRow[]): CardSearchFacets {
  const setIds = new Set<number>()
  const rarities = new Set<string>()
  const types = new Set<string>()
  const colors = new Set<string>()
  let hasRegular = false
  let hasParallel = false

  for (const row of rows) {
    setIds.add(row.setId)
    rarities.add(row.rarity.startsWith("P-") ? row.rarity.slice(2) : row.rarity)
    types.add(row.cardType)

    const color = row.colorEn?.trim()
    if (color) colors.add(color.includes("/") ? "multi" : color)

    if (row.isParallel) hasParallel = true
    else hasRegular = true
  }

  return {
    setIds: [...setIds].sort((a, b) => a - b),
    rarities: [...rarities].sort(),
    types: [...types].sort(),
    colors: [...colors].sort(),
    variants: [
      ...(hasRegular ? ["regular" as const] : []),
      ...(hasParallel ? ["parallel" as const] : []),
    ],
  }
}
