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
  toggle: (item: CompareItem) => void;
  remove: (cardCode: string) => void;
  clear: () => void;
  has: (cardCode: string) => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (item) =>
        set((state) => {
          const exists = state.items.some((i) => i.cardCode === item.cardCode);
          if (exists) {
            return { items: state.items.filter((i) => i.cardCode !== item.cardCode) };
          }
          if (state.items.length >= MAX_COMPARE) return state;
          return { items: [...state.items, item] };
        }),

      remove: (cardCode) =>
        set((state) => ({
          items: state.items.filter((i) => i.cardCode !== cardCode),
        })),

      clear: () => set({ items: [] }),

      has: (cardCode) => get().items.some((i) => i.cardCode === cardCode),
    }),
    {
      name: "kuma-compare",
    }
  )
);
