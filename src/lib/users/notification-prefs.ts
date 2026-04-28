import { prisma } from "@/lib/db";
import type { Prisma, UserNotificationPrefs } from "@/generated/prisma/client";

/**
 * The default row used when a user has no UserNotificationPrefs satellite
 * yet. Backfill ran in migration 20260502, so this should only be hit by
 * brand-new users between the upsert and the post-signup hooks. Mirror
 * the column defaults defined in `prisma/schema.prisma`.
 */
export const DEFAULT_NOTIFICATION_PREFS: Omit<UserNotificationPrefs, "userId" | "updatedAt"> = {
  emailAlerts: true,
  lineAlerts: false,
  weeklyDigest: true,
  notifyPriceEmail: true,
  notifyPriceWeb: true,
  notifyPriceLine: false,
  notifyMarketEmail: true,
  notifyMarketWeb: true,
  notifyMarketLine: false,
  notifyHoneyEmail: true,
  notifyHoneyWeb: true,
  notifyHoneyLine: false,
  notifyDigestEmail: true,
  notifyDigestWeb: true,
  notifyDigestLine: false,
};

export type NotificationPrefsUpdate = Partial<Omit<UserNotificationPrefs, "userId" | "updatedAt">>;

/**
 * Read the full notification preferences row for a user, materialising
 * defaults if the satellite hasn't been created yet. Use this from the
 * notification dispatcher and digest cron — anywhere that needs every
 * channel toggle in one shot.
 */
export async function getNotificationPrefs(userId: string): Promise<UserNotificationPrefs> {
  const existing = await prisma.userNotificationPrefs.findUnique({ where: { userId } });
  if (existing) return existing;
  return {
    userId,
    updatedAt: new Date(),
    ...DEFAULT_NOTIFICATION_PREFS,
  };
}

/**
 * Upsert a partial set of notification preferences. Callers should use
 * this rather than `prisma.userNotificationPrefs.update` so that the
 * satellite row is auto-created on first write.
 */
export async function upsertNotificationPrefs(
  userId: string,
  partial: NotificationPrefsUpdate,
): Promise<UserNotificationPrefs> {
  return prisma.userNotificationPrefs.upsert({
    where: { userId },
    create: { userId, ...DEFAULT_NOTIFICATION_PREFS, ...partial },
    update: partial,
  });
}

/**
 * Convenience: ensure a satellite row exists for `userId`. Idempotent.
 * Safe to call from the auth sync path so all downstream reads resolve
 * to a real row instead of the in-memory default.
 */
export async function ensureNotificationPrefs(userId: string): Promise<void> {
  await prisma.userNotificationPrefs.upsert({
    where: { userId },
    create: { userId, ...DEFAULT_NOTIFICATION_PREFS },
    update: {},
  });
}

/**
 * Helper for transactional callers (e.g. a signup flow that creates the
 * User + satellites in one $transaction). The same shape Prisma's
 * generated client expects in `data.notificationPrefs.create`.
 */
export const notificationPrefsCreateInput: Prisma.UserNotificationPrefsCreateWithoutUserInput = {
  ...DEFAULT_NOTIFICATION_PREFS,
};
