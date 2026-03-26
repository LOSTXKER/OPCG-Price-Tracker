import { create } from "zustand";

interface WatchlistState {
  ids: Set<number>;
  loaded: boolean;
  loading: boolean;
  load: () => Promise<void>;
  toggle: (cardId: number) => Promise<void>;
  has: (cardId: number) => boolean;
}

export const useWatchlistStore = create<WatchlistState>()((set, get) => ({
  ids: new Set(),
  loaded: false,
  loading: false,

  load: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const res = await fetch("/api/watchlist");
      if (res.status === 401) {
        set({ loaded: true, loading: false });
        return;
      }
      if (!res.ok) {
        set({ loading: false });
        return;
      }
      const data = (await res.json()) as {
        items: { cardId: number }[];
      };
      set({
        ids: new Set(data.items.map((i) => i.cardId)),
        loaded: true,
        loading: false,
      });
    } catch {
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
      const res = wasWatched
        ? await fetch(`/api/watchlist?cardId=${cardId}`, { method: "DELETE" })
        : await fetch("/api/watchlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cardId }),
          });

      if (res.status === 401) {
        set({ ids });
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      if (!res.ok) {
        set({ ids });
      }
    } catch {
      set({ ids });
    }
  },

  has: (cardId: number) => get().ids.has(cardId),
}));
