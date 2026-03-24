import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "TH" | "EN" | "JP";
export type Currency = "THB" | "JPY" | "USD";
type CardView = "grid" | "list";

const CURRENCY_CYCLE: Currency[] = ["THB", "JPY", "USD"];
const LANGUAGE_CYCLE: Language[] = ["TH", "EN", "JP"];

interface UIState {
  language: Language;
  currency: Currency;
  cardView: CardView;
  dismissedBanner: boolean;
  setLanguage: (language: Language) => void;
  cycleLanguage: () => void;
  setCurrency: (currency: Currency) => void;
  cycleCurrency: () => void;
  setCardView: (view: CardView) => void;
  dismissBanner: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      language: "TH",
      currency: "THB",
      cardView: "grid",
      dismissedBanner: false,
      setLanguage: (language) => set({ language }),
      cycleLanguage: () =>
        set((state) => {
          const idx = LANGUAGE_CYCLE.indexOf(state.language);
          return { language: LANGUAGE_CYCLE[(idx + 1) % LANGUAGE_CYCLE.length] };
        }),
      setCurrency: (currency) => set({ currency }),
      cycleCurrency: () =>
        set((state) => {
          const idx = CURRENCY_CYCLE.indexOf(state.currency);
          return { currency: CURRENCY_CYCLE[(idx + 1) % CURRENCY_CYCLE.length] };
        }),
      setCardView: (cardView) => set({ cardView }),
      dismissBanner: () => set({ dismissedBanner: true }),
    }),
    {
      name: "kuma-ui-preferences",
    }
  )
);
