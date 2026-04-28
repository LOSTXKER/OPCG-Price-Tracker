import { prisma } from "@/lib/db";
import type { Prisma, UserPrivacySettings } from "@/generated/prisma/client";

export const DEFAULT_PRIVACY_SETTINGS: Omit<UserPrivacySettings, "userId" | "updatedAt"> = {
  profileVisibility: "public",
  showCollection: true,
  showListings: true,
  showDecks: true,
  showStats: true,
  showWatchlist: true,
  hidePortfolioPrices: false,
  hidePortfolioQty: false,
  profileSummaryOnly: false,
};

export type PrivacySettingsUpdate = Partial<Omit<UserPrivacySettings, "userId" | "updatedAt">>;

export async function getPrivacySettings(userId: string): Promise<UserPrivacySettings> {
  const existing = await prisma.userPrivacySettings.findUnique({ where: { userId } });
  if (existing) return existing;
  return {
    userId,
    updatedAt: new Date(),
    ...DEFAULT_PRIVACY_SETTINGS,
  };
}

export async function upsertPrivacySettings(
  userId: string,
  partial: PrivacySettingsUpdate,
): Promise<UserPrivacySettings> {
  return prisma.userPrivacySettings.upsert({
    where: { userId },
    create: { userId, ...DEFAULT_PRIVACY_SETTINGS, ...partial },
    update: partial,
  });
}

export async function ensurePrivacySettings(userId: string): Promise<void> {
  await prisma.userPrivacySettings.upsert({
    where: { userId },
    create: { userId, ...DEFAULT_PRIVACY_SETTINGS },
    update: {},
  });
}

export const privacySettingsCreateInput: Prisma.UserPrivacySettingsCreateWithoutUserInput = {
  ...DEFAULT_PRIVACY_SETTINGS,
};
