import { prisma } from "@/lib/db";
import { earnHoneyDirect, getHoneyMultiplier } from ".";
import { todayStr } from "./utils";
import {
  MissionTasksSchema,
  MissionRewardsSchema,
  type MissionTaskParsed,
  type MissionRewardsParsed,
  parseJsonField,
} from "./schemas";
import {
  resolveDailyMissions,
  matchConditionPath,
  getActiveBonusRules,
  type ResolvedMission,
} from "./mission-resolver";

/* ── Types ── */

export type TrackType = "auto-path" | "manual";

export type MissionDef = {
  id: string;
  labelKey: string;
  hintKey: string;
  icon: string;
  reward: number;
  paths: (string | RegExp)[];
  trackType: TrackType;
};

export type MissionTask = MissionTaskParsed;

export function parseTasks(raw: unknown): MissionTask[] {
  return parseJsonField(MissionTasksSchema, raw, "DailyMission.tasks", []);
}

/* ── Hardcoded fallback definitions (used when no DB templates exist) ── */

const FALLBACK_CORE_MISSIONS: MissionDef[] = [
  {
    id: "check_price",
    labelKey: "missionCheckPrice",
    hintKey: "missionCheckPriceHint",
    icon: "Search",
    reward: 10,
    paths: [/^\/cards\/[^/]+/],
    trackType: "auto-path",
  },
  {
    id: "browse_trending",
    labelKey: "missionBrowseTrending",
    hintKey: "missionBrowseTrendingHint",
    icon: "TrendingUp",
    reward: 10,
    paths: ["/trending"],
    trackType: "auto-path",
  },
  {
    id: "visit_marketplace",
    labelKey: "missionVisitMarketplace",
    hintKey: "missionVisitMarketplaceHint",
    icon: "ShoppingBag",
    reward: 10,
    paths: ["/marketplace"],
    trackType: "auto-path",
  },
];

const FALLBACK_ROTATING_MISSIONS: Record<number, MissionDef> = {
  0: { id: "check_portfolio", labelKey: "missionCheckPortfolio", hintKey: "missionCheckPortfolioHint", icon: "Wallet", reward: 10, paths: ["/portfolio"], trackType: "auto-path" },
  1: { id: "explore_set", labelKey: "missionExploreSet", hintKey: "missionExploreSetHint", icon: "Layers", reward: 10, paths: [/^\/sets\/[^/]+/], trackType: "auto-path" },
  2: { id: "share_card", labelKey: "missionShareCard", hintKey: "missionShareCardHint", icon: "Share2", reward: 10, paths: [], trackType: "manual" },
  3: { id: "visit_overview", labelKey: "missionVisitOverview", hintKey: "missionVisitOverviewHint", icon: "BarChart3", reward: 10, paths: ["/market-overview"], trackType: "auto-path" },
  4: { id: "read_blog", labelKey: "missionReadBlog", hintKey: "missionReadBlogHint", icon: "BookOpen", reward: 10, paths: ["/blog"], trackType: "auto-path" },
  5: { id: "share_site", labelKey: "missionShareSite", hintKey: "missionShareSiteHint", icon: "Share2", reward: 10, paths: [], trackType: "manual" },
  6: { id: "check_watchlist", labelKey: "missionCheckWatchlist", hintKey: "missionCheckWatchlistHint", icon: "Eye", reward: 10, paths: ["/watchlist"], trackType: "auto-path" },
};

const FALLBACK_PERFECT_DAY_BONUS = 20;

/* ── In-memory cache for resolved templates ── */

let _templateCache: { key: string; missions: ResolvedMission[] } | null = null;

async function getResolvedMissions(dateStr?: string): Promise<ResolvedMission[]> {
  const key = dateStr ?? todayStr();
  if (_templateCache && _templateCache.key === key) return _templateCache.missions;
  const missions = await resolveDailyMissions(key);
  _templateCache = { key, missions };
  return missions;
}

function trackTypeFromDb(t: string): TrackType {
  if (t === "MANUAL") return "manual";
  return "auto-path";
}

/* ── Fallback logic ── */

function dayOfWeek(): number {
  return new Date().getDay();
}

function getFallbackDefs(): MissionDef[] {
  const bonus = FALLBACK_ROTATING_MISSIONS[dayOfWeek()];
  return [...FALLBACK_CORE_MISSIONS, bonus];
}

/* ── Public API ── */

/**
 * Get today's daily mission definitions.
 * Tries DB-driven templates first, falls back to hardcoded if no templates configured.
 */
export async function getDailyMissionDefs(): Promise<MissionDef[]> {
  const resolved = await getResolvedMissions();
  if (resolved.length > 0) {
    return resolved.map((r) => {
      const rewards = r.rewards;
      const cond = r.conditions;
      const paths: (string | RegExp)[] = [];
      if (cond.type === "visit_path") {
        for (const p of cond.paths) {
          if (p.endsWith("/*")) {
            const prefix = p.slice(0, -2);
            paths.push(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\/[^/]+`));
          } else {
            paths.push(p);
          }
        }
      }
      return {
        id: r.code,
        labelKey: r.code,
        hintKey: r.description ?? "",
        icon: r.icon,
        reward: rewards.honey,
        paths,
        trackType: trackTypeFromDb(r.trackType),
      };
    });
  }
  return getFallbackDefs();
}

function buildTasksFromDefs(defs: MissionDef[]): MissionTask[] {
  return defs.map((m) => ({
    id: m.id,
    done: false,
    reward: m.reward,
    claimed: false,
  }));
}

async function buildTasks(): Promise<MissionTask[]> {
  const defs = await getDailyMissionDefs();
  return buildTasksFromDefs(defs);
}

function matchPath(pathname: string, patterns: (string | RegExp)[]): boolean {
  for (const p of patterns) {
    if (typeof p === "string") {
      if (pathname === p || pathname.startsWith(p + "/")) return true;
    } else if (p.test(pathname)) {
      return true;
    }
  }
  return false;
}

export async function pathToMissionIds(pathname: string): Promise<string[]> {
  const resolved = await getResolvedMissions();

  if (resolved.length > 0) {
    const ids: string[] = [];
    for (const r of resolved) {
      if (r.trackType === "MANUAL" || r.trackType === "ACTION_COUNT") continue;
      if (matchConditionPath(pathname, r.conditions)) {
        ids.push(r.code);
      }
    }
    return ids;
  }

  const defs = getFallbackDefs();
  const ids: string[] = [];
  for (const def of defs) {
    if (def.trackType === "auto-path" && matchPath(pathname, def.paths)) {
      ids.push(def.id);
    }
  }
  return ids;
}

/* ── DB operations ── */

export async function getOrCreateMission(userId: string) {
  const date = todayStr();
  const existing = await prisma.dailyMission.findUnique({
    where: { userId_date: { userId, date } },
  });

  if (existing) {
    const existingTasks = parseTasks(existing.tasks);
    if (!existingTasks || existingTasks.length === 0) {
      return prisma.dailyMission.update({
        where: { id: existing.id },
        data: { tasks: await buildTasks() },
      });
    }
    const needsMigration = existingTasks.some((t) => t.reward == null);
    if (needsMigration) {
      const defs = await getDailyMissionDefs();
      const migrated = existingTasks.map((t) => {
        const def = defs.find((d) => d.id === t.id);
        return {
          id: t.id,
          done: t.done,
          reward: t.reward ?? def?.reward ?? 5,
          claimed: t.claimed ?? false,
        };
      });
      return prisma.dailyMission.update({
        where: { id: existing.id },
        data: { tasks: migrated },
      });
    }
    return existing;
  }

  return prisma.dailyMission.create({
    data: { userId, date, tasks: await buildTasks() },
  });
}

/**
 * Mark a single manual task as done. Rejects auto-path tasks.
 */
export async function trackMission(userId: string, missionId: string, opts?: { shareCompleted?: boolean }) {
  const defs = await getDailyMissionDefs();
  const def = defs.find((d) => d.id === missionId);
  if (!def || def.trackType !== "manual") {
    throw new Error(`Task "${missionId}" cannot be manually tracked`);
  }

  if ((missionId === "share_card" || missionId === "share_site") && !opts?.shareCompleted) {
    throw new Error("Share verification required");
  }

  const mission = await getOrCreateMission(userId);
  const tasks = parseTasks(mission.tasks);

  const task = tasks.find((t) => t.id === missionId);
  if (!task || task.done) return mission;

  task.done = true;
  const progress = tasks.filter((t) => t.done).length;
  const completed = tasks.every((t) => t.done);
  const perfectDay = completed;

  return prisma.dailyMission.update({
    where: { id: mission.id },
    data: { tasks, progress, completed, perfectDay },
  });
}

/**
 * Track all auto-path missions that match a URL in a single DB write.
 */
export async function trackMissionByPath(userId: string, pathname: string) {
  const ids = await pathToMissionIds(pathname);
  if (ids.length === 0) return getOrCreateMission(userId);

  const mission = await getOrCreateMission(userId);
  const tasks = parseTasks(mission.tasks);

  let changed = false;
  for (const id of ids) {
    const task = tasks.find((t) => t.id === id);
    if (task && !task.done) {
      task.done = true;
      changed = true;
    }
  }

  if (!changed) return mission;

  const progress = tasks.filter((t) => t.done).length;
  const completed = tasks.every((t) => t.done);
  const perfectDay = completed;

  return prisma.dailyMission.update({
    where: { id: mission.id },
    data: { tasks, progress, completed, perfectDay },
  });
}

/**
 * Get reward config for a task: checks DB templates first, then falls back.
 */
async function getTaskReward(taskId: string): Promise<MissionRewardsParsed> {
  const resolved = await getResolvedMissions();
  const tpl = resolved.find((r) => r.code === taskId);
  if (tpl) return tpl.rewards;
  return { honey: 10, tickets: 0 };
}

/**
 * Claim reward for a single completed task.
 */
export async function claimTaskReward(userId: string, taskId: string) {
  const mission = await getOrCreateMission(userId);
  const tasks = parseTasks(mission.tasks);

  const task = tasks.find((t) => t.id === taskId);
  if (!task || !task.done || task.claimed) {
    return { claimed: false, mission, earned: 0 };
  }

  task.claimed = true;
  const allClaimed = tasks.filter((t) => t.done).every((t) => t.claimed);

  const updatedMission = await prisma.dailyMission.update({
    where: { id: mission.id },
    data: { tasks, completed: allClaimed },
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { tier: true, tierExpiresAt: true },
  });

  const tierMult = getHoneyMultiplier(user.tier, user.tierExpiresAt);
  const rewards = await getTaskReward(taskId);
  const amount = Math.round(rewards.honey * tierMult);

  let earned = 0;
  if (amount > 0) {
    const result = await earnHoneyDirect(
      userId,
      "DAILY_MISSION",
      amount,
      `Mission: ${taskId}`,
      { taskId, baseReward: rewards.honey },
    );
    earned = result.earned;
  }

  if (rewards.tickets && rewards.tickets > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { ticketBalance: { increment: rewards.tickets } },
    });
  }

  return { claimed: true, mission: { ...updatedMission, tasks }, earned };
}

/**
 * Claim perfect-day bonus (all tasks done and claimed).
 * Reads from MissionBonusRule (ALL_COMPLETE) or falls back to hardcoded 20 honey.
 */
export async function claimBonusReward(userId: string) {
  const mission = await getOrCreateMission(userId);
  const tasks = parseTasks(mission.tasks);

  const allDone = tasks.every((t) => t.done);
  const allClaimed = tasks.every((t) => t.claimed);

  if (!allDone || !allClaimed || mission.bonusClaimed) {
    return { claimed: false, mission, earned: 0 };
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { tier: true, tierExpiresAt: true },
  });

  const tierMult = getHoneyMultiplier(user.tier, user.tierExpiresAt);

  const bonusRules = await getActiveBonusRules("DAILY");
  const allCompleteRule = bonusRules.find((r) => r.requirement === "ALL_COMPLETE");

  let bonusRewards: MissionRewardsParsed;
  if (allCompleteRule) {
    bonusRewards = parseJsonField(MissionRewardsSchema, allCompleteRule.rewards, "BonusRule.rewards", {
      honey: FALLBACK_PERFECT_DAY_BONUS,
      tickets: 0,
    });
  } else {
    bonusRewards = { honey: FALLBACK_PERFECT_DAY_BONUS, tickets: 0 };
  }

  const amount = Math.round(bonusRewards.honey * tierMult);

  const updatedMission = await prisma.dailyMission.update({
    where: { id: mission.id },
    data: { bonusClaimed: true, perfectDay: true },
  });

  let earned = 0;
  if (amount > 0) {
    const result = await earnHoneyDirect(
      userId,
      "DAILY_MISSION",
      amount,
      "Perfect day bonus",
      { perfectDay: true },
    );
    earned = result.earned;
  }

  if (bonusRewards.tickets && bonusRewards.tickets > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { ticketBalance: { increment: bonusRewards.tickets } },
    });
  }

  checkWeeklyBonus(userId).catch((e) => console.error("[honey] checkWeeklyBonus failed:", e));

  return { claimed: true, mission: { ...updatedMission, bonusClaimed: true }, earned };
}

const FALLBACK_WEEKLY_BONUS_AMOUNT = 100;

async function checkWeeklyBonus(userId: string) {
  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }

  const missions = await prisma.dailyMission.findMany({
    where: { userId, date: { in: dates } },
    select: { date: true, perfectDay: true, bonusClaimed: true },
  });

  if (missions.length < 7) return;
  if (!missions.every((m) => m.perfectDay && m.bonusClaimed)) return;

  const weekStart = dates[dates.length - 1];
  const existing = await prisma.honeyTransaction.findFirst({
    where: {
      userId,
      type: "WEEKLY_BONUS",
      metadata: { path: ["weekStart"], equals: weekStart },
    },
  });
  if (existing) return;

  const bonusRules = await getActiveBonusRules("DAILY");
  const streakRule = bonusRules.find((r) => r.requirement === "STREAK_DAYS" && r.requirementValue <= 7);
  let weeklyAmount = FALLBACK_WEEKLY_BONUS_AMOUNT;
  if (streakRule) {
    const rewards = parseJsonField(MissionRewardsSchema, streakRule.rewards, "BonusRule.rewards", { honey: FALLBACK_WEEKLY_BONUS_AMOUNT, tickets: 0 });
    weeklyAmount = rewards.honey;
  }

  await earnHoneyDirect(userId, "WEEKLY_BONUS", weeklyAmount, "Weekly mission bonus: 7 perfect days", {
    weekStart,
    weekEnd: dates[0],
  });
}

/**
 * Get the perfect-day bonus amount from DB rules or fallback.
 */
async function getPerfectDayBonus(): Promise<number> {
  const bonusRules = await getActiveBonusRules("DAILY");
  const allCompleteRule = bonusRules.find((r) => r.requirement === "ALL_COMPLETE");
  if (allCompleteRule) {
    const rewards = parseJsonField(MissionRewardsSchema, allCompleteRule.rewards, "BonusRule.rewards", { honey: FALLBACK_PERFECT_DAY_BONUS, tickets: 0 });
    return rewards.honey;
  }
  return FALLBACK_PERFECT_DAY_BONUS;
}

/**
 * Serialize mission for client (maps tasks to include labelKey/hintKey/icon).
 * Also includes direct name/nameEn/nameTh for templates where the labelKey
 * might not have a static i18n entry (admin-created templates).
 */
export async function serializeMission(mission: {
  tasks: unknown;
  progress: number;
  completed: boolean;
  perfectDay: boolean;
  bonusClaimed: boolean;
}) {
  const defs = await getDailyMissionDefs();
  const resolved = await getResolvedMissions();
  const tasks = parseTasks(mission.tasks);
  const perfectDayBonus = await getPerfectDayBonus();
  return {
    tasks: tasks.map((t) => {
      const def = defs.find((d) => d.id === t.id);
      const tpl = resolved.find((r) => r.code === t.id);
      return {
        id: t.id,
        done: t.done,
        reward: t.reward,
        claimed: t.claimed,
        labelKey: def?.labelKey ?? t.id,
        hintKey: def?.hintKey ?? "",
        icon: def?.icon ?? "Circle",
        trackType: def?.trackType ?? "auto-path",
        name: tpl?.name ?? null,
        nameEn: tpl?.nameEn ?? null,
        nameTh: tpl?.nameTh ?? null,
        description: tpl?.description ?? null,
        descriptionEn: tpl?.descriptionEn ?? null,
        descriptionTh: tpl?.descriptionTh ?? null,
      };
    }),
    progress: mission.progress,
    completed: mission.completed,
    perfectDay: mission.perfectDay,
    bonusClaimed: mission.bonusClaimed,
    perfectDayBonus,
  };
}
