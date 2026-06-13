import { create } from "zustand";

import { ApiError, apiDelete, apiGet, apiPost } from "@/lib/api/client";

interface WatchlistState {
  ids: Set<number>;
  loaded: boolean;
  loading: boolean;
  limitHit: boolean;
  load: () => Promise<void>;
  toggle: (cardId: number) => Promise<void>;
  has: (cardId: number) => boolean;
}

export const useWatchlistStore = create<WatchlistState>()((set, get) => ({
  ids: new Set(),
  loaded: false,
  loading: false,
  limitHit: false,

  load: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const data = await apiGet<{ items: { cardId: number }[] }>(
        "/api/watchlist",
      );
      set({
        ids: new Set(data.items.map((i) => i.cardId)),
        loaded: true,
        loading: false,
      });
    } catch (err) {
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
