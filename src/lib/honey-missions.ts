import { prisma } from "@/lib/db";
import { earnHoneyDirect, getHoneyMultiplier } from "@/lib/honey";
import { todayStr } from "@/lib/honey-utils";
import { MissionTasksSchema, type MissionTaskParsed, parseJsonField } from "@/lib/honey-schemas";

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

/* ── Mission definitions ── */

const CORE_MISSIONS: MissionDef[] = [
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

const ROTATING_MISSIONS: Record<number, MissionDef> = {
  0: { id: "check_portfolio", labelKey: "missionCheckPortfolio", hintKey: "missionCheckPortfolioHint", icon: "Wallet", reward: 10, paths: ["/portfolio"], trackType: "auto-path" },
  1: { id: "explore_set", labelKey: "missionExploreSet", hintKey: "missionExploreSetHint", icon: "Layers", reward: 10, paths: [/^\/sets\/[^/]+/], trackType: "auto-path" },
  2: { id: "share_card", labelKey: "missionShareCard", hintKey: "missionShareCardHint", icon: "Share2", reward: 10, paths: [], trackType: "manual" },
  3: { id: "visit_overview", labelKey: "missionVisitOverview", hintKey: "missionVisitOverviewHint", icon: "BarChart3", reward: 10, paths: ["/market-overview"], trackType: "auto-path" },
  4: { id: "read_blog", labelKey: "missionReadBlog", hintKey: "missionReadBlogHint", icon: "BookOpen", reward: 10, paths: ["/blog"], trackType: "auto-path" },
  5: { id: "share_site", labelKey: "missionShareSite", hintKey: "missionShareSiteHint", icon: "Share2", reward: 10, paths: [], trackType: "manual" },
  6: { id: "check_watchlist", labelKey: "missionCheckWatchlist", hintKey: "missionCheckWatchlistHint", icon: "Eye", reward: 10, paths: ["/watchlist"], trackType: "auto-path" },
};

const PERFECT_DAY_BONUS = 20;

/* ── Helpers ── */


function dayOfWeek(): number {
  return new Date().getDay();
}

export function getDailyMissions(): { missions: MissionDef[]; bonus: MissionDef } {
  const bonus = ROTATING_MISSIONS[dayOfWeek()];
  return { missions: [...CORE_MISSIONS, bonus], bonus };
}

export function getDailyMissionDefs(): MissionDef[] {
  return getDailyMissions().missions;
}

function buildTasks(): MissionTask[] {
  return getDailyMissionDefs().map((m) => ({
    id: m.id,
    done: false,
    reward: m.reward,
    claimed: false,
  }));
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

export function pathToMissionIds(pathname: string): string[] {
  const defs = getDailyMissionDefs();
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
        data: { tasks: buildTasks() },
      });
    }
    // Migrate old-format tasks (missing reward/claimed) to new format
    const needsMigration = existingTasks.some((t) => t.reward == null);
    if (needsMigration) {
      const defs = getDailyMissionDefs();
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
    data: { userId, date, tasks: buildTasks() },
  });
}

/**
 * Mark a single manual task as done. Rejects auto-path tasks.
 */
export async function trackMission(userId: string, missionId: string, opts?: { shareCompleted?: boolean }) {
  const defs = getDailyMissionDefs();
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
  const ids = pathToMissionIds(pathname);
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
  const amount = Math.round(task.reward * tierMult);

  const result = await earnHoneyDirect(
    userId,
    "DAILY_MISSION",
    amount,
    `Mission: ${taskId}`,
    { taskId, baseReward: task.reward },
  );

  return { claimed: true, mission: { ...updatedMission, tasks }, earned: result.earned };
}

/**
 * Claim perfect-day bonus (all tasks done and claimed).
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
  const amount = Math.round(PERFECT_DAY_BONUS * tierMult);

  const updatedMission = await prisma.dailyMission.update({
    where: { id: mission.id },
    data: { bonusClaimed: true, perfectDay: true },
  });

  const result = await earnHoneyDirect(
    userId,
    "DAILY_MISSION",
    amount,
    "Perfect day bonus",
    { perfectDay: true },
  );

  checkWeeklyBonus(userId).catch((e) => console.error("[honey] checkWeeklyBonus failed:", e));

  return { claimed: true, mission: { ...updatedMission, bonusClaimed: true }, earned: result.earned };
}

const WEEKLY_BONUS_AMOUNT = 100;

/**
 * Check if the user has completed all missions for the last 7 consecutive days.
 * If so, grant a weekly bonus (once per 7-day window).
 */
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

  await earnHoneyDirect(userId, "WEEKLY_BONUS", WEEKLY_BONUS_AMOUNT, "Weekly mission bonus: 7 perfect days", {
    weekStart,
    weekEnd: dates[0],
  });
}

/**
 * Serialize mission for client (maps tasks to include labelKey/hintKey/icon).
 */
export function serializeMission(mission: {
  tasks: unknown;
  progress: number;
  completed: boolean;
  perfectDay: boolean;
  bonusClaimed: boolean;
}) {
  const defs = getDailyMissionDefs();
  const tasks = parseTasks(mission.tasks);
  return {
    tasks: tasks.map((t) => {
      const def = defs.find((d) => d.id === t.id);
      return {
        id: t.id,
        done: t.done,
        reward: t.reward,
        claimed: t.claimed,
        labelKey: def?.labelKey ?? t.id,
        hintKey: def?.hintKey ?? "",
        icon: def?.icon ?? "Circle",
        trackType: def?.trackType ?? "auto-path",
      };
    }),
    progress: mission.progress,
    completed: mission.completed,
    perfectDay: mission.perfectDay,
    bonusClaimed: mission.bonusClaimed,
    perfectDayBonus: PERFECT_DAY_BONUS,
  };
}
