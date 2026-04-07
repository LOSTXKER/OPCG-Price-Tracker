import { prisma } from "@/lib/db";
import type { HoneyShopItem } from "@/generated/prisma/client";
import { ShopItemValueSchema, parseJsonField, type ShopItemValueParsed } from "./schemas";

async function fulfillBundleExtras(userId: string, val: ShopItemValueParsed) {
  if (val.badge) {
    await prisma.userBadge.create({
      data: {
        userId,
        name: val.badge,
        nameEn: val.badge,
        nameTh: val.badgeTh ?? val.badge,
      },
    });
  }

  const tickets = val.freeRaffleTickets ?? 0;
  if (tickets > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { ticketBalance: { increment: tickets } },
    });
  }
}

export async function fulfillRedemption(userId: string, item: HoneyShopItem) {
  const val = parseJsonField(ShopItemValueSchema, item.value, `HoneyShopItem(${item.id}).value`, {});

  switch (item.type) {
    case "TRIAL_PRO": {
      const days = val.days ?? 30;
      const expiresAt = new Date(Date.now() + Number(days) * 86_400_000);
      await prisma.user.update({
        where: { id: userId },
        data: { tier: "PRO", tierExpiresAt: expiresAt },
      });
      await fulfillBundleExtras(userId, val);
      break;
    }
    case "TRIAL_PRO_PLUS": {
      const days = val.days ?? 30;
      const expiresAt = new Date(Date.now() + Number(days) * 86_400_000);
      await prisma.user.update({
        where: { id: userId },
        data: { tier: "PRO_PLUS", tierExpiresAt: expiresAt },
      });
      await fulfillBundleExtras(userId, val);
      break;
    }
    case "BADGE": {
      await prisma.userBadge.create({
        data: {
          userId,
          name: item.name,
          nameEn: item.nameEn,
          nameTh: item.nameTh,
          imageUrl: val.imageUrl ?? null,
        },
      });
      break;
    }
    case "PROFILE_FRAME": {
      const frameId = val.frameId ?? item.name;
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
    case "RAFFLE_TICKET": {
      const qty = val.quantity ?? 1;
      await prisma.user.update({
        where: { id: userId },
        data: { ticketBalance: { increment: qty } },
      });
      break;
    }
    case "CUSTOM": {
      if (!item.value) break;

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
