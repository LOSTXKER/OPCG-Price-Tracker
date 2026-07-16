import { create } from "zustand";

import { ApiError, apiDelete, apiGet, apiPost } from "@/lib/api/client";

interface WatchlistState {
  ids: Set<number>;
  loaded: boolean;
  loading: boolean;
  limitHit: boolean;
  syncIds: (cardIds: Iterable<number>) => void;
  load: () => Promise<void>;
  toggle: (cardId: number) => Promise<void>;
  has: (cardId: number) => boolean;
}

let loadGeneration = 0;

export const useWatchlistStore = create<WatchlistState>()((set, get) => ({
  ids: new Set(),
  loaded: false,
  loading: false,
  limitHit: false,

  // The watchlist page already owns an authoritative snapshot. Copy it into
  // the shared store so heart controls elsewhere update immediately and no
  // caller can mutate the store through a Set reference it still owns.
  syncIds: (cardIds) => {
    loadGeneration += 1;
    set({ ids: new Set(cardIds), loaded: true, loading: false });
  },

  load: async () => {
    if (get().loaded || get().loading) return;
    const generation = ++loadGeneration;
    set({ loading: true });
    try {
      const data = await apiGet<{ items: { cardId: number }[] }>(
        "/api/watchlist",
      );
      if (generation !== loadGeneration) return;
      set({
        ids: new Set(data.items.map((i) => i.cardId)),
        loaded: true,
        loading: false,
      });
    } catch (err) {
      if (generation !== loadGeneration) return;
      if (err instanceof ApiError && err.status === 401) {
        set({ loaded: true, loading: false });
        return;
      }
      console.error("Watchlist load error:", err);
      set({ loading: false });
    }
  },

  toggle: async (cardId: number) => {
    const { ids } = get();
    const wasWatched = ids.has(cardId);

    const next = new Set(ids);
    if (wasWatched) next.delete(cardId);
    else next.add(cardId);
    set({ ids: next });

    try {
      if (wasWatched) {
        await apiDelete(`/api/watchlist?cardId=${cardId}`);
      } else {
        await apiPost("/api/watchlist", { cardId });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        set({ ids });
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      if (err instanceof ApiError && err.status === 403) {
        set({ ids, limitHit: true });
        setTimeout(() => set({ limitHit: false }), 3000);
        return;
      }

      console.error("Watchlist toggle error:", err);
      set({ ids });
    }
  },

  has: (cardId: number) => get().ids.has(cardId),
}));
