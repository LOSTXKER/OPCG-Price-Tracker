import {
  Award,
  Calendar,
  ClipboardList,
  History,
  Link2,
  Medal,
  ShoppingBag,
  Sparkles,
  Ticket,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { t, type TranslationKey, type Language } from "@/lib/i18n";

/* ── Tab config (shared between real + mock UI) ── */

export type TabKey = "missions" | "activity" | "achievements" | "shop" | "raffle" | "rankings" | "referral";

export type HoneyTabDef = { key: TabKey; icon: typeof Trophy; labelKey: TranslationKey };

export const HONEY_TABS: HoneyTabDef[] = [
  { key: "missions", icon: ClipboardList, labelKey: "dailyMissions" },
  { key: "activity", icon: History, labelKey: "activity" },
  { key: "achievements", icon: Medal, labelKey: "achievements" },
  { key: "shop", icon: ShoppingBag, labelKey: "honeyShop" },
  { key: "raffle", icon: Ticket, labelKey: "monthlyRaffle" },
  { key: "rankings", icon: Trophy, labelKey: "honeyLeaderboard" },
  { key: "referral", icon: Link2, labelKey: "referralLink" },
];

/* ── Shared helpers ── */

export function localizedName(
  item: { name: string; nameEn?: string | null; nameTh?: string | null },
  lang: Language,
): string {
  let raw: string;
  if (lang === "EN") raw = item.nameEn ?? item.name;
  else if (lang === "TH") raw = item.nameTh ?? item.name;
  else raw = item.name;

  return raw
    .replace(/Honey Pro\+\s*Pass/gi, "Pro+")
    .replace(/Honey Pass\+?/gi, "Pro")
    .replace(/Pro\+?\s*(?:ทดลอง|Trial|体験)\s*/gi, (m) => m.includes("+") ? "Pro+ " : "Pro ");
}

/**
 * Pick the best localized display name for a mission task.
 * Order of preference: nameTh/nameEn (per language) → labelKey i18n → labelKey raw.
 * Returns null if no useful name is available so callers can fall back to t(labelKey).
 */
export function localizedMissionName(
  task: {
    name?: string | null;
    nameEn?: string | null;
    nameTh?: string | null;
  },
  lang: Language,
): string | null {
  if (lang === "EN") return task.nameEn ?? task.name ?? null;
  if (lang === "TH") return task.nameTh ?? task.name ?? null;
  return task.name ?? null;
}

export function localizedMissionDescription(
  task: {
    description?: string | null;
    descriptionEn?: string | null;
    descriptionTh?: string | null;
  },
  lang: Language,
): string | null {
  if (lang === "EN") return task.descriptionEn ?? task.description ?? null;
  if (lang === "TH") return task.descriptionTh ?? task.description ?? null;
  return task.description ?? null;
}

export function localizedTitle(
  item: { title: string; titleEn?: string | null; titleTh?: string | null },
  lang: Language,
): string {
  if (lang === "EN") return item.titleEn ?? item.title;
  if (lang === "TH") return item.titleTh ?? item.title;
  return item.title;
}

/* ── Transaction display helpers ── */

const MISSION_ID_TO_LABEL: Record<string, TranslationKey> = {
  check_price: "missionCheckPrice",
  browse_trending: "missionBrowseTrending",
  visit_marketplace: "missionVisitMarketplace",
  explore_set: "missionExploreSet",
  share_card: "missionShareCard",
  share_site: "missionShareSite",
  check_watchlist: "missionCheckWatchlist",
  check_portfolio: "missionCheckPortfolio",
  visit_overview: "missionVisitOverview",
  read_blog: "missionReadBlog",
  check_collection: "missionCheckPortfolio",
};

const TYPE_REASON_MAP: Record<string, TranslationKey> = {
  CHECKIN: "dailyCheckin",
  ONBOARDING: "honeyOnboardingComplete",
};

export function formatTxReason(tx: { type: string; reason: string }, lang: Language): string {
  const mapped = TYPE_REASON_MAP[tx.type];
  if (mapped) return t(lang, mapped);

  if (tx.type === "DAILY_MISSION") {
    const missionId = tx.reason.replace("Mission: ", "").replace("Perfect day bonus", "");
    if (tx.reason.includes("Perfect day")) return t(lang, "missionPerfectDay");
    const labelKey = MISSION_ID_TO_LABEL[missionId];
    if (labelKey) return t(lang, labelKey);
  }

  if (tx.type === "ACHIEVEMENT") return t(lang, "achievements");
  if (tx.type === "REFERRAL") return t(lang, "referralLink");
  if (tx.type === "RAFFLE_TICKET") return t(lang, "monthlyRaffle");

  return tx.reason;
}

export const TX_TYPE_STYLE: Record<string, { icon: typeof Zap; bg: string; fg: string }> = {
  CHECKIN:          { icon: Calendar, bg: "bg-emerald-500/10", fg: "text-emerald-500" },
  DAILY_MISSION:    { icon: Sparkles, bg: "bg-amber-500/10",   fg: "text-amber-500" },
  ONBOARDING:       { icon: Award,    bg: "bg-purple-500/10",  fg: "text-purple-500" },
  ACHIEVEMENT:      { icon: Trophy,   bg: "bg-amber-500/10",   fg: "text-amber-500" },
  REFERRAL:         { icon: Users,    bg: "bg-cyan-500/10",    fg: "text-cyan-500" },
  MARKETPLACE_SELL: { icon: ShoppingBag, bg: "bg-emerald-500/10", fg: "text-emerald-500" },
  RAFFLE_TICKET:    { icon: Ticket,   bg: "bg-pink-500/10",    fg: "text-pink-500" },
  REDEEM:           { icon: ShoppingBag, bg: "bg-destructive/10", fg: "text-destructive" },
};

const TX_DEFAULT_POSITIVE = { icon: Zap, bg: "bg-price-up/10", fg: "text-price-up" };
const TX_DEFAULT_NEGATIVE = { icon: ShoppingBag, bg: "bg-destructive/10", fg: "text-destructive" };

export function getTxStyle(tx: { type: string; amount: number }) {
  return TX_TYPE_STYLE[tx.type] ?? (tx.amount > 0 ? TX_DEFAULT_POSITIVE : TX_DEFAULT_NEGATIVE);
}

/* ── Data types ── */

export type HoneyTx = {
  id: number;
  amount: number;
  type: string;
  reason: string;
  createdAt: string;
};

export type ShopItem = {
  id: number;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  description: string | null;
  cost: number;
  type: string;
  isActive: boolean;
  stock: number | null;
  // Item illustration. Stored under `HoneyShopItem.value.imageUrl` server-side
  // and surfaced on the shop card; falls back to a category icon when null.
  value?: { imageUrl?: string | null } & Record<string, unknown> | null;
  // Honey rebalance v2
  requiredLevel?: number;
  originalCost?: number | null;
  featuredUntil?: string | null;
  availableUntil?: string | null;
};

export type LeaderboardUser = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  honeyPoints: number;
  checkinStreak: number;
};

export type MissionTaskItem = {
  id: string;
  done: boolean;
  reward: number;
  claimed: boolean;
  labelKey: string;
  hintKey: string;
  icon: string;
  trackType: "auto-path" | "manual";
  name: string | null;
  nameEn: string | null;
  nameTh: string | null;
  description: string | null;
  descriptionEn: string | null;
  descriptionTh: string | null;
  ctaPath: string | null;
};

export type MissionData = {
  tasks: MissionTaskItem[];
  progress: number;
  completed: boolean;
  perfectDay: boolean;
  bonusClaimed: boolean;
  perfectDayBonus: number;
};

export type HoneyLevel = {
  level: number;
  label: string;
  nextThreshold: number | null;
  currentMin: number;
};

export type ActiveEvent = {
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  honeyMultiplier: number;
  endDate: string;
};

export type RaffleData = {
  id: number;
  month: string;
  slug: string;
  title: string;
  titleEn: string | null;
  titleTh: string | null;
  description: string | null;
  imageUrl: string | null;
  color: string | null;
  prizes: { rank: number; name: string; imageUrl?: string; honeyBonus?: number }[];
  ticketCost: number;
  maxTickets: number;
  freeThreshold: number;
  totalTickets: number;
  totalParticipants: number;
};

export type RaffleWinner = {
  displayName: string | null;
  month: string;
  prizeName: string;
  machineTitle: string;
  machineSlug: string;
};

export type RaffleMissionTask = {
  id: string;
  done: boolean;
  claimed: boolean;
  progress: number;
  target: number;
  labelKey: string;
  hintKey: string;
  icon: string;
  trackType: "auto-path" | "manual";
  reward: { honey: number; ticket: number };
  name?: string | null;
  nameEn?: string | null;
  nameTh?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionTh?: string | null;
  ctaPath?: string | null;
};

export type RaffleMissionBonus = {
  done: boolean;
  claimed: boolean;
  progress: number;
  target: number;
  reward: { honey: number; ticket: number };
};

export type RaffleMissionsData = {
  month: string;
  completedCount: number;
  totalCount: number;
  tasks: RaffleMissionTask[];
  bonus: RaffleMissionBonus;
};

export type AchievementItem = {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  description: string | null;
  honeyReward: number;
  badgeImageUrl: string | null;
  earned: boolean;
  earnedAt: string | null;
  progress: number;
  target: number;
  criteriaType: string | null;
};
