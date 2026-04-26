import { prisma } from "@/lib/db";
import type { MissionTemplate, MissionScheduleRule } from "@/generated/prisma/client";
import { todayStr } from "./utils";
import {
  MissionConditionSchema,
  MissionRewardsSchema,
  parseJsonField,
  type MissionConditionParsed,
  type MissionRewardsParsed,
} from "./schemas";

export type ResolvedMission = {
  templateId: number;
  code: string;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  description: string | null;
  descriptionEn: string | null;
  descriptionTh: string | null;
  icon: string;
  trackType: string;
  conditions: MissionConditionParsed;
  rewards: MissionRewardsParsed;
  target: number;
  sortOrder: number;
};

type RuleWithTemplate = MissionScheduleRule & { template: MissionTemplate };

/**
 * Deterministic seeded PRNG (mulberry32).
 * Same seed always produces the same sequence.
 */
function seededRandom(seed: number) {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return hash >>> 0;
}

function daysSinceEpoch(dateStr: string): number {
  const ms = new Date(dateStr).getTime();
  return Math.floor(ms / 86400000);
}

function toResolvedMission(t: MissionTemplate, sortOverride?: number): ResolvedMission {
  return {
    templateId: t.id,
    code: t.code,
    name: t.name,
    nameEn: t.nameEn,
    nameTh: t.nameTh,
    description: t.description,
    descriptionEn: t.descriptionEn,
    descriptionTh: t.descriptionTh,
    icon: t.icon,
    trackType: t.trackType,
    conditions: parseJsonField(MissionConditionSchema, t.conditions, `MissionTemplate(${t.code}).conditions`, { type: "manual_confirm" as const }),
    rewards: parseJsonField(MissionRewardsSchema, t.rewards, `MissionTemplate(${t.code}).rewards`, { honey: 0, tickets: 0 }),
    target: t.target,
    sortOrder: sortOverride ?? t.sortOrder,
  };
}

/**
 * Fetch all active schedule rules with their templates, filtered to a valid date range.
 */
async function fetchActiveRules(date: Date): Promise<RuleWithTemplate[]> {
  return prisma.missionScheduleRule.findMany({
    where: {
      isActive: true,
      template: { isActive: true, category: "DAILY" },
      OR: [
        { startDate: null, endDate: null },
        { startDate: { lte: date }, endDate: null },
        { startDate: null, endDate: { gte: date } },
        { startDate: { lte: date }, endDate: { gte: date } },
      ],
    },
    include: { template: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
}

/**
 * Resolve which daily missions should appear for a given date.
 * Uses schedule rules to determine CORE, DAY_OF_WEEK, FIXED_DATE,
 * SEQUENTIAL, and RANDOM_POOL missions.
 */
export async function resolveDailyMissions(dateStr?: string): Promise<ResolvedMission[]> {
  const date = dateStr ? new Date(dateStr) : new Date();
  const dateKey = dateStr ?? todayStr();
  const dow = date.getDay();

  const rules = await fetchActiveRules(date);
  if (rules.length === 0) return [];

  const seen = new Set<number>();
  const result: ResolvedMission[] = [];

  function addTemplate(t: MissionTemplate, sort?: number) {
    if (seen.has(t.id)) return;
    seen.add(t.id);
    result.push(toResolvedMission(t, sort));
  }

  // CORE: always included
  for (const r of rules) {
    if (r.slotType === "CORE") addTemplate(r.template, r.sortOrder);
  }

  // DAY_OF_WEEK: match today's day
  for (const r of rules) {
    if (r.slotType === "DAY_OF_WEEK" && r.dayOfWeek === dow) {
      addTemplate(r.template, r.sortOrder);
    }
  }

  // FIXED_DATE: match exact date
  for (const r of rules) {
    if (r.slotType === "FIXED_DATE" && r.specificDates) {
      const dates = r.specificDates as string[];
      if (dates.includes(dateKey)) {
        addTemplate(r.template, r.sortOrder);
      }
    }
  }

  // SEQUENTIAL: cycle through based on day count
  const sequentialRules = rules.filter((r) => r.slotType === "SEQUENTIAL");
  if (sequentialRules.length > 0) {
    const groups = new Map<string, RuleWithTemplate[]>();
    for (const r of sequentialRules) {
      const key = r.poolGroup ?? "__default";
      const group = groups.get(key) ?? [];
      group.push(r);
      groups.set(key, group);
    }
    const days = daysSinceEpoch(dateKey);
    for (const [, group] of groups) {
      const idx = days % group.length;
      addTemplate(group[idx].template, group[idx].sortOrder);
    }
  }

  // RANDOM_POOL: seeded random pick per group
  const randomRules = rules.filter((r) => r.slotType === "RANDOM_POOL");
  if (randomRules.length > 0) {
    const groups = new Map<string, RuleWithTemplate[]>();
    for (const r of randomRules) {
      const key = r.poolGroup ?? "__default";
      const group = groups.get(key) ?? [];
      group.push(r);
      groups.set(key, group);
    }

    for (const [groupName, group] of groups) {
      const pickCount = group[0].poolPickCount ?? 1;
      const seed = hashString(dateKey + groupName);
      const rng = seededRandom(seed);

      const available = group.filter((r) => !seen.has(r.template.id));
      const count = Math.min(pickCount, available.length);

      // Fisher-Yates partial shuffle
      for (let i = 0; i < count; i++) {
        const j = i + Math.floor(rng() * (available.length - i));
        [available[i], available[j]] = [available[j], available[i]];
        addTemplate(available[i].template, available[i].sortOrder);
      }
    }
  }

  result.sort((a, b) => a.sortOrder - b.sortOrder);
  return result;
}

/**
 * Resolve active bonus rules for a given category.
 */
export async function getActiveBonusRules(category: "DAILY" | "MONTHLY" | "SPECIAL" = "DAILY") {
  return prisma.missionBonusRule.findMany({
    where: { isActive: true, category },
    orderBy: [{ sortOrder: "asc" }],
  });
}

/**
 * Match a URL path against a condition's path patterns.
 * Patterns support trailing wildcards: "/cards/*" matches "/cards/123".
 */
export function matchConditionPath(pathname: string, conditions: MissionConditionParsed): boolean {
  if (conditions.type !== "visit_path") return false;
  for (const pattern of conditions.paths) {
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -2);
      if (pathname === prefix || pathname.startsWith(prefix + "/")) return true;
    } else {
      if (pathname === pattern || pathname.startsWith(pattern + "/")) return true;
    }
  }
  return false;
}
