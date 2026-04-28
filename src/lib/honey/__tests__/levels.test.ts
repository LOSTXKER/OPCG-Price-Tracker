import { describe, it, expect } from "vitest";
import {
  DEFAULT_RANK_TIERS,
  checkLevelUpFromTiers,
  getHoneyLevelFromTiers,
} from "../rank-tiers";

const LEVEL_THRESHOLD: Record<number, number> = Object.fromEntries(
  DEFAULT_RANK_TIERS.map((t) => [t.level, t.threshold]),
);
const LEVEL_UP_BONUS: Record<number, number> = Object.fromEntries(
  DEFAULT_RANK_TIERS.filter((t) => t.levelUpBonus > 0).map((t) => [
    t.level,
    t.levelUpBonus,
  ]),
);

const getLevel = (lifetime: number) =>
  getHoneyLevelFromTiers(lifetime, DEFAULT_RANK_TIERS);
const checkLevel = (oldLifetime: number, newLifetime: number) =>
  checkLevelUpFromTiers(oldLifetime, newLifetime, DEFAULT_RANK_TIERS);

describe("Honey levels — v2 ladder", () => {
  describe("getHoneyLevel", () => {
    it("starts at Newbie below 100 lifetime", () => {
      const lvl = getLevel(0);
      expect(lvl.level).toBe(0);
      expect(lvl.label).toBe("Newbie");
      expect(lvl.nextThreshold).toBe(100);
    });

    it("crosses into Bronze at 100", () => {
      const lvl = getLevel(100);
      expect(lvl.level).toBe(1);
      expect(lvl.label).toBe("Bronze");
      expect(lvl.nextThreshold).toBe(500);
    });

    it.each([
      [500, 2, "Silver", 2000],
      [2000, 3, "Gold", 5000],
      [5000, 4, "Diamond", 15000],
    ])("returns expected level at %i lifetime", (lifetime, expectedLevel, label, next) => {
      const lvl = getLevel(lifetime);
      expect(lvl.level).toBe(expectedLevel);
      expect(lvl.label).toBe(label);
      expect(lvl.nextThreshold).toBe(next);
    });

    it("caps at Master with no nextThreshold above 15,000 lifetime", () => {
      const lvl = getLevel(15000);
      expect(lvl.level).toBe(5);
      expect(lvl.label).toBe("Master");
      expect(lvl.nextThreshold).toBeNull();

      const huge = getLevel(99_999_999);
      expect(huge.level).toBe(5);
      expect(huge.nextThreshold).toBeNull();
    });
  });

  describe("checkLevelUp", () => {
    it("returns null when no level boundary was crossed", () => {
      expect(checkLevel(50, 80)).toBeNull();
      expect(checkLevel(110, 200)).toBeNull();
    });

    it("returns the bonus when crossing into Bronze (100)", () => {
      const r = checkLevel(99, 100);
      expect(r).not.toBeNull();
      expect(r!.level).toBe(1);
      expect(r!.bonus).toBe(LEVEL_UP_BONUS[1]);
    });

    it("returns the bonus when crossing into Master at 15,000", () => {
      const r = checkLevel(14_999, 15_000);
      expect(r).not.toBeNull();
      expect(r!.level).toBe(5);
      expect(r!.label).toBe("Master");
      expect(r!.bonus).toBe(2500);
    });

    it("recognizes a single grant that vaults across multiple levels", () => {
      const r = checkLevel(0, 15_000);
      expect(r).not.toBeNull();
      expect(r!.level).toBe(5);
      expect(r!.bonus).toBe(LEVEL_UP_BONUS[5]);
    });

    it("never down-levels", () => {
      expect(checkLevel(2_000, 1_000)).toBeNull();
      expect(checkLevel(2_000, 2_000)).toBeNull();
    });
  });

  describe("LEVEL_UP_BONUS / LEVEL_THRESHOLD consistency", () => {
    it("has matching keys for every level 1..5", () => {
      for (const level of [1, 2, 3, 4, 5]) {
        expect(LEVEL_UP_BONUS[level]).toBeGreaterThan(0);
        expect(LEVEL_THRESHOLD[level]).toBeGreaterThan(0);
      }
    });

    it("matches the v2 plan §3.3 bonus amounts", () => {
      expect(LEVEL_UP_BONUS[1]).toBe(50);
      expect(LEVEL_UP_BONUS[2]).toBe(150);
      expect(LEVEL_UP_BONUS[3]).toBe(400);
      expect(LEVEL_UP_BONUS[4]).toBe(1000);
      expect(LEVEL_UP_BONUS[5]).toBe(2500);
    });

    it("matches the v2 plan §3.3 lifetime thresholds", () => {
      expect(LEVEL_THRESHOLD[1]).toBe(100);
      expect(LEVEL_THRESHOLD[2]).toBe(500);
      expect(LEVEL_THRESHOLD[3]).toBe(2000);
      expect(LEVEL_THRESHOLD[4]).toBe(5000);
      expect(LEVEL_THRESHOLD[5]).toBe(15000);
    });
  });
});
