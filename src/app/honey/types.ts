import {
  History,
  Link2,
  Medal,
  ShoppingBag,
  Ticket,
  Trophy,
} from "lucide-react";
import type { TranslationKey, Language } from "@/lib/i18n";

/* ── Tab config (shared between real + mock UI) ── */

export type TabKey = "activity" | "achievements" | "shop" | "raffle" | "rankings" | "referral";

export const HONEY_TABS: { key: TabKey; icon: typeof Trophy; labelKey: TranslationKey }[] = [
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
  if (lang === "EN") return item.nameEn ?? item.name;
  if (lang === "TH") return item.nameTh ?? item.name;
  return item.name;
}

export function localizedTitle(
  item: { title: string; titleEn?: string | null; titleTh?: string | null },
  lang: Language,
): string {
  if (lang === "EN") return item.titleEn ?? item.title;
  if (lang === "TH") return item.titleTh ?? item.title;
  return item.title;
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
};

export type MissionData = {
  tasks: MissionTaskItem[];
  progress: number;
  completed: boolean;
  perfectDay: boolean;
  bonusClaimed: boolean;
  perfectDayBonus: number;
};

export type Prediction = {
  id: number;
  direction: string;
  priceAtPrediction: number;
  resolved: boolean;
  correct: boolean | null;
  weekStart: string;
  card: {
    id: number;
    cardCode: string;
    nameJp: string;
    nameEn: string | null;
    imageUrl: string | null;
    latestPriceJpy: number | null;
  };
};

export type HoneyLevel = {
  level: number;
  label: string;
  nextThreshold: number | null;
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
  title: string;
  titleEn: string | null;
  titleTh: string | null;
  description: string | null;
  prizes: { rank: number; name: string; honeyBonus?: number }[];
  ticketCost: number;
  maxTickets: number;
  freeThreshold: number;
  totalTickets: number;
  totalParticipants: number;
  lastWinner?: { displayName: string | null; month: string; prizeName: string } | null;
};

export type AchievementItem = {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  description: string | null;
  honeyReward: number;
  earned: boolean;
  earnedAt: string | null;
};
