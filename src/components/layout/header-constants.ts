import {
  Crown,
  Sparkles,
  Star,
  User,
  Zap,
} from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";
import type { Language, Currency } from "@/stores/ui-store";

// Primary hubs (stable IA — mirrors the mobile bottom-nav). Marketplace is a
// flag-gated card inside Browse, not a top-level hub — see MARKETPLACE_LINK.
// `owns` = flat route prefixes with no nav item of their own; they keep this hub
// lit while the user is inside them (see isNavActive in @/lib/game/constants).
export const NAV_LINKS = [
  // IA-NAV-06: one destination name everywhere — these keys match the mobile
  // bottom-nav + command palette ("หน้าแรก"/"ชุดการ์ด") so a place reads the same
  // on every surface. (Route matching uses href + owns, not the label key.)
  { href: "/" as const, key: "home" as const, owns: [] as readonly string[] },
  { href: "/opcg/sets" as const, key: "sets" as const, owns: ["/cards", "/search", "/trending", "/market-overview"] as readonly string[] },
  { href: "/opcg/decks" as const, key: "decksAndTools" as const, owns: ["/compare", "/drop-calculator", "/deck-calculator"] as readonly string[] },
];

// Appended to the desktop nav only when marketplaceEnabled (never swaps a hub).
export const MARKETPLACE_LINK = { href: "/marketplace" as const, key: "marketplace" as const, owns: [] as readonly string[] };

export type AuthUser = {
  email?: string;
  user_metadata?: { avatar_url?: string; full_name?: string };
};

export type UserTierValue = "FREE" | "PRO" | "PRO_PLUS" | "LIFETIME_PRO" | "LIFETIME_PRO_PLUS";

export const TIER_DISPLAY: Record<UserTierValue, { label: string; color: string; icon: typeof Star }> = {
  FREE: { label: "Free", color: "bg-muted text-muted-foreground", icon: User },
  PRO: { label: "Pro", color: "bg-primary/15 text-primary", icon: Zap },
  PRO_PLUS: { label: "Pro+", color: "bg-primary/15 text-primary", icon: Crown },
  LIFETIME_PRO: { label: "Pro ∞", color: "bg-[#73533E]/15 text-[#73533E] dark:text-[#E0B865]", icon: Sparkles },
  LIFETIME_PRO_PLUS: { label: "Pro+ ∞", color: "bg-primary/15 text-primary", icon: Crown },
};

/** One card on the scrolling half of the header strip. */
export type MarketMover = {
  cardCode: string;
  nameJp: string | null;
  nameEn: string | null;
  nameTh: string | null;
  latestPriceJpy: number | null;
  latestPriceThb: number | null;
  priceChange24h: number | null;
};

export type MarketStats = {
  totalCards: number;
  totalValue: number;
  exchangeRate: number;
  /** "อัปเดตล่าสุด" per language, pre-formatted when the stats fetch lands —
   *  render only ever picks a string (no Date work during render). */
  updatedLabels: Record<Language, string> | null;
  /** Biggest 24h gainers and losers, interleaved by the API. */
  movers: MarketMover[];
};

export const LANG_OPTIONS: { value: Language; label: string }[] = [
  { value: "TH", label: "ไทย" },
  { value: "EN", label: "English" },
  { value: "JP", label: "日本語" },
];

export const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "THB", label: "฿ THB" },
  { value: "JPY", label: "¥ JPY" },
  { value: "USD", label: "$ USD" },
];

export const CURRENCY_SYMBOL: Record<Currency, string> = { THB: "฿", JPY: "¥", USD: "$" };

// Kept alongside the restored ticker: `/more` (mobile "ดูเพิ่มเติม") owns the
// phone-side theme picker and reads these options, so they are not part of the
// desktop chrome revert.
export type ThemeChoice = "system" | "light" | "dark";

export const THEME_OPTIONS: ReadonlyArray<{
  value: ThemeChoice;
  labelKey: TranslationKey;
}> = [
  { value: "system", labelKey: "themeSystem" },
  { value: "light", labelKey: "lightMode" },
  { value: "dark", labelKey: "darkMode" },
];

export const RANK_DISPLAY: Record<string, { color: string; bg: string; ring: string }> = {
  Newbie:  { color: "text-muted-foreground",                          bg: "bg-muted text-muted-foreground",                                  ring: "ring-border" },
  Bronze:  { color: "text-amber-700 dark:text-amber-500",             bg: "bg-amber-500/15 text-amber-700 dark:text-amber-400",              ring: "ring-amber-500/30" },
  Silver:  { color: "text-slate-500 dark:text-slate-300",             bg: "bg-slate-500/15 text-slate-600 dark:text-slate-300",              ring: "ring-slate-400/30" },
  Gold:    { color: "text-yellow-600 dark:text-yellow-400",           bg: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",           ring: "ring-yellow-500/30" },
  Diamond: { color: "text-cyan-500 dark:text-cyan-300",               bg: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-300",                ring: "ring-cyan-400/30" },
};
