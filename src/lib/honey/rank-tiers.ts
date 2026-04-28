/**
 * Honey rank tiers — shared, client-safe definitions.
 *
 * Admin can override the default ladder via /admin/honey/ranks; that
 * editor writes the tiers as JSON into `SystemConfig`. The DB-backed
 * loader / saver lives in `./rank-tiers-server.ts`. Anything in this
 * file must stay free of Prisma/server-only imports so client UI can
 * import the schemas, types, defaults, and pure helpers freely.
 */

import { z } from "zod";
import {
  Award,
  Crown,
  Flame,
  Gem,
  Heart,
  Medal,
  Shield,
  Sparkles,
  Star,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { Language } from "@/lib/i18n";

/* ── Icons ───────────────────────────────────────────────────────── */

export const RANK_ICON_NAMES = [
  "Shield",
  "Star",
  "Crown",
  "Trophy",
  "Award",
  "Medal",
  "Gem",
  "Sparkles",
  "Zap",
  "Heart",
  "Flame",
] as const;
export type RankIconName = (typeof RANK_ICON_NAMES)[number];

export const RANK_ICON_COMPONENTS: Record<RankIconName, LucideIcon> = {
  Shield,
  Star,
  Crown,
  Trophy,
  Award,
  Medal,
  Gem,
  Sparkles,
  Zap,
  Heart,
  Flame,
};

export function getRankIcon(name: string | null | undefined): LucideIcon {
  if (name && (RANK_ICON_NAMES as readonly string[]).includes(name)) {
    return RANK_ICON_COMPONENTS[name as RankIconName];
  }
  return Shield;
}

/* ── Schemas ─────────────────────────────────────────────────────── */

const RankTierLabelsSchema = z.object({
  TH: z.string().min(1, "ต้องมีชื่อภาษาไทย"),
  EN: z.string().min(1, "EN name required"),
  JP: z.string().min(1, "日本語名は必須です"),
});

export const RankTierSchema = z.object({
  level: z.number().int().min(0).max(99),
  threshold: z.number().int().min(0),
  levelUpBonus: z.number().int().min(0).default(0),
  iconName: z.enum(RANK_ICON_NAMES).default("Shield"),
  imageUrl: z.string().url().nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "ต้องเป็น hex color เช่น #b45309")
    .nullable()
    .optional(),
  labels: RankTierLabelsSchema,
});
export type RankTier = z.infer<typeof RankTierSchema>;

/**
 * Validates the full tier ladder:
 * - at least one tier
 * - levels are unique
 * - tiers are ordered by ascending threshold once sorted by level
 * - the lowest level (sorted by threshold) starts at 0
 */
export const RankTiersSchema = z
  .array(RankTierSchema)
  .min(1, "ต้องมีอย่างน้อย 1 ระดับ")
  .superRefine((tiers, ctx) => {
    const byLevel = [...tiers].sort((a, b) => a.level - b.level);
    const seenLevels = new Set<number>();
    for (let i = 0; i < byLevel.length; i++) {
      const tier = byLevel[i];
      const idx = tiers.indexOf(tier);
      if (seenLevels.has(tier.level)) {
        ctx.addIssue({
          code: "custom",
          message: `Level ${tier.level} ซ้ำกัน`,
          path: [idx, "level"],
        });
      }
      seenLevels.add(tier.level);
      if (i === 0 && tier.threshold !== 0) {
        ctx.addIssue({
          code: "custom",
          message: "ระดับแรกต้องเริ่มที่ 0 pt",
          path: [idx, "threshold"],
        });
      }
      if (i > 0 && tier.threshold <= byLevel[i - 1].threshold) {
        ctx.addIssue({
          code: "custom",
          message: `ต้องมากกว่าระดับก่อนหน้า (${byLevel[i - 1].threshold} pt)`,
          path: [idx, "threshold"],
        });
      }
    }
  });

/* ── Defaults ────────────────────────────────────────────────────── */

/**
 * Honey rebalance v2 default ladder. Mirrors the historical hard-coded
 * values in `levels.ts` so a fresh deployment behaves identically until
 * admin overrides via /admin/honey/ranks.
 */
export const DEFAULT_RANK_TIERS: RankTier[] = [
  {
    level: 0,
    threshold: 0,
    levelUpBonus: 0,
    iconName: "Shield",
    color: null,
    imageUrl: null,
    labels: { TH: "มือใหม่", EN: "Newbie", JP: "ニュービー" },
  },
  {
    level: 1,
    threshold: 100,
    levelUpBonus: 50,
    iconName: "Shield",
    color: "#b45309",
    imageUrl: null,
    labels: { TH: "บรอนซ์", EN: "Bronze", JP: "ブロンズ" },
  },
  {
    level: 2,
    threshold: 500,
    levelUpBonus: 150,
    iconName: "Star",
    color: "#64748b",
    imageUrl: null,
    labels: { TH: "ซิลเวอร์", EN: "Silver", JP: "シルバー" },
  },
  {
    level: 3,
    threshold: 2000,
    levelUpBonus: 400,
    iconName: "Crown",
    color: "#ca8a04",
    imageUrl: null,
    labels: { TH: "โกลด์", EN: "Gold", JP: "ゴールド" },
  },
  {
    level: 4,
    threshold: 5000,
    levelUpBonus: 1000,
    iconName: "Trophy",
    color: "#06b6d4",
    imageUrl: null,
    labels: { TH: "ไดมอนด์", EN: "Diamond", JP: "ダイヤモンド" },
  },
  {
    level: 5,
    threshold: 15000,
    levelUpBonus: 2500,
    iconName: "Award",
    color: "#a855f7",
    imageUrl: null,
    labels: { TH: "มาสเตอร์", EN: "Master", JP: "マスター" },
  },
];

/* ── Pure helpers ────────────────────────────────────────────────── */

export type HoneyLevel = {
  level: number;
  label: string;
  nextThreshold: number | null;
  currentMin: number;
};

/**
 * Given a lifetime-earned amount and a sorted-or-unsorted tier list,
 * return the user's current HoneyLevel snapshot. Pure / sync — works
 * on both server and client. The returned `label` is always the EN
 * label so back-end-only consumers (notifications, ledger reasons)
 * stay consistent regardless of viewer language.
 */
export function getHoneyLevelFromTiers(
  lifetimeEarned: number,
  tiers: RankTier[],
): HoneyLevel {
  const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold);
  for (let i = sorted.length - 1; i >= 0; i--) {
    const tier = sorted[i];
    if (lifetimeEarned >= tier.threshold) {
      const next = sorted[i + 1] ?? null;
      return {
        level: tier.level,
        label: tier.labels.EN,
        nextThreshold: next?.threshold ?? null,
        currentMin: tier.threshold,
      };
    }
  }
  const first = sorted[0];
  return {
    level: first.level,
    label: first.labels.EN,
    nextThreshold: sorted[1]?.threshold ?? null,
    currentMin: first.threshold,
  };
}

/**
 * If `newLifetime` crossed into a strictly higher tier, returns the
 * level-up payout (sourced from that tier's `levelUpBonus`). Returns
 * null when no boundary was crossed or the destination tier has no
 * bonus configured.
 */
export function checkLevelUpFromTiers(
  oldLifetime: number,
  newLifetime: number,
  tiers: RankTier[],
): { level: number; label: string; bonus: number } | null {
  const oldLevel = getHoneyLevelFromTiers(oldLifetime, tiers);
  const newLevel = getHoneyLevelFromTiers(newLifetime, tiers);
  if (newLevel.level <= oldLevel.level) return null;
  const tier = tiers.find((t) => t.level === newLevel.level);
  const bonus = tier?.levelUpBonus ?? 0;
  if (bonus <= 0) return null;
  return { level: newLevel.level, label: newLevel.label, bonus };
}

/** Pick the localized name for a tier (falls back to EN). */
export function getTierLabel(tier: RankTier, lang: Language): string {
  return tier.labels[lang] ?? tier.labels.EN;
}

/** Find a tier by level; returns the lowest tier as a safe fallback. */
export function findTierByLevel(tiers: RankTier[], level: number): RankTier {
  return (
    tiers.find((t) => t.level === level) ??
    [...tiers].sort((a, b) => a.threshold - b.threshold)[0]
  );
}
