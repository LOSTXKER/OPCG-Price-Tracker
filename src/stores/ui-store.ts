import { create } from "zustand";
import { persist } from "zustand/middleware";

type UIMode = "casual" | "trader";
type Currency = "JPY" | "THB";

interface UIState {
  mode: UIMode;
  currency: Currency;
  setMode: (mode: UIMode) => void;
  setCurrency: (currency: Currency) => void;
  toggleCurrency: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      mode: "casual",
      currency: "JPY",
      setMode: (mode) => set({ mode }),
      setCurrency: (currency) => set({ currency }),
      toggleCurrency: () =>
        set((state) => ({
          currency: state.currency === "JPY" ? "THB" : "JPY",
        })),
    }),
    {
      name: "tcg-ui-preferences",
    }
  )
);
