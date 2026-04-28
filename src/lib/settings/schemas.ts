import { z } from "zod";

const NOTIFY_KEYS = [
  "emailAlerts",
  "lineAlerts",
  "weeklyDigest",
  "notifyPriceEmail",
  "notifyPriceWeb",
  "notifyPriceLine",
  "notifyMarketEmail",
  "notifyMarketWeb",
  "notifyMarketLine",
  "notifyHoneyEmail",
  "notifyHoneyWeb",
  "notifyHoneyLine",
  "notifyDigestEmail",
  "notifyDigestWeb",
  "notifyDigestLine",
] as const;

const notifyShape = Object.fromEntries(
  NOTIFY_KEYS.map((key) => [key, z.boolean().optional()]),
) as { [K in (typeof NOTIFY_KEYS)[number]]: z.ZodOptional<z.ZodBoolean> };

export const UpdateSettingsSchema = z
  .object({
    ...notifyShape,
    displayName: z.string().trim().min(1).max(120).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No valid fields",
  });

export const NOTIFY_PREF_KEYS = NOTIFY_KEYS;

export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;
