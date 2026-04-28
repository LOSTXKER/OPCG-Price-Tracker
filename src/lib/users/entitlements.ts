import { prisma } from "@/lib/db";
import type { Prisma, UserEntitlements } from "@/generated/prisma/client";

export const DEFAULT_ENTITLEMENTS: Omit<UserEntitlements, "userId" | "updatedAt"> = {
  extraPriceAlertSlots: 0,
  csvExportCredits: 0,
  extraWatchlistSlots: 0,
  bulkLookupCredits: 0,
  autoPricingUntil: null,
  lineAlertsUntil: null,
  weeklyListingBoostUntil: null,
  ticketBalance: 0,
};

export type EntitlementsUpdate = Partial<Omit<UserEntitlements, "userId" | "updatedAt">>;

export async function getEntitlements(userId: string): Promise<UserEntitlements> {
  const existing = await prisma.userEntitlements.findUnique({ where: { userId } });
  if (existing) return existing;
  return {
    userId,
    updatedAt: new Date(),
    ...DEFAULT_ENTITLEMENTS,
  };
}

export async function upsertEntitlements(
  userId: string,
  partial: EntitlementsUpdate,
): Promise<UserEntitlements> {
  return prisma.userEntitlements.upsert({
    where: { userId },
    create: { userId, ...DEFAULT_ENTITLEMENTS, ...partial },
    update: partial,
  });
}

export async function ensureEntitlements(userId: string): Promise<void> {
  await prisma.userEntitlements.upsert({
    where: { userId },
    create: { userId, ...DEFAULT_ENTITLEMENTS },
    update: {},
  });
}

/**
 * Atomic increment helpers — preferred over `upsert` when adjusting a
 * counter so concurrent grants/spends compose correctly. Increments use
 * the satellite's auto-create semantics: if the row does not exist yet
 * we seed it from defaults then apply the increment.
 */
export async function incrementEntitlement(
  userId: string,
  field: keyof Pick<
    UserEntitlements,
    "extraPriceAlertSlots" | "csvExportCredits" | "extraWatchlistSlots" | "bulkLookupCredits" | "ticketBalance"
  >,
  delta: number,
): Promise<UserEntitlements> {
  return prisma.userEntitlements.upsert({
    where: { userId },
    create: {
      userId,
      ...DEFAULT_ENTITLEMENTS,
      [field]: Math.max(0, delta),
    },
    update: {
      [field]: { increment: delta },
    },
  });
}

export const entitlementsCreateInput: Prisma.UserEntitlementsCreateWithoutUserInput = {
  ...DEFAULT_ENTITLEMENTS,
};
