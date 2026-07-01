import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LANG_COOKIE, type Language, type Currency } from "@/lib/i18n";

export type { Language, Currency };
type CardView = "grid" | "list";

/**
 * Mirror the language preference into a cookie so SERVER components can resolve
 * it per request (getServerLanguage). Kept in sync on every change + on
 * rehydrate so the server and client never disagree on language.
 */
function writeLangCookie(lang: Language) {
  if (typeof document === "undefined") return;
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
}
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
  /** Dismiss-once hint clarifying that the header game pill navigates the
   *  catalog and the in-page chips filter MINE lists (shown on MINE routes). */
  dismissedSwitcherHint: boolean;
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
  dismissSwitcherHint: () => void;
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
      dismissedSwitcherHint: false,
      setLanguage: (language) => {
        writeLangCookie(language);
        set({ language });
      },
      cycleLanguage: () =>
        set((state) => {
          const next = LANGUAGE_CYCLE[(LANGUAGE_CYCLE.indexOf(state.language) + 1) % LANGUAGE_CYCLE.length]!;
          writeLangCookie(next);
          return { language: next };
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
      dismissSwitcherHint: () => set({ dismissedSwitcherHint: true }),
    }),
    {
      name: "kuma-ui-preferences",
      // Static/ISR pages prerender with the default state (TH/THB). Auto-rehydrating
      // synchronously would make the first client render use the persisted prefs and
      // mismatch that HTML (hydration error for anyone who switched language/currency).
      // Instead we skip auto-hydration and rehydrate once after mount via <StoreHydrator/>,
      // so the first paint matches the server and prefs swap in cleanly afterwards.
      skipHydration: true,
      partialize: (state) => ({
        language: state.language,
        currency: state.currency,
        currentGame: state.currentGame,
        cardView: state.cardView,
        dismissedBanner: state.dismissedBanner,
        adConsent: state.adConsent,
        dismissedSwitcherHint: state.dismissedSwitcherHint,
      }),
      // Backfill the lang cookie for users whose preference predates it, so
      // server components match the client on the first load after this ships.
      onRehydrateStorage: () => (state) => {
        if (state) writeLangCookie(state.language);
      },
    }
  )
);
