import { prisma } from "@/lib/db";
import type { HoneyShopItem } from "@/generated/prisma/client";
import { ShopItemValueSchema, parseJsonField, type ShopItemValueParsed } from "./schemas";
import {
  DEFAULT_ENTITLEMENTS,
  incrementEntitlement,
  upsertEntitlements,
} from "@/lib/users/entitlements";

const ONE_DAY_MS = 86_400_000;

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
    await incrementEntitlement(userId, "ticketBalance", tickets);
  }

  // Mega Pass also bundles a profile-frame cosmetic.
  if (val.frameId) {
    await prisma.user.update({
      where: { id: userId },
      data: { profileFrame: val.frameId },
    });
  }
}

/**
 * Extends a "until" timestamp by `days`, stacking on top of any existing
 * unexpired window (so two consecutive 7-day passes give 14 days, not 7).
 */
function extendWindow(current: Date | null, days: number): Date {
  const baseline = current && current.getTime() > Date.now() ? current.getTime() : Date.now();
  return new Date(baseline + days * ONE_DAY_MS);
}

export async function fulfillRedemption(userId: string, item: HoneyShopItem) {
  const val = parseJsonField(ShopItemValueSchema, item.value, `HoneyShopItem(${item.id}).value`, {});

  switch (item.type) {
    case "TRIAL_PRO": {
      const days = val.days ?? 30;
      const expiresAt = new Date(Date.now() + Number(days) * ONE_DAY_MS);
      await prisma.user.update({
        where: { id: userId },
        data: { tier: "PRO", tierExpiresAt: expiresAt },
      });
      await fulfillBundleExtras(userId, val);
      break;
    }
    case "TRIAL_PRO_PLUS": {
      const days = val.days ?? 30;
      const expiresAt = new Date(Date.now() + Number(days) * ONE_DAY_MS);
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
      await incrementEntitlement(userId, "extraPriceAlertSlots", 1);
      break;
    }
    case "CSV_EXPORT_PASS": {
      await incrementEntitlement(userId, "csvExportCredits", 1);
      break;
    }
    case "RAFFLE_TICKET": {
      const qty = val.quantity ?? 1;
      await incrementEntitlement(userId, "ticketBalance", qty);
      break;
    }
    case "CUSTOM": {
      if (!item.value) break;
      await fulfillCustomReward(userId, val);
      break;
    }
  }
}

/**
 * Custom shop rewards (Tier-S/M utility items) keyed by `value.reward`.
 * Each branch is documented inline so the matching client/feature code can
 * stay in sync.
 */
async function fulfillCustomReward(userId: string, val: ShopItemValueParsed) {
  const reward = val.reward;
  switch (reward) {
    // Tier-S — boost most recent active listing for `hours` (default 24).
    case "listing_boost": {
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
      break;
    }

    // Tier-M — sets a window flag; the marketplace listing render and the
    // boosted-search ranker both check `weeklyListingBoostUntil` to apply
    // boost styling/ordering during the window.
    case "listing_boost_weekly": {
      const days = Number(val.days ?? 7);
      const ent = await prisma.userEntitlements.findUnique({
        where: { userId },
        select: { weeklyListingBoostUntil: true },
      });
      const newUntil = extendWindow(ent?.weeklyListingBoostUntil ?? null, days);
      await upsertEntitlements(userId, { weeklyListingBoostUntil: newUntil });
      // Also apply an immediate boost on the user's active listings so the
      // effect is visible on the marketplace right away.
      await prisma.listing.updateMany({
        where: { userId, status: "ACTIVE" },
        data: { isBoosted: true, boostedUntil: newUntil },
      });
      break;
    }

    // Tier-M — auto-pricing pass; feature gates check `autoPricingUntil`.
    case "auto_pricing_pass": {
      const days = Number(val.days ?? 7);
      const ent = await prisma.userEntitlements.findUnique({
        where: { userId },
        select: { autoPricingUntil: true },
      });
      await upsertEntitlements(userId, {
        autoPricingUntil: extendWindow(ent?.autoPricingUntil ?? null, days),
      });
      break;
    }

    // Tier-M — LINE alerts pass; alert dispatcher checks `lineAlertsUntil`
    // and treats it as having opted into LINE delivery for the window.
    case "line_alerts_pass": {
      const days = Number(val.days ?? 7);
      const ent = await prisma.userEntitlements.findUnique({
        where: { userId },
        select: { lineAlertsUntil: true },
      });
      await upsertEntitlements(userId, {
        lineAlertsUntil: extendWindow(ent?.lineAlertsUntil ?? null, days),
      });
      break;
    }

    // Tier-S — adds `quantity` watchlist slots permanently.
    case "watchlist_slots": {
      const qty = Math.max(1, Math.floor(Number(val.quantity ?? 5)));
      await incrementEntitlement(userId, "extraWatchlistSlots", qty);
      break;
    }

    // Tier-M — adds `quantity` bulk price-lookup credits.
    case "bulk_lookup_credit": {
      const qty = Math.max(1, Math.floor(Number(val.quantity ?? 50)));
      await incrementEntitlement(userId, "bulkLookupCredits", qty);
      break;
    }
  }
}

// Re-export defaults so admin UI / tests can render zero-state placeholders
// without going through Prisma.
export const FULFILLMENT_DEFAULT_ENTITLEMENTS = DEFAULT_ENTITLEMENTS;
