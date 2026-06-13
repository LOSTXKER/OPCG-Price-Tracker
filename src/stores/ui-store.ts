import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Language, Currency } from "@/lib/i18n";

export type { Language, Currency };
type CardView = "grid" | "list";
/** null = undecided (banner shows when ads are live); set on user choice. */
export type AdConsent = "granted" | "denied" | null;

const CURRENCY_CYCLE: Currency[] = ["THB", "JPY", "USD"];
const LANGUAGE_CYCLE: Language[] = ["TH", "EN", "JP"];

interface UIState {
  language: Language;
  currency: Currency;
  /** Active card game slug (e.g. "opcg"). Scopes browse/search/decks. Game switcher UI lands in P4. */
  currentGame: string;
  cardView: CardView;
  dismissedBanner: boolean;
  /** Ad/cookie consent for ad networks (AdSense). House ads don't need it. */
  adConsent: AdConsent;
  mobileMenuOpen: boolean;
  searchOpen: boolean;
  unreadMessages: number;
  setLanguage: (language: Language) => void;
  cycleLanguage: () => void;
  setCurrency: (currency: Currency) => void;
  cycleCurrency: () => void;
  setCurrentGame: (slug: string) => void;
  setAdConsent: (consent: AdConsent) => void;
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
      currentGame: "opcg",
      cardView: "grid",
      dismissedBanner: false,
      adConsent: null,
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
      setCurrentGame: (currentGame) => set({ currentGame }),
      setAdConsent: (adConsent) => set({ adConsent }),
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
        currentGame: state.currentGame,
        cardView: state.cardView,
        dismissedBanner: state.dismissedBanner,
        adConsent: state.adConsent,
      }),
    }
  )
);
