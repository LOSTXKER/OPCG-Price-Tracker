import { describe, expect, it } from "vitest";

import {
  effectiveTier,
  getLimits,
  resolveUpgradeTier,
  TIER_FEATURES,
} from "@/lib/billing";

describe("tier feature quota metadata", () => {
  it("maps quota-gated features to the shared plan limits", () => {
    expect(TIER_FEATURES.comparePlus.limitKey).toBe("compareCards");
    expect(TIER_FEATURES.portfolioCards.limitKey).toBe("portfolioCards");
    expect(TIER_FEATURES.priceAlerts.limitKey).toBe("priceAlerts");
    expect(TIER_FEATURES.honeyMultiplier.limitKey).toBe("honeyMultiplier");

    const limitKey = TIER_FEATURES.comparePlus.limitKey!;
    expect(getLimits("FREE")[limitKey]).toBe(2);
    expect(getLimits("PRO")[limitKey]).toBe(5);
    expect(getLimits("PRO_PLUS")[limitKey]).toBe(Infinity);
  });

  it("offers Pro to Free users and Pro+ when a paid quota is exhausted", () => {
    expect(resolveUpgradeTier("FREE", "PRO")).toBe("PRO");
    expect(resolveUpgradeTier("PRO", "PRO")).toBe("PRO_PLUS");
    expect(resolveUpgradeTier("LIFETIME_PRO", "PRO")).toBe("PRO");
    expect(resolveUpgradeTier("PRO", "PRO_PLUS")).toBe("PRO_PLUS");
  });

  it("removes expired paid entitlements but keeps lifetime access active", () => {
    expect(effectiveTier("PRO", new Date("2000-01-01"))).toBe("FREE");
    expect(effectiveTier("PRO", new Date("2999-01-01"))).toBe("PRO");
    expect(effectiveTier("LIFETIME_PRO", null)).toBe("LIFETIME_PRO");
    expect(getLimits(effectiveTier("PRO", new Date("2000-01-01"))).lineAlerts).toBe(
      false,
    );
  });
});
