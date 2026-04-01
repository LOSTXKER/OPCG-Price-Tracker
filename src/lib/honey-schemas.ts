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
  })
  .passthrough();
export type ShopItemValueParsed = z.infer<typeof ShopItemValueSchema>;

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
