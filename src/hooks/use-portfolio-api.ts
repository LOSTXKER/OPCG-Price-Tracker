"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ApiError, apiDelete, apiGet, apiPatch, apiPost, apiTry } from "@/lib/api/client"
import { getCardName, getLocale, t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { invalidateSettings } from "@/hooks/use-settings"
import { DEFAULT_CARD_CONDITION } from "@/lib/constants/ui"
import { getPortfolioFinancials } from "@/lib/portfolio/financials"
import type {
  PortfolioStats,
  AllocationSlice,
  AssetRow,
  PortfolioMeta,
  GameRef,
  HistoryPoint,
  GameBreakdown,
  PortfolioBatchResult,
  PortfolioMutationResult,
  PortfolioQuota,
} from "@/lib/types/portfolio"
import type { CartItem } from "@/components/portfolio/add-card-types"
import { ALL_GAMES, DEFAULT_GAME } from "@/lib/game/constants"
import { useMultigameDemo, MOCK_POKEMON_PORTFOLIO_ITEMS } from "@/lib/mock/multigame-demo"

type CardData = {
  id: number
  cardCode: string
  baseCode: string | null
  nameJp: string
  nameEn: string | null
  imageUrl: string | null
  rarity: string
  latestPriceJpy: number | null
  latestPriceThb: number | null
  priceChange24h: number | null
  priceChange7d: number | null
  set?: { game: GameRef | null } | null
}

export type ItemRow = {
  id: number
  quantity: number
  purchasePrice: number | null
  condition: string
  isPrivate?: boolean
  notes?: string | null
  card: CardData
}

type PortfolioRow = {
  id: number
  name: string
  isPublic: boolean
  items: ItemRow[]
}

type PortfolioListResponse = {
  portfolios: PortfolioRow[]
  effectiveTier: string
  limits: {
    portfolioCount: number | null
    portfolioCards: number | null
  }
}

type PortfolioMutationData = {
  portfolio: PortfolioRow
}

function mutationFailure(error: unknown, fallback: string): PortfolioMutationResult<never> {
  if (error instanceof ApiError) {
    return { ok: false, status: error.status, error: error.message }
  }
  return {
    ok: false,
    status: 0,
    error: error instanceof Error ? error.message : fallback,
  }
}

function toAssetRow(it: ItemRow): AssetRow {
  return {
    itemId: it.id,
    cardId: it.card.id,
    cardCode: it.card.cardCode,
    baseCode: it.card.baseCode,
    nameJp: it.card.nameJp,
    nameEn: it.card.nameEn,
    rarity: it.card.rarity,
    imageUrl: it.card.imageUrl,
    quantity: it.quantity,
    purchasePrice: it.purchasePrice,
    currentPrice: it.card.latestPriceJpy,
    currentPriceThb: it.card.latestPriceThb ?? null,
    priceChange24h: it.card.priceChange24h,
    priceChange7d: it.card.priceChange7d,
    condition: it.condition,
    isPrivate: it.isPrivate ?? false,
    notes: it.notes ?? null,
    game: it.card.set?.game ?? null,
  }
}

/** Per-game roll-up shared by the active-portfolio breakdown (detail page) and
 *  the cross-portfolio breakdown (hub). Null-game holdings fold into the
 *  default game so a chip total reconciles with the scoped hero instead of
 *  quietly dropping value (VISION §5.7). */
function buildGameBreakdown(items: ItemRow[]): GameBreakdown[] {
  const map = new Map<string, { game: GameRef | null; items: ItemRow[] }>()
  for (const it of items) {
    const game = it.card.set?.game ?? null
    const key = game?.slug ?? DEFAULT_GAME
    let entry = map.get(key)
    if (!entry) {
      entry = { game, items: [] }
      map.set(key, entry)
    } else if (!entry.game && game) {
      // A real game ref arrived after a null-game card seeded this key — adopt it
      // so the chip can render its label/logo.
      entry.game = game
    }
    entry.items.push(it)
  }
  return [...map.values()]
    .map((entry) => {
      const financials = getPortfolioFinancials(entry.items)
      return {
        game: entry.game,
        ...financials,
        valueJpy: financials.estimatedValueJpy,
        costJpy: financials.recordedCostJpy,
        pnl: financials.pnlJpy,
        pnlPercent: financials.roiPct,
        count: financials.totalCopyCount,
      }
    })
    .sort((a, b) => b.valueJpy - a.valueJpy)
}

type SnapshotRow = {
  totalJpy: number
  totalThb: number | null
  totalCost: number
  netInvestedJpy: number | null
  pnl: number
  cardCount: number
  snapshotAt: string
}

/**
 * @param gameScope Game filter applied to the ACTIVE portfolio's holdings
 *   (detail page). Ignored by the hub, which never scopes by game.
 * @param activePortfolioId The portfolio to treat as "active" — pass the id
 *   from the `/portfolio/[id]` route param for the detail page. Omit entirely
 *   for the hub (`/portfolio`), which has no single active portfolio: no
 *   auto-select, no history fetch, just the cross-portfolio aggregates below.
 *   Kept in sync via effect (not just an initial value) so switching between
 *   two detail pages client-side (same route, different id) updates in place.
 */
export function usePortfolioApi(gameScope: string = ALL_GAMES, activePortfolioId?: number) {
  const lang = useUIStore((s) => s.language)
  const [portfolios, setPortfolios] = useState<PortfolioRow[]>([])
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [historyPortfolioId, setHistoryPortfolioId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [portfolioQuota, setPortfolioQuota] = useState<PortfolioQuota | null>(null)
  const batchRequestIds = useRef(new Map<string, string>())
  const historyRequestRevision = useRef(0)
  const [activeId, setActiveId] = useState<number | null>(activePortfolioId ?? null)
  // Sync activeId when the caller's `activePortfolioId` prop changes (e.g.
  // navigating client-side between two `/portfolio/[id]` routes reuses this
  // component instance) — adjusted during render per React's "derive state
  // from props" pattern, not in an effect, so it can't cascade an extra commit.
  const [syncedPropId, setSyncedPropId] = useState(activePortfolioId)
  if (activePortfolioId !== undefined && !Object.is(activePortfolioId, syncedPropId)) {
    setSyncedPropId(activePortfolioId)
    setActiveId(activePortfolioId)
  }

  const load = useCallback(async () => {
    try {
      const data = await apiGet<PortfolioListResponse>("/api/portfolio")
      setError(null)
      setPortfolios(data.portfolios ?? [])
      setPortfolioQuota({
        effectiveTier: data.effectiveTier,
        portfolioCount: data.limits.portfolioCount,
        portfolioCards: data.limits.portfolioCards,
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        invalidateSettings()
        const supabase = createClient()
        await supabase.auth.signOut()
      }
      setError(t(lang, "loadFailed"))
    } finally {
      setLoading(false)
    }
  }, [lang])

  const reload = useCallback(async () => {
    setLoading(true)
    await load()
  }, [load])

  // History is scoped to the active portfolio so the hero + scrub reflect exactly
  // that book. Inflow notches mark snapshots where the invested baseline stepped
  // up (cards added) — so adding a card never reads as a gain (VISION §5.3).
  const loadHistory = useCallback(
    async (portfolioId: number, revision: number) => {
      const hData = await apiTry(
        apiGet<{ snapshots: SnapshotRow[] }>(`/api/portfolio/history?portfolioId=${portfolioId}`),
      )
      if (!hData || revision !== historyRequestRevision.current) return
      const locale = getLocale(lang)
      let prevInvested: number | null = null
      const points: HistoryPoint[] = (hData.snapshots ?? []).map((s) => {
        const netInvested = s.netInvestedJpy ?? s.totalCost
        const isInflow = prevInvested != null && netInvested > prevInvested
        prevInvested = netInvested
        return {
          label: new Date(s.snapshotAt).toLocaleDateString(locale, { month: "short", day: "numeric" }),
          date: s.snapshotAt,
          value: s.totalJpy,
          cost: s.totalCost,
          netInvested,
          cardCount: s.cardCount,
          isInflow,
        }
      })
      setHistory(points)
      setHistoryPortfolioId(portfolioId)
    },
    [lang],
  )

  useEffect(() => {
    const t = setTimeout(() => {
      void load()
    }, 0)
    return () => clearTimeout(t)
  }, [load])

  useEffect(() => {
    const revision = ++historyRequestRevision.current
    const tm = setTimeout(() => {
      if (activeId) {
        void loadHistory(activeId, revision)
      } else {
        setHistory([])
        setHistoryPortfolioId(null)
      }
    }, 0)
    return () => {
      clearTimeout(tm)
      if (historyRequestRevision.current === revision) {
        historyRequestRevision.current += 1
      }
    }
  }, [activeId, loadHistory])

  const activePortfolio = useMemo(
    () => portfolios.find((p) => p.id === activeId) ?? null,
    [portfolios, activeId]
  )

  // Demo-only: splice mock Pokémon holdings in so the multi-game UI is visible
  // before real Pokémon data exists (see multigame-demo.ts).
  const demo = useMultigameDemo()
  const items = useMemo(
    () => [...(activePortfolio?.items ?? []), ...(demo ? MOCK_POKEMON_PORTFOLIO_ITEMS : [])],
    [activePortfolio, demo],
  )

  // Holdings narrowed to the active game scope (a slug, or ALL_GAMES for the
  // cross-game aggregate). Cards resolve their game via set.game; a null game
  // falls back to the default game. Drives the scoped value/KPIs/holdings —
  // gameBreakdown below stays cross-game so the breakdown still sums all games.
  const scopedItems = useMemo(() => {
    if (gameScope === ALL_GAMES) return items
    return items.filter((it) => (it.card.set?.game?.slug ?? DEFAULT_GAME) === gameScope)
  }, [items, gameScope])

  const stats = useMemo((): PortfolioStats => {
    const financials = getPortfolioFinancials(scopedItems)
    let best: { name: string; pnl: number; pnlPercent: number | null } | null = null
    let worst: { name: string; pnl: number; pnlPercent: number | null } | null = null

    if (financials.performanceComplete) {
      for (const it of scopedItems) {
        const px = it.card.latestPriceJpy
        if (px == null || it.purchasePrice == null) continue
        const cost = it.purchasePrice * it.quantity
        const value = px * it.quantity
        const linePnl = value - cost
        const linePct =
          it.purchasePrice > 0
            ? ((px - it.purchasePrice) / it.purchasePrice) * 100
            : null
        const name = getCardName(lang, it.card)
        if (!best || linePnl > best.pnl) best = { name, pnl: linePnl, pnlPercent: linePct }
        if (!worst || linePnl < worst.pnl) worst = { name, pnl: linePnl, pnlPercent: linePct }
      }
    }

    return {
      ...financials,
      totalValueJpy: financials.estimatedValueJpy,
      totalCostJpy: financials.recordedCostJpy,
      unrealizedPnl: financials.pnlJpy,
      unrealizedPnlPercent: financials.roiPct,
      bestPerformer: best,
      worstPerformer: worst,
    }
  }, [scopedItems, lang])

  const allocation = useMemo((): AllocationSlice[] => {
    if (stats.totalValueJpy === 0) return []
    const sorted = [...scopedItems]
      .map((it) => ({
        name: getCardName(lang, it.card),
        value: (it.card.latestPriceJpy ?? 0) * it.quantity,
        imageUrl: it.card.imageUrl,
        cardCode: it.card.cardCode,
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)

    const top7 = sorted.slice(0, 7)
    const otherValue = sorted.slice(7).reduce((s, d) => s + d.value, 0)
    const result = top7.map((d) => ({
      ...d,
      percent: (d.value / stats.totalValueJpy) * 100,
    }))
    if (otherValue > 0) {
      result.push({ name: t(lang, "other"), value: otherValue, percent: (otherValue / stats.totalValueJpy) * 100, imageUrl: null, cardCode: "" })
    }
    return result
  }, [scopedItems, stats.totalValueJpy, lang])

  const assets = useMemo((): AssetRow[] => scopedItems.map(toAssetRow), [scopedItems])

  // Per-game roll-up of the ACTIVE portfolio. One group today (OPCG); the UI
  // collapses to an implicit single game and lights up the breakdown /
  // aggregate only when a 2nd game has holdings (VISION §5.7).
  const gameBreakdown = useMemo(() => buildGameBreakdown(items), [items])

  // Every portfolio's items flattened — the hub's cross-portfolio aggregates.
  // Demo Pokémon holdings are intentionally NOT spliced in here (the mock is
  // keyed to a single "active" portfolio and has no natural home across many).
  const allItems = useMemo(() => portfolios.flatMap((p) => p.items), [portfolios])
  const allAssets = useMemo((): AssetRow[] => allItems.map(toAssetRow), [allItems])
  const allGameBreakdown = useMemo(() => buildGameBreakdown(allItems), [allItems])

  const portfolioMetas = useMemo((): PortfolioMeta[] =>
    portfolios.map((p) => {
      const financials = getPortfolioFinancials(p.items)
      const previewItems = [...p.items]
        .sort(
          (a, b) =>
            (b.card.latestPriceJpy ?? 0) * b.quantity - (a.card.latestPriceJpy ?? 0) * a.quantity,
        )
        .slice(0, 4)
        .map((it) => ({
          cardCode: it.card.cardCode,
          imageUrl: it.card.imageUrl,
          nameJp: it.card.nameJp,
          nameEn: it.card.nameEn,
        }))
      return {
        id: p.id,
        name: p.name,
        isPublic: p.isPublic ?? true,
        ...financials,
        totalValue: financials.estimatedValueJpy,
        totalCost: financials.recordedCostJpy,
        itemCount: p.items.length,
        copyCount: financials.totalCopyCount,
        games: [
          ...new Map(
            p.items
              .map((item) => item.card.set?.game ?? null)
              .filter((game): game is GameRef => game != null)
              .map((game) => [game.slug, game]),
          ).values(),
        ],
        previewItems,
      }
    }),
    [portfolios]
  )

  const totalAllPortfolios = useMemo(
    () => portfolioMetas.reduce((s, p) => s + p.totalValue, 0),
    [portfolioMetas]
  )

  const createPortfolio = async (
    name: string,
    isPublic: boolean,
  ): Promise<PortfolioMutationResult<{ id: number; portfolio: PortfolioRow }>> => {
    try {
      const res = await apiPost<PortfolioMutationData>("/api/portfolio", { name, isPublic })
      await load()
      return {
        ok: true,
        status: 201,
        error: null,
        data: { id: res.portfolio.id, portfolio: res.portfolio },
      }
    } catch (err) {
      return mutationFailure(err, t(lang, "createPortfolioFailed"))
    }
  }

  const renamePortfolio = async (
    id: number,
    name: string,
  ): Promise<PortfolioMutationResult<{ portfolio: PortfolioRow }>> => {
    try {
      const res = await apiPatch<PortfolioMutationData>(`/api/portfolio/${id}`, { name })
      setPortfolios((previous) =>
        previous.map((portfolio) =>
          portfolio.id === id ? { ...portfolio, name: res.portfolio.name } : portfolio,
        ),
      )
      return { ok: true, status: 200, error: null, data: res }
    } catch (err) {
      return mutationFailure(err, t(lang, "loadFailed"))
    }
  }

  const setPortfolioVisibility = async (
    id: number,
    isPublic: boolean,
  ): Promise<PortfolioMutationResult<{ portfolio: PortfolioRow }>> => {
    setPortfolios((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isPublic } : p)),
    )
    try {
      const res = await apiPatch<PortfolioMutationData>(`/api/portfolio/${id}`, { isPublic })
      return { ok: true, status: 200, error: null, data: res }
    } catch (err) {
      setPortfolios((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isPublic: !isPublic } : p)),
      )
      return mutationFailure(err, t(lang, "loadFailed"))
    }
  }

  const deletePortfolio = async (
    id: number,
    options: { reloadAfter?: boolean } = {},
  ): Promise<PortfolioMutationResult<{ id: number }>> => {
    try {
      await apiDelete(`/api/portfolio/${id}`)
      if (options.reloadAfter !== false) await load()
      return { ok: true, status: 200, error: null, data: { id } }
    } catch (err) {
      return mutationFailure(err, t(lang, "loadFailed"))
    }
  }

  const addCardsBatch = async (
    portfolioId: number,
    cartItems: CartItem[],
  ): Promise<PortfolioBatchResult> => {
    if (cartItems.length === 0) {
      return {
        ok: true,
        status: 200,
        error: null,
        data: { added: 0, updated: 0 },
        failed: 0,
      }
    }

    try {
      const batchKey = JSON.stringify({
        portfolioId,
        items: cartItems
          .map((item) => ({
            cardId: item.card.id,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
            condition: DEFAULT_CARD_CONDITION,
          }))
          .sort((a, b) => a.cardId - b.cardId),
      })
      const requestId =
        batchRequestIds.current.get(batchKey) ?? globalThis.crypto.randomUUID()
      batchRequestIds.current.set(batchKey, requestId)

      const result = await apiPost<{ ok: true; added: number; updated: number }>(
        "/api/portfolio/items/batch",
        {
          portfolioId,
          requestId,
          items: cartItems.map((item) => ({
            cardId: item.card.id,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
            condition: DEFAULT_CARD_CONDITION,
          })),
        }
      )
      batchRequestIds.current.delete(batchKey)
      await load()
      return {
        ok: true,
        status: 200,
        error: null,
        data: { added: result.added, updated: result.updated },
        failed: 0,
      }
    } catch (err) {
      const failure = mutationFailure(err, t(lang, "addFailed"))
      return {
        ...failure,
        failed: cartItems.length,
        limitReached: failure.status === 403,
      }
    }
  }

  const updateItem = async (
    itemId: number,
    data: {
      quantity?: number
      purchasePrice?: number | null
      isPrivate?: boolean
      notes?: string | null
    },
  ): Promise<boolean> => {
    const res = await apiTry(apiPatch(`/api/portfolio/items/${itemId}`, data))
    if (res === null) return false
    void load()
    return true
  }

  const removeItem = async (itemId: number): Promise<boolean> => {
    const res = await apiTry(apiDelete(`/api/portfolio/items/${itemId}`))
    if (res === null) return false
    void load()
    return true
  }

  return {
    portfolios,
    history: historyPortfolioId === activeId ? history : [],
    loading,
    error,
    activeId,
    setActiveId,
    activePortfolio,
    stats,
    allocation,
    assets,
    gameBreakdown,
    allAssets,
    allGameBreakdown,
    portfolioMetas,
    portfolioQuota,
    totalAllPortfolios,
    reload,
    createPortfolio,
    renamePortfolio,
    setPortfolioVisibility,
    deletePortfolio,
    addCardsBatch,
    updateItem,
    removeItem,
  }
}
