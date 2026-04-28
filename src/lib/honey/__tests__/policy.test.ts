import { describe, it, expect, vi } from "vitest";
import type { HoneyActionType } from "@/generated/prisma/client";

// Stub the DB module so importing `index.ts` does not initialize a real
// connection pool. The constants we test are pure data and do not
// touch prisma at module load.
vi.mock("@/lib/db", () => ({
  prisma: {} as unknown,
}));

vi.mock("@/lib/env", () => ({
  serverEnv: () => ({ DATABASE_URL: "postgres://stub" }),
}));

const mod = await import("../index");
const { HONEY_REWARDS, DAILY_LIMITS, MULTIPLIER_POLICY, GLOBAL_CAP_TYPES, GLOBAL_DAILY_CAP } = mod;

describe("HONEY_REWARDS — v2 base amounts", () => {
  it("matches the rebalance plan §3.1 base amounts", () => {
    expect(HONEY_REWARDS.CHECKIN).toBe(5);
    expect(HONEY_REWARDS.MARKETPLACE_SELL).toBe(25);
    expect(HONEY_REWARDS.REVIEW).toBe(5);
    expect(HONEY_REWARDS.REFERRAL).toBe(150);
    expect(HONEY_REWARDS.REFERRAL_WELCOME).toBe(30);
    expect(HONEY_REWARDS.PRICE_PREDICTION).toBe(15);
    expect(HONEY_REWARDS.DECK_SHARE).toBe(20);
    expect(HONEY_REWARDS.COMMUNITY_PRICE).toBe(8);
    expect(HONEY_REWARDS.ONBOARDING).toBe(100);
    expect(HONEY_REWARDS.BUYER_PURCHASE).toBe(30);
    expect(HONEY_REWARDS.MILESTONE_STREAK_7).toBe(25);
    expect(HONEY_REWARDS.MILESTONE_STREAK_30).toBe(100);
  });

  it("does NOT define base rewards for derived/admin events", () => {
    expect(HONEY_REWARDS.ACHIEVEMENT).toBeUndefined();
    expect(HONEY_REWARDS.LEVEL_UP).toBeUndefined();
    expect(HONEY_REWARDS.LEADERBOARD_REWARD).toBeUndefined();
    expect(HONEY_REWARDS.RAFFLE_WIN).toBeUndefined();
    expect(HONEY_REWARDS.ADMIN_GRANT).toBeUndefined();
    expect(HONEY_REWARDS.WEEKLY_BONUS).toBeUndefined();
    expect(HONEY_REWARDS.MONTHLY_PERFECT_BONUS).toBeUndefined();
  });
});

describe("DAILY_LIMITS — per-action caps", () => {
  it("matches the rebalance plan §3.2 anti-spam caps", () => {
    expect(DAILY_LIMITS.REVIEW).toBe(3);
    expect(DAILY_LIMITS.COMMUNITY_PRICE).toBe(3);
    expect(DAILY_LIMITS.MARKETPLACE_SELL).toBe(5);
    expect(DAILY_LIMITS.DECK_SHARE).toBe(2);
  });

  it("leaves CHECKIN uncapped (one per day already enforced upstream)", () => {
    expect(DAILY_LIMITS.CHECKIN).toBeUndefined();
  });
});

describe("GLOBAL_DAILY_CAP — farmable ceiling", () => {
  it("is set to 200 honey/day", () => {
    expect(GLOBAL_DAILY_CAP).toBe(200);
  });

  it("includes the documented farmable sources", () => {
    const expected: HoneyActionType[] = [
      "CHECKIN",
      "MARKETPLACE_SELL",
      "REVIEW",
      "COMMUNITY_PRICE",
      "DECK_SHARE",
      "PRICE_PREDICTION",
      "BUYER_PURCHASE",
      "DAILY_MISSION",
      "WEEKLY_MISSION",
      "MONTHLY_MISSION",
    ];
    for (const t of expected) {
      expect(GLOBAL_CAP_TYPES.has(t)).toBe(true);
    }
  });

  it("excludes one-shots and ledger-admin events", () => {
    const excluded: HoneyActionType[] = [
      "REFERRAL",
      "REFERRAL_WELCOME",
      "ACHIEVEMENT",
      "LEVEL_UP",
      "LEADERBOARD_REWARD",
      "RAFFLE_TICKET",
      "RAFFLE_WIN",
      "MILESTONE_STREAK_7",
      "MILESTONE_STREAK_30",
      "WEEKLY_BONUS",
      "MONTHLY_PERFECT_BONUS",
      "ADMIN_GRANT",
    ];
    for (const t of excluded) {
      expect(GLOBAL_CAP_TYPES.has(t)).toBe(false);
    }
  });
});

describe("MULTIPLIER_POLICY — exhaustiveness & key actions", () => {
  it("classifies engagement actions as tier_and_seasonal", () => {
    const tierSeasonal: HoneyActionType[] = [
      "CHECKIN",
      "MARKETPLACE_SELL",
      "REVIEW",
      "COMMUNITY_PRICE",
      "DECK_SHARE",
      "ONBOARDING",
      "TRIAL_BONUS",
      "REFERRAL",
      "REFERRAL_WELCOME",
      "PRICE_PREDICTION",
      "BUYER_PURCHASE",
      "DAILY_MISSION",
      "WEEKLY_MISSION",
    ];
    for (const t of tierSeasonal) {
      expect(MULTIPLIER_POLICY[t]).toBe("tier_and_seasonal");
    }
  });

  it("classifies high-value rare events as tier_only", () => {
    expect(MULTIPLIER_POLICY.WEEKLY_BONUS).toBe("tier_only");
    expect(MULTIPLIER_POLICY.MONTHLY_MISSION).toBe("tier_only");
    expect(MULTIPLIER_POLICY.MONTHLY_PERFECT_BONUS).toBe("tier_only");
  });

  it("excludes ledger-admin and one-shot payouts from any multipliers", () => {
    const none: HoneyActionType[] = [
      "ACHIEVEMENT",
      "LEVEL_UP",
      "LEADERBOARD_REWARD",
      "RAFFLE_TICKET",
      "RAFFLE_WIN",
      "ADMIN_GRANT",
      "REDEEM",
      "EXPIRED",
      "MILESTONE_STREAK_7",
      "MILESTONE_STREAK_30",
    ];
    for (const t of none) {
      expect(MULTIPLIER_POLICY[t]).toBe("none");
    }
  });
});
