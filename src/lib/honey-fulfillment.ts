import { prisma } from "@/lib/db";
import type { HoneyShopItem } from "@/generated/prisma/client";

export async function fulfillRedemption(userId: string, item: HoneyShopItem) {
  switch (item.type) {
    case "TRIAL_PRO": {
      const days = (item.value as Record<string, unknown>)?.days ?? 30;
      const expiresAt = new Date(Date.now() + Number(days) * 86_400_000);
      await prisma.user.update({
        where: { id: userId },
        data: { tier: "PRO", tierExpiresAt: expiresAt },
      });
      break;
    }
    case "TRIAL_PRO_PLUS": {
      const days = (item.value as Record<string, unknown>)?.days ?? 30;
      const expiresAt = new Date(Date.now() + Number(days) * 86_400_000);
      await prisma.user.update({
        where: { id: userId },
        data: { tier: "PRO_PLUS", tierExpiresAt: expiresAt },
      });
      break;
    }
    case "BADGE": {
      await prisma.userBadge.create({
        data: {
          userId,
          name: item.name,
          nameEn: item.nameEn,
          nameTh: item.nameTh,
          imageUrl: (item.value as Record<string, unknown>)?.imageUrl as string | null ?? null,
        },
      });
      break;
    }
    case "PROFILE_FRAME": {
      const frameId = (item.value as Record<string, unknown>)?.frameId as string ?? item.name;
      await prisma.user.update({
        where: { id: userId },
        data: { profileFrame: frameId },
      });
      break;
    }
    case "PRICE_ALERT_SLOT": {
      await prisma.user.update({
        where: { id: userId },
        data: { extraPriceAlertSlots: { increment: 1 } },
      });
      break;
    }
    case "CSV_EXPORT_PASS": {
      await prisma.user.update({
        where: { id: userId },
        data: { csvExportCredits: { increment: 1 } },
      });
      break;
    }
    case "CUSTOM": {
      const val = item.value as Record<string, unknown> | null;
      if (!val) break;

      if (val.reward === "listing_boost") {
        const hours = Number(val.hours ?? 24);
        const latestListing = await prisma.listing.findFirst({
          where: { userId, status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
        });
        if (latestListing) {
          await prisma.listing.update({
            where: { id: latestListing.id },
            data: {
              isBoosted: true,
              boostedUntil: new Date(Date.now() + hours * 3_600_000),
            },
          });
        }
      }
      break;
    }
  }
}
