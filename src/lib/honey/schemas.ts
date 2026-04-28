import { z } from "zod";
import {
  MissionCategory,
  MissionTrackType,
  MissionSlotType,
  MissionBonusRequirement,
} from "@/generated/prisma/client";

/**
 * Zod enums derived from Prisma — keeps admin form validation in sync
 * with the values the database actually accepts. If a future Prisma
 * migration adds a value, the Zod schema picks it up automatically
 * instead of silently rejecting valid rows.
 *
 * Note `as const` casts: Prisma exports enums as objects whose values
 * are literal strings; `Object.values(...) as readonly [...]` lets z.enum
 * accept them directly.
 */
const MissionCategoryEnum = z.enum(
  Object.values(MissionCategory) as [keyof typeof MissionCategory, ...Array<keyof typeof MissionCategory>],
);
const MissionTrackTypeEnum = z.enum(
  Object.values(MissionTrackType) as [keyof typeof MissionTrackType, ...Array<keyof typeof MissionTrackType>],
);
const MissionSlotTypeEnum = z.enum(
  Object.values(MissionSlotType) as [keyof typeof MissionSlotType, ...Array<keyof typeof MissionSlotType>],
);
const MissionBonusRequirementEnum = z.enum(
  Object.values(MissionBonusRequirement) as [
    keyof typeof MissionBonusRequirement,
    ...Array<keyof typeof MissionBonusRequirement>,
  ],
);

/** Schema for a single daily mission task stored in DailyMission.tasks JSON. */
export const MissionTaskSchema = z.object({
  id: z.string(),
  done: z.boolean(),
  reward: z.number(),
  claimed: z.boolean(),
});
export type MissionTaskParsed = z.infer<typeof MissionTaskSchema>;

export const MissionTasksSchema = z.array(MissionTaskSchema);

/** Schema for Achievement.criteria JSON. */
export const AchievementCriteriaSchema = z.object({
  type: z.enum([
    // Original 8 — keep first for back-compat with existing seeded rows.
    "portfolio_count",
    "checkin_streak",
    "first_sell",
    "first_review",
    "correct_predictions",
    "referral_count",
    "trades_count",
    "honey_lifetime",
    // Phase 2 expansions — see docs/honey-economy-rebalance.md.
    "watchlist_count",       // WatchlistItem rows for the user
    "deck_count",            // Deck rows owned
    "deck_share_count",      // Public-deck honey grants (DECK_SHARE tx)
    "community_price_count", // CommunityPrice submissions
    "prediction_count",      // PricePrediction rows (attempts, any outcome)
    "review_count",          // Review rows authored
    "order_buy_count",       // Order rows where user is buyer (completed)
    "perfect_day_count",     // DailyMission rows with perfectDay=true
    "raffle_win_count",      // RAFFLE_WIN honey grants
  ]),
  target: z.number(),
});
export type AchievementCriteriaParsed = z.infer<typeof AchievementCriteriaSchema>;

/** Schema for MonthlyRaffle.prizes JSON. */
export const RafflePrizeSchema = z.object({
  rank: z.number(),
  name: z.string(),
  imageUrl: z.string().optional(),
  honeyBonus: z.number().optional(),
});
export const RafflePrizesSchema = z.array(RafflePrizeSchema);
export type RafflePrizeParsed = z.infer<typeof RafflePrizeSchema>;

/** Schema for HoneyShopItem.value JSON (varies by type). */
export const ShopItemValueSchema = z
  .object({
    days: z.number().optional(),
    badge: z.string().optional(),
    badgeTh: z.string().optional(),
    imageUrl: z.string().nullable().optional(),
    frameId: z.string().optional(),
    freeRaffleTickets: z.number().optional(),
    reward: z.string().optional(),
    hours: z.number().optional(),
    quantity: z.number().optional(),
  })
  .passthrough();
export type ShopItemValueParsed = z.infer<typeof ShopItemValueSchema>;

/* ── Mission Template condition & reward schemas ── */

export const MissionConditionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("visit_path"),
    paths: z.array(z.string()),
  }),
  z.object({
    type: z.literal("action_count"),
    action: z.enum(["share", "list_item", "add_portfolio", "review", "predict", "checkin", "trade"]),
  }),
  z.object({
    type: z.literal("visit_unique"),
    pathPattern: z.string(),
  }),
  z.object({
    type: z.literal("manual_confirm"),
  }),
]);
export type MissionConditionParsed = z.infer<typeof MissionConditionSchema>;

export const MissionRewardsSchema = z.object({
  honey: z.number().default(0),
  tickets: z.number().default(0),
  badgeCode: z.string().nullable().optional(),
  shopItemCode: z.string().nullable().optional(),
  multiplierBoost: z
    .object({ value: z.number(), hours: z.number() })
    .nullable()
    .optional(),
});
export type MissionRewardsParsed = z.infer<typeof MissionRewardsSchema>;

export const MissionTemplateInputSchema = z.object({
  code: z.string().min(1).max(100),
  name: z.string().min(1),
  nameEn: z.string().nullable().optional(),
  nameTh: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  descriptionEn: z.string().nullable().optional(),
  descriptionTh: z.string().nullable().optional(),
  icon: z.string().default("Circle"),
  category: MissionCategoryEnum.default("DAILY"),
  trackType: MissionTrackTypeEnum.default("AUTO_PATH"),
  conditions: MissionConditionSchema,
  rewards: MissionRewardsSchema,
  target: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});
export type MissionTemplateInput = z.infer<typeof MissionTemplateInputSchema>;

export const MissionScheduleRuleInputSchema = z.object({
  templateId: z.number().int(),
  slotType: MissionSlotTypeEnum,
  dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
  specificDates: z.array(z.string()).nullable().optional(),
  poolGroup: z.string().nullable().optional(),
  poolPickCount: z.number().int().min(1).nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export type MissionScheduleRuleInput = z.infer<typeof MissionScheduleRuleInputSchema>;

export const MissionBonusRuleInputSchema = z.object({
  name: z.string().min(1),
  nameEn: z.string().nullable().optional(),
  nameTh: z.string().nullable().optional(),
  category: MissionCategoryEnum,
  requirement: MissionBonusRequirementEnum,
  requirementValue: z.number().int().min(1).default(1),
  rewards: MissionRewardsSchema,
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});
export type MissionBonusRuleInput = z.infer<typeof MissionBonusRuleInputSchema>;

/**
 * Schema for `HoneyTransaction.metadata` JSON column.
 *
 * The column is permissive freeform JSON in the database, but in practice
 * we attach a small set of contextual keys depending on the action type.
 * Listing the known keys here keeps write-sites typed (and lets the
 * compiler catch typos in metadata payloads) while `passthrough` keeps
 * the column forward-compatible.
 *
 *   - `weekStart` / `monthKey` / `month` / `monthStr` — period anchors
 *     used by weekly/monthly bonus payouts (also recorded as
 *     `idempotencyKey` on the row itself).
 *   - `referredUserId` — for REFERRAL grants.
 *   - `missionId` / `taskId` — for DAILY_MISSION / WEEKLY_MISSION /
 *     MONTHLY_MISSION grants.
 *   - `itemId` / `itemType` — for shop REDEEM rows.
 *   - `achievementCode` — for ACHIEVEMENT grants.
 *   - `raffleId` — for RAFFLE_WIN payouts.
 *   - `baseHoney` / `tierMult` / `seasonalMult` / `streakMult` — the
 *     unrounded inputs used to compute the final amount; useful when
 *     auditing why a particular grant was X honey.
 *   - `streak` / `rank` — context for milestone / leaderboard rewards.
 *   - `cap` — flag set when the grant was clipped by the global daily cap.
 */
export const HoneyTransactionMetadataSchema = z
  .object({
    /* period anchors used by weekly/monthly idempotent payouts */
    weekStart: z.string().optional(),
    weekEnd: z.string().optional(),
    monthKey: z.string().optional(),
    month: z.string().optional(),
    monthStr: z.string().optional(),
    windowStart: z.string().optional(),
    windowEnd: z.string().optional(),

    /* referral grants */
    referredUserId: z.string().optional(),
    referrerId: z.string().optional(),

    /* mission grants */
    missionId: z.string().optional(),
    taskId: z.string().optional(),
    perfectDay: z.boolean().optional(),
    baseReward: z.number().optional(),

    /* shop redeem rows */
    itemId: z.union([z.number().int(), z.string()]).optional(),
    itemType: z.string().optional(),

    /* achievement / level-up / leaderboard / raffle */
    achievementCode: z.string().optional(),
    level: z.number().int().optional(),
    label: z.string().optional(),
    raffleId: z.number().int().optional(),

    /* deck-share grant */
    deckId: z.number().int().optional(),

    /* multiplier provenance */
    baseHoney: z.number().optional(),
    tierMult: z.number().optional(),
    tierMultiplier: z.number().optional(),
    seasonalMult: z.number().optional(),
    streakMult: z.number().optional(),

    /* misc context */
    streak: z.number().int().optional(),
    rank: z.number().int().optional(),
    cap: z.boolean().optional(),
  })
  .passthrough();

export type HoneyTransactionMetadata = z.infer<typeof HoneyTransactionMetadataSchema>;

/**
 * Safely parse a Prisma JSON field. Returns the parsed value or `fallback` on failure.
 * Logs a warning on parse failure so issues are visible without crashing.
 *
 * @deprecated Prefer `parseJsonField` from `@/lib/utils/json-field`. This
 * re-export is kept so existing call sites in the honey domain don't
 * need to change as part of phase 3.4.
 */
export function parseJsonField<T>(
  schema: z.ZodType<T>,
  data: unknown,
  label: string,
  fallback: T,
): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  console.warn(`[honey] Invalid JSON in ${label}:`, result.error.format());
  return fallback;
}
