import { z } from "zod";

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
    "portfolio_count",
    "checkin_streak",
    "first_sell",
    "first_review",
    "correct_predictions",
    "referral_count",
    "trades_count",
    "honey_lifetime",
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
  category: z.enum(["DAILY", "MONTHLY", "SPECIAL"]).default("DAILY"),
  trackType: z.enum(["AUTO_PATH", "MANUAL", "ACTION_COUNT"]).default("AUTO_PATH"),
  conditions: MissionConditionSchema,
  rewards: MissionRewardsSchema,
  target: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});
export type MissionTemplateInput = z.infer<typeof MissionTemplateInputSchema>;

export const MissionScheduleRuleInputSchema = z.object({
  templateId: z.number().int(),
  slotType: z.enum(["CORE", "DAY_OF_WEEK", "RANDOM_POOL", "FIXED_DATE", "SEQUENTIAL"]),
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
  category: z.enum(["DAILY", "MONTHLY", "SPECIAL"]),
  requirement: z.enum(["ALL_COMPLETE", "COUNT_COMPLETE", "STREAK_DAYS"]),
  requirementValue: z.number().int().min(1).default(1),
  rewards: MissionRewardsSchema,
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});
export type MissionBonusRuleInput = z.infer<typeof MissionBonusRuleInputSchema>;

/**
 * Safely parse a Prisma JSON field. Returns the parsed value or `fallback` on failure.
 * Logs a warning on parse failure so issues are visible without crashing.
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
