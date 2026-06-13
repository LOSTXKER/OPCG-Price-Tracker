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

/* ── Honey Shop localization helpers ──
 * Shared between the user-facing shop tab (`/honey`) and the admin shop
 * manager (`/admin/honey/shop`) so both render the same translated labels and
 * descriptions. The pattern-matched description map exists because the DB
 * `HoneyShopItem.description` column is single-language (English seed copy);
 * see `scripts/seed-honey-shop.ts`.
 */

export const SHOP_TYPE_LABELS: Record<string, Record<Language, string>> = {
  TRIAL_PRO:        { TH: "แพ็กเกจ",             EN: "Package",       JP: "パッケージ" },
  TRIAL_PRO_PLUS:   { TH: "แพ็กเกจ",             EN: "Package",       JP: "パッケージ" },
  PROFILE_FRAME:    { TH: "กรอบโปรไฟล์",         EN: "Frames",        JP: "フレーム" },
  BADGE:            { TH: "แบดจ์",               EN: "Badges",        JP: "バッジ" },
  PRICE_ALERT_SLOT: { TH: "ช่องแจ้งเตือนราคา",   EN: "Alert Slot",    JP: "アラート枠" },
  CSV_EXPORT_PASS:  { TH: "สิทธิ์ส่งออก CSV",    EN: "CSV Export",    JP: "CSVエクスポート" },
  RAFFLE_TICKET:    { TH: "ตั๋วลุ้นรางวัล",      EN: "Raffle Ticket", JP: "抽選チケット" },
  CUSTOM:           { TH: "กำหนดเอง",            EN: "Other",         JP: "その他" },
};

export function localizedShopType(type: string, lang: Language): string {
  const entry = SHOP_TYPE_LABELS[type];
  if (!entry) return type;
  return entry[lang] ?? entry.EN;
}

const SHOP_DESC_I18N: { match: string; TH: string; EN?: string; JP: string }[] = [
  { match: "entry-level bronze frame",  TH: "กรอบโปรไฟล์ทองแดงสำหรับผู้เริ่มต้น",                JP: "プロフィール用のブロンズフレーム（入門）" },
  { match: "shiny gold frame",          TH: "กรอบโปรไฟล์สีทองสุดพิเศษ",                          JP: "プロフィール用のゴールドフレーム" },
  { match: "diamond frame",             TH: "กรอบโปรไฟล์เพชรสุดพรีเมียม",                        JP: "プロフィール用のダイヤモンドフレーム" },
  { match: "fiery frame",               TH: "กรอบโปรไฟล์ลายไฟสุดเท่",                            JP: "プロフィール用の炎フレーム" },
  { match: "Boost your latest active",  TH: "ดันประกาศที่ใช้งานอยู่ล่าสุดขึ้นด้านบน 24 ชั่วโมง",   JP: "最新の出品を24時間トップに表示" },
  { match: "Boost your listing",        TH: "ดันรายการขายของคุณขึ้นด้านบน 24 ชั่วโมง",            JP: "出品を24時間トップに表示" },
  { match: "active listings stay boosted", TH: "ประกาศที่ใช้งานอยู่ทั้งหมดถูกดันต่อเนื่อง 7 วัน",  JP: "全アクティブ出品を7日間ブースト" },
  { match: "auto-pricing for all",      TH: "ปลดล็อกตั้งราคาอัตโนมัติให้ทุกประกาศเป็นเวลา 7 วัน",   JP: "全出品の自動価格を7日間解放" },
  { match: "alerts on LINE",            TH: "รับการแจ้งเตือนราคา + ตลาด ผ่าน LINE เป็นเวลา 7 วัน",  JP: "LINEで価格・市場通知を7日間受信" },
  { match: "bulk price-lookup credits", TH: "เพิ่มเครดิตค้นหาราคาแบบกลุ่ม 50 ครั้ง (ใช้ครั้งเดียว)",  JP: "一括価格検索クレジットを50追加（単発）" },
  { match: "Mini Kuma pet skin",        TH: "สกินเพ็ต Mini Kuma สำหรับโปรไฟล์",                    JP: "プロフィール用のミニクマペットスキン" },
  { match: "extra price alert",         TH: "เพิ่มช่องแจ้งเตือนราคาถาวร +1 ช่อง",                JP: "価格アラート枠を1つ追加（永久）" },
  { match: "extra watchlist slots",     TH: "เพิ่มช่องวอชลิสต์ถาวร +5 ช่อง",                      JP: "ウォッチリスト枠を5つ追加（永久）" },
  { match: "Kuma badge",                TH: "แบดจ์ Kuma สุดพิเศษบนโปรไฟล์ของคุณ",                JP: "プロフィールにKumaバッジを表示" },
  { match: "Export your portfolio",     TH: "ส่งออกพอร์ตโฟลิโอเป็นไฟล์ CSV 1 ครั้ง",            JP: "ポートフォリオをCSVで1回エクスポート" },
  { match: "Use tickets to enter",      TH: "ใช้ตั๋วเข้าร่วมลุ้นรางวัลประจำเดือน",                JP: "チケットで月間抽選に参加" },
  { match: "Buy 3 tickets",             TH: "ซื้อ 3 ใบในราคาประหยัด",                              JP: "3枚をお得に購入" },
  { match: "Best value! 5",             TH: "คุ้มที่สุด! แพ็ค 5 ใบ",                               JP: "最もお得！5枚パック" },
  { match: "Pro features for 7 days",   TH: "ใช้งานฟีเจอร์ Pro ได้ 7 วัน + แบดจ์พิเศษ",          JP: "Pro機能を7日間利用 + 限定バッジ" },
  { match: "Pro features for 30 days",  TH: "ใช้งานฟีเจอร์ Pro ได้ 30 วัน + แบดจ์ Honey Elite + ตั๋วชิงรางวัลฟรี 1 ใบ", JP: "Pro機能を30日間利用 + Honey Eliteバッジ + 抽選チケット1枚" },
  { match: "Pro features for 90 days",  TH: "ใช้งานฟีเจอร์ Pro ได้ 90 วัน + แบดจ์ Mega + ตั๋วชิงรางวัล 3 ใบ + กรอบไฟ", JP: "Pro機能を90日間利用 + Megaバッジ + 抽選チケット3枚 + 炎フレーム" },
  { match: "Pro+ features for 30 days", TH: "ใช้งานฟีเจอร์ Pro+ ได้ 30 วัน + แบดจ์พิเศษ + ตั๋วชิงรางวัลฟรี 2 ใบ", JP: "Pro+機能を30日間利用 + 限定バッジ + 抽選チケット2枚" },
];

export function localizedShopDesc(desc: string | null, lang: Language): string {
  if (!desc) return "";
  if (lang === "EN") return desc.replace(/Honey Pass/gi, "Honey");
  const entry = SHOP_DESC_I18N.find((d) => desc.toLowerCase().includes(d.match.toLowerCase()));
  if (!entry) return desc.replace(/Honey Pass/gi, "Honey");
  return lang === "JP" ? entry.JP : entry.TH;
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
  drawnAt: string | null;
  winner: { id: string; displayName: string | null; avatarUrl: string | null } | null;
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
