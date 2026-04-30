import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MAX_COMPARE } from "@/lib/constants/prices";

export interface CompareItem {
  cardCode: string;
  name: string;
  imageUrl: string | null;
  rarity: string;
}

interface CompareState {
  items: CompareItem[];
  /**
   * Flipped to `true` once the user has actually viewed the /compare page.
   * While `true` the floating cart-style bar stays hidden on other pages —
   * the user has already "checked out" on this selection. Adding another
   * card resets this back to `false` so the bar reappears.
   */
  seen: boolean;
  toggle: (item: CompareItem) => void;
  remove: (cardCode: string) => void;
  clear: () => void;
  has: (cardCode: string) => boolean;
  markSeen: () => void;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      seen: false,

      toggle: (item) =>
        set((state) => {
          const exists = state.items.some((i) => i.cardCode === item.cardCode);
          if (exists) {
            return { items: state.items.filter((i) => i.cardCode !== item.cardCode) };
          }
          if (state.items.length >= MAX_COMPARE) return state;
          return { items: [...state.items, item], seen: false };
        }),

      remove: (cardCode) =>
        set((state) => ({
          items: state.items.filter((i) => i.cardCode !== cardCode),
        })),

      clear: () => set({ items: [], seen: false }),

      has: (cardCode) => get().items.some((i) => i.cardCode === cardCode),

      markSeen: () => set({ seen: true }),
    }),
    {
      name: "kuma-compare",
      // v2 wipes any state produced by the old "auto-seed the highest-value
      // card" behaviour, which used to silently push a card into the store
      // on first visit to /compare. Existing users who are carrying that
      // ghost selection get reset to a clean slate exactly once.
      version: 2,
      migrate: (persistedState, version) => {
        if (version < 2) return { items: [], seen: false };
        return persistedState as CompareState;
      },
    },
  )
);
