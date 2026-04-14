import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Language, Currency } from "@/lib/i18n";

export type { Language, Currency };
type CardView = "grid" | "list";

const CURRENCY_CYCLE: Currency[] = ["THB", "JPY", "USD"];
const LANGUAGE_CYCLE: Language[] = ["TH", "EN", "JP"];

interface UIState {
  language: Language;
  currency: Currency;
  cardView: CardView;
  dismissedBanner: boolean;
  mobileMenuOpen: boolean;
  searchOpen: boolean;
  unreadMessages: number;
  setLanguage: (language: Language) => void;
  cycleLanguage: () => void;
  setCurrency: (currency: Currency) => void;
  cycleCurrency: () => void;
  setCardView: (view: CardView) => void;
  dismissBanner: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setSearchOpen: (open: boolean) => void;
  setUnreadMessages: (count: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      language: "TH",
      currency: "THB",
      cardView: "grid",
      dismissedBanner: false,
      mobileMenuOpen: false,
      searchOpen: false,
      unreadMessages: 0,
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
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      toggleMobileMenu: () => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),
      setSearchOpen: (open) => set({ searchOpen: open }),
      setUnreadMessages: (count) => set({ unreadMessages: count }),
    }),
    {
      name: "kuma-ui-preferences",
      partialize: (state) => ({
        language: state.language,
        currency: state.currency,
        cardView: state.cardView,
        dismissedBanner: state.dismissedBanner,
      }),
    }
  )
);
