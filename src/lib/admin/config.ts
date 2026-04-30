import "server-only";
import { prisma } from "@/lib/db";

/**
 * The full set of `SystemConfig` keys the admin UI knows about. Adding a key
 * here makes it editable in `/admin/config` (when paired with a field group)
 * and accessible via `getAdminConfig()` server-side.
 */
export const ADMIN_CONFIG_KEYS = [
  // Feature flags
  "marketplace_enabled",
  // Cron schedules
  "price_scraping_interval",
  "card_data_interval",
  "exchange_rate_interval",
  // Marketplace
  "marketplace_fee_free",
  "marketplace_fee_pro",
  "marketplace_fee_pro_plus",
  "primary_currency",
  // Notifications
  "notification_email_enabled",
  "notification_line_enabled",
  // Default page sizes (admin lists)
  "admin_default_page_size",
  "admin_transactions_page_size",
  "marketplace_default_page_size",
] as const;

export type AdminConfigKey = (typeof ADMIN_CONFIG_KEYS)[number];

export interface AdminConfig {
  // Feature flags
  marketplaceEnabled: boolean;
  // Cron
  priceScrapingInterval: string;
  cardDataInterval: string;
  exchangeRateInterval: string;
  // Marketplace
  marketplaceFeeFree: number;
  marketplaceFeePro: number;
  marketplaceFeeProPlus: number;
  primaryCurrency: string;
  // Notifications
  notificationEmailEnabled: boolean;
  notificationLineEnabled: boolean;
  // Page sizes
  adminDefaultPageSize: number;
  adminTransactionsPageSize: number;
  marketplaceDefaultPageSize: number;
}

const DEFAULTS: AdminConfig = {
  // Marketplace ships disabled until the storefront is ready; admins flip
  // this on from `/admin/config` once the feature is launched.
  marketplaceEnabled: false,
  priceScrapingInterval: "0 */6 * * *",
  cardDataInterval: "0 3 * * *",
  exchangeRateInterval: "0 */12 * * *",
  marketplaceFeeFree: 5,
  marketplaceFeePro: 4,
  marketplaceFeeProPlus: 3,
  primaryCurrency: "THB",
  notificationEmailEnabled: true,
  notificationLineEnabled: true,
  adminDefaultPageSize: 20,
  adminTransactionsPageSize: 30,
  marketplaceDefaultPageSize: 24,
};

function parseNumber(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw === "") return fallback;
  return raw === "true" || raw === "1";
}

interface CacheEntry {
  data: AdminConfig;
  expires: number;
}

const CACHE_TTL_MS = 60_000;
let cache: CacheEntry | null = null;

/**
 * Load the admin config map from `SystemConfig`, parsed into typed values
 * and cached in-process for 60 seconds. Use this in API routes and server
 * components instead of hard-coding constants such as `PAGE_SIZE = 30`.
 *
 * Cache is invalidated by `invalidateAdminConfigCache()` after a successful
 * config save (see `/api/admin/config` PUT).
 */
export async function getAdminConfig(): Promise<AdminConfig> {
  const now = Date.now();
  if (cache && cache.expires > now) return cache.data;

  let rows: { key: string; value: string }[] = [];
  try {
    rows = await prisma.systemConfig.findMany({
      where: { key: { in: [...ADMIN_CONFIG_KEYS] } },
      select: { key: true, value: true },
    });
  } catch {
    // DB hiccup → return defaults; don't cache failures.
    return { ...DEFAULTS };
  }

  const map = new Map(rows.map((r) => [r.key, r.value]));
  const data: AdminConfig = {
    marketplaceEnabled: parseBool(map.get("marketplace_enabled"), DEFAULTS.marketplaceEnabled),
    priceScrapingInterval: map.get("price_scraping_interval") || DEFAULTS.priceScrapingInterval,
    cardDataInterval: map.get("card_data_interval") || DEFAULTS.cardDataInterval,
    exchangeRateInterval: map.get("exchange_rate_interval") || DEFAULTS.exchangeRateInterval,
    marketplaceFeeFree: parseNumber(map.get("marketplace_fee_free"), DEFAULTS.marketplaceFeeFree),
    marketplaceFeePro: parseNumber(map.get("marketplace_fee_pro"), DEFAULTS.marketplaceFeePro),
    marketplaceFeeProPlus: parseNumber(
      map.get("marketplace_fee_pro_plus"),
      DEFAULTS.marketplaceFeeProPlus,
    ),
    primaryCurrency: map.get("primary_currency") || DEFAULTS.primaryCurrency,
    notificationEmailEnabled: parseBool(
      map.get("notification_email_enabled"),
      DEFAULTS.notificationEmailEnabled,
    ),
    notificationLineEnabled: parseBool(
      map.get("notification_line_enabled"),
      DEFAULTS.notificationLineEnabled,
    ),
    adminDefaultPageSize: parseNumber(
      map.get("admin_default_page_size"),
      DEFAULTS.adminDefaultPageSize,
    ),
    adminTransactionsPageSize: parseNumber(
      map.get("admin_transactions_page_size"),
      DEFAULTS.adminTransactionsPageSize,
    ),
    marketplaceDefaultPageSize: parseNumber(
      map.get("marketplace_default_page_size"),
      DEFAULTS.marketplaceDefaultPageSize,
    ),
  };

  cache = { data, expires: now + CACHE_TTL_MS };
  return data;
}

/** Drop the cached admin config so the next call re-reads from the DB. */
export function invalidateAdminConfigCache(): void {
  cache = null;
}

export const ADMIN_CONFIG_DEFAULTS: Readonly<AdminConfig> = DEFAULTS;
