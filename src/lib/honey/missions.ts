import { prisma } from "@/lib/db";
import { earnHoneyDirect, getHoneyMultiplier } from ".";
import { todayStr, currentMonthKey } from "./utils";
import { incrementEntitlement } from "@/lib/users/entitlements";
import { z } from "zod";
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

/* ── Honey rebalance v2: fallback definitions ──
 * Daily missions are 5 honey per task, with a 10-honey perfect-day bonus
 * (cap 30 honey/day). Weekly bonus is 75 × tier (callsite scales it).
 * Tier scaling on claims happens inside `claimTaskReward` /
 * `claimBonusReward` — these definitions hold base values only. */

const FALLBACK_TASK_REWARD = 5;

const FALLBACK_CORE_MISSIONS: MissionDef[] = [
  {
    id: "check_price",
    labelKey: "missionCheckPrice",
    hintKey: "missionCheckPriceHint",
    icon: "Search",
    reward: FALLBACK_TASK_REWARD,
    paths: [/^\/cards\/[^/]+/],
    trackType: "auto-path",
  },
  {
    id: "browse_trending",
    labelKey: "missionBrowseTrending",
    hintKey: "missionBrowseTrendingHint",
    icon: "TrendingUp",
    reward: FALLBACK_TASK_REWARD,
    paths: ["/trending"],
    trackType: "auto-path",
  },
  {
    id: "visit_marketplace",
    labelKey: "missionVisitMarketplace",
    hintKey: "missionVisitMarketplaceHint",
    icon: "ShoppingBag",
    reward: FALLBACK_TASK_REWARD,
    paths: ["/marketplace"],
    trackType: "auto-path",
  },
];

const FALLBACK_ROTATING_MISSIONS: Record<number, MissionDef> = {
  0: { id: "check_portfolio", labelKey: "missionCheckPortfolio", hintKey: "missionCheckPortfolioHint", icon: "Wallet", reward: FALLBACK_TASK_REWARD, paths: ["/portfolio"], trackType: "auto-path" },
  1: { id: "explore_set", labelKey: "missionExploreSet", hintKey: "missionExploreSetHint", icon: "Layers", reward: FALLBACK_TASK_REWARD, paths: [/^\/sets\/[^/]+/], trackType: "auto-path" },
  2: { id: "share_card", labelKey: "missionShareCard", hintKey: "missionShareCardHint", icon: "Share2", reward: FALLBACK_TASK_REWARD, paths: [], trackType: "manual" },
  3: { id: "visit_overview", labelKey: "missionVisitOverview", hintKey: "missionVisitOverviewHint", icon: "BarChart3", reward: FALLBACK_TASK_REWARD, paths: ["/market-overview"], trackType: "auto-path" },
  4: { id: "read_blog", labelKey: "missionReadBlog", hintKey: "missionReadBlogHint", icon: "BookOpen", reward: FALLBACK_TASK_REWARD, paths: ["/blog"], trackType: "auto-path" },
  5: { id: "share_site", labelKey: "missionShareSite", hintKey: "missionShareSiteHint", icon: "Share2", reward: FALLBACK_TASK_REWARD, paths: [], trackType: "manual" },
  6: { id: "check_watchlist", labelKey: "missionCheckWatchlist", hintKey: "missionCheckWatchlistHint", icon: "Eye", reward: FALLBACK_TASK_REWARD, paths: ["/watchlist"], trackType: "auto-path" },
};

const FALLBACK_PERFECT_DAY_BONUS = 10;
const FALLBACK_WEEKLY_BONUS_AMOUNT = 75;
const FALLBACK_WEEKLY_BONUS_TICKETS = 1;
const FALLBACK_MONTHLY_PERFECT_BONUS = 500;
const FALLBACK_MONTHLY_PERFECT_TICKETS = 3;
const MONTHLY_PERFECT_THRESHOLD = 28;
const SHARE_TASK_IDS = new Set(["share_card", "share_site"]);
const MIN_AUTO_DWELL_MS = 8_000;

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

/** Pick a first string-typed path from a mission's path patterns to use as a client CTA link. */
function firstStringPath(paths?: (string | RegExp)[]): string | null {
  if (!paths) return null;
  for (const p of paths) {
    if (typeof p === "string") return p;
  }
  return null;
}

/* ── Fallback logic ── */

function dayOfWeek(): number {
  return new Date().getDay();
}

function getFallbackDefs(): MissionDef[] {
  const bonus = FALLBACK_ROTATING_MISSIONS[dayOfWeek()];
  return [...FALLBACK_CORE_MISSIONS, bonus];
}

/**
 * Map mission code → known i18n keys. Used when DB-resolved daily missions
 * do not provide a description (the seed script doesn't fill description
 * fields). Without this map, `hintKey` defaults to an empty string and the
 * MissionCard falls back to nothing — leaving each row title-only.
 *
 * Codes here MUST match `scripts/seed-missions.ts` daily mission codes and
 * the IDs in FALLBACK_CORE_MISSIONS / FALLBACK_ROTATING_MISSIONS above.
 */
const KNOWN_MISSION_CODE_MAP: Record<string, { labelKey: string; hintKey: string }> = {
  check_price: { labelKey: "missionCheckPrice", hintKey: "missionCheckPriceHint" },
  browse_trending: { labelKey: "missionBrowseTrending", hintKey: "missionBrowseTrendingHint" },
  visit_marketplace: { labelKey: "missionVisitMarketplace", hintKey: "missionVisitMarketplaceHint" },
  check_portfolio: { labelKey: "missionCheckPortfolio", hintKey: "missionCheckPortfolioHint" },
  explore_set: { labelKey: "missionExploreSet", hintKey: "missionExploreSetHint" },
  share_card: { labelKey: "missionShareCard", hintKey: "missionShareCardHint" },
  visit_overview: { labelKey: "missionVisitOverview", hintKey: "missionVisitOverviewHint" },
  read_blog: { labelKey: "missionReadBlog", hintKey: "missionReadBlogHint" },
  share_site: { labelKey: "missionShareSite", hintKey: "missionShareSiteHint" },
  check_watchlist: { labelKey: "missionCheckWatchlist", hintKey: "missionCheckWatchlistHint" },
};

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
      const known = KNOWN_MISSION_CODE_MAP[r.code];
      return {
        id: r.code,
        labelKey: known?.labelKey ?? r.code,
        hintKey: known?.hintKey ?? "",
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

/**
 * Daily-cadence row in the unified `UserMissionPeriod` table. We expose
 * `date` as a derived alias of `periodKey` so the rest of this module
 * (and historic call sites) keep reading `mission.date` even after the
 * Phase 3.2 schema unification.
 */
type DailyMissionRow = Awaited<
  ReturnType<typeof prisma.userMissionPeriod.findUnique>
> extends infer T
  ? T extends null
    ? never
    : T
  : never;

function withDateAlias<T extends { periodKey: string }>(row: T): T & { date: string } {
  return { ...row, date: row.periodKey };
}

export async function getOrCreateMission(userId: string): Promise<DailyMissionRow & { date: string }> {
  const date = todayStr();
  const existing = await prisma.userMissionPeriod.findUnique({
    where: {
      userId_cadence_periodKey: { userId, cadence: "DAILY", periodKey: date },
    },
  });

  if (existing) {
    const existingTasks = parseTasks(existing.tasks);
    if (!existingTasks || existingTasks.length === 0) {
      const updated = await prisma.userMissionPeriod.update({
        where: { id: existing.id },
        data: { tasks: await buildTasks() },
      });
      return withDateAlias(updated);
    }
    const needsMigration = existingTasks.some((t) => t.reward == null);
    if (needsMigration) {
      const defs = await getDailyMissionDefs();
      const migrated = existingTasks.map((t) => {
        const def = defs.find((d) => d.id === t.id);
        return {
          id: t.id,
          done: t.done,
          reward: t.reward ?? def?.reward ?? FALLBACK_TASK_REWARD,
          claimed: t.claimed ?? false,
        };
      });
      const updated = await prisma.userMissionPeriod.update({
        where: { id: existing.id },
        data: { tasks: migrated },
      });
      return withDateAlias(updated);
    }
    return withDateAlias(existing);
  }

  const created = await prisma.userMissionPeriod.create({
    data: { userId, cadence: "DAILY", periodKey: date, tasks: await buildTasks() },
  });
  return withDateAlias(created);
}

/**
 * Mark a single manual task as done. Rejects auto-path tasks.
 *
 * For share_* tasks the caller MUST set `shareCompleted: true` AND provide
 * a non-empty `shareTarget` (cardId or URL). The target is recorded into
 * `metadata.shareTargets` so we can reject duplicates and detect botting.
 *
 * Race-safe via Serializable transaction over read → mutate → update.
 */
export async function trackMission(
  userId: string,
  missionId: string,
  opts?: { shareCompleted?: boolean; shareTarget?: string },
) {
  const defs = await getDailyMissionDefs();
  const def = defs.find((d) => d.id === missionId);
  if (!def || def.trackType !== "manual") {
    throw new Error(`Task "${missionId}" cannot be manually tracked`);
  }

  if (SHARE_TASK_IDS.has(missionId)) {
    if (!opts?.shareCompleted) throw new Error("Share verification required");
    if (!opts.shareTarget || !opts.shareTarget.trim()) {
      throw new Error("Share target required (card id or URL)");
    }
  }

  await getOrCreateMission(userId);
  const todayDate = todayStr();

  return prisma.$transaction(
    async (tx) => {
      const mission = await tx.userMissionPeriod.findUnique({
        where: {
          userId_cadence_periodKey: {
            userId,
            cadence: "DAILY",
            periodKey: todayDate,
          },
        },
      });
      if (!mission) throw new Error("Daily mission not found");

      const tasks = parseTasks(mission.tasks);
      const task = tasks.find((t) => t.id === missionId);
      if (!task || task.done) return mission;

      task.done = true;
      const progress = tasks.filter((t) => t.done).length;
      const completed = tasks.every((t) => t.done);
      const perfectDay = completed;

      return tx.userMissionPeriod.update({
        where: { id: mission.id },
        data: { tasks, progress, completed, perfectDay },
      });
    },
    { isolationLevel: "Serializable" },
  );
}

/**
 * Track all auto-path missions that match a URL in a single DB write.
 *
 * Anti-bot: callers should provide `dwellMs` (time spent on the page).
 * Auto-path missions only complete if `dwellMs >= MIN_AUTO_DWELL_MS`,
 * which prevents drive-by route changes from completing a mission.
 * If `dwellMs` is undefined we keep the legacy "any visit counts"
 * behavior for backward compatibility with older clients.
 */
export async function trackMissionByPath(
  userId: string,
  pathname: string,
  opts?: { dwellMs?: number },
) {
  const ids = await pathToMissionIds(pathname);
  if (ids.length === 0) return getOrCreateMission(userId);

  await getOrCreateMission(userId);
  const todayDate = todayStr();
  const dwellOk = opts?.dwellMs == null || opts.dwellMs >= MIN_AUTO_DWELL_MS;

  return prisma.$transaction(
    async (tx) => {
      const mission = await tx.userMissionPeriod.findUnique({
        where: {
          userId_cadence_periodKey: {
            userId,
            cadence: "DAILY",
            periodKey: todayDate,
          },
        },
      });
      if (!mission) throw new Error("Daily mission not found");

      const tasks = parseTasks(mission.tasks);

      let changed = false;
      for (const id of ids) {
        const task = tasks.find((t) => t.id === id);
        if (task && !task.done && dwellOk) {
          task.done = true;
          changed = true;
        }
      }

      if (!changed) return mission;

      const progress = tasks.filter((t) => t.done).length;
      const completed = tasks.every((t) => t.done);
      const perfectDay = completed;

      return tx.userMissionPeriod.update({
        where: { id: mission.id },
        data: { tasks, progress, completed, perfectDay },
      });
    },
    { isolationLevel: "Serializable" },
  );
}

/**
 * Get reward config for a task: checks DB templates first, then falls back.
 */
async function getTaskReward(taskId: string): Promise<MissionRewardsParsed> {
  const resolved = await getResolvedMissions();
  const tpl = resolved.find((r) => r.code === taskId);
  if (tpl) return tpl.rewards;
  return { honey: FALLBACK_TASK_REWARD, tickets: 0 };
}

/**
 * Claim reward for a single completed task.
 *
 * Race-safe: uses an idempotency key on the honey ledger row plus a
 * guarded `updateMany` so two parallel claim requests cannot pay twice
 * even if both load the mission concurrently. The `update` writes the
 * `claimed: true` flip first; if the update wins, we pay; if a second
 * caller arrives, the flag is already `true` and `earnHoneyDirect`'s
 * idempotency key on the `HoneyTransaction` is a second safety net.
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

  const updatedMission = await prisma.userMissionPeriod.update({
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
      {
        applyGlobalCap: true,
        idempotencyKey: `daily-task:${userId}:${mission.date}:${taskId}`,
      },
    );
    earned = result.earned;
  }

  if (rewards.tickets && rewards.tickets > 0) {
    await incrementEntitlement(userId, "ticketBalance", rewards.tickets);
  }

  return { claimed: true, mission: { ...updatedMission, tasks }, earned };
}

/**
 * Claim perfect-day bonus (all tasks done and claimed).
 * Reads from MissionBonusRule (ALL_COMPLETE) or falls back to hardcoded.
 * Triggers weekly + monthly perfect-bonus checks after claiming.
 *
 * Race-safe: flips `bonusClaimed` via guarded `updateMany` and only
 * pays out if the update actually changed a row. If two requests run
 * concurrently, only one will see `count === 1`; the other returns
 * `{ claimed: false }` without paying.
 */
export async function claimBonusReward(userId: string) {
  const mission = await getOrCreateMission(userId);
  const tasks = parseTasks(mission.tasks);

  const allDone = tasks.every((t) => t.done);
  const allClaimed = tasks.every((t) => t.claimed);

  if (!allDone || !allClaimed || mission.bonusClaimed) {
    return { claimed: false, mission, earned: 0 };
  }

  // Atomic flip: only one caller wins this race.
  const flip = await prisma.userMissionPeriod.updateMany({
    where: { id: mission.id, bonusClaimed: false },
    data: { bonusClaimed: true, perfectDay: true },
  });
  if (flip.count === 0) {
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

  const updatedMission = await prisma.userMissionPeriod.findUniqueOrThrow({
    where: { id: mission.id },
  });

  let earned = 0;
  if (amount > 0) {
    const result = await earnHoneyDirect(
      userId,
      "DAILY_MISSION",
      amount,
      "Perfect day bonus",
      { perfectDay: true },
      {
        applyGlobalCap: true,
        idempotencyKey: `daily-bonus:${userId}:${mission.date}`,
      },
    );
    earned = result.earned;
  }

  if (bonusRewards.tickets && bonusRewards.tickets > 0) {
    await incrementEntitlement(userId, "ticketBalance", bonusRewards.tickets);
  }

  // Fire-and-forget: weekly streak (75 × tier + 1 ticket) and monthly
  // streak (28 perfect days = 500 × tier + 3 tickets).
  checkWeeklyBonus(userId, tierMult).catch((e) => console.error("[honey] checkWeeklyBonus failed:", e));
  checkMonthlyPerfectBonus(userId, tierMult).catch((e) => console.error("[honey] checkMonthlyPerfectBonus failed:", e));

  return { claimed: true, mission: { ...updatedMission, bonusClaimed: true }, earned };
}

/**
 * Check the trailing 7 days. If every one is a perfect-day with a claimed
 * bonus, pay out the weekly streak reward (75 × tier honey + 1 raffle ticket).
 * Idempotent via a metadata.weekStart marker on the WEEKLY_BONUS transaction.
 */
async function checkWeeklyBonus(userId: string, tierMultiplier: number) {
  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }

  const missions = await prisma.userMissionPeriod.findMany({
    where: { userId, cadence: "DAILY", periodKey: { in: dates } },
    select: { periodKey: true, perfectDay: true, bonusClaimed: true },
  });

  if (missions.length < 7) return;
  if (!missions.every((m) => m.perfectDay && m.bonusClaimed)) return;

  const weekStart = dates[dates.length - 1];

  const bonusRules = await getActiveBonusRules("DAILY");
  const streakRule = bonusRules.find((r) => r.requirement === "STREAK_DAYS" && r.requirementValue <= 7);

  let baseHoney = FALLBACK_WEEKLY_BONUS_AMOUNT;
  let baseTickets = FALLBACK_WEEKLY_BONUS_TICKETS;
  if (streakRule) {
    const rewards = parseJsonField(MissionRewardsSchema, streakRule.rewards, "BonusRule.rewards", {
      honey: FALLBACK_WEEKLY_BONUS_AMOUNT,
      tickets: FALLBACK_WEEKLY_BONUS_TICKETS,
    });
    baseHoney = rewards.honey;
    baseTickets = rewards.tickets ?? 0;
  }

  const honeyAmount = Math.round(baseHoney * tierMultiplier);

  if (honeyAmount > 0) {
    // Idempotency key prevents double-pay if two daily-mission claims
    // race the perfect-day check; second caller will hit P2002 and exit.
    const result = await earnHoneyDirect(
      userId,
      "WEEKLY_BONUS",
      honeyAmount,
      "Weekly mission bonus: 7 perfect days",
      { weekStart, weekEnd: dates[0], tierMultiplier, baseHoney },
      { idempotencyKey: `weekly-bonus:${userId}:${weekStart}` },
    );
    // earned === 0 means a parallel caller already paid; skip ticket grant.
    if (result.earned === 0) return;
  }

  if (baseTickets > 0) {
    await incrementEntitlement(userId, "ticketBalance", baseTickets);
  }
}

/**
 * Check the trailing 28 days for the monthly perfect-streak bonus
 * (500 × tier honey + 3 raffle tickets). Idempotent per ISO month using a
 * metadata.monthKey marker on the MONTHLY_PERFECT_BONUS transaction. The
 * 28-day window is a rolling check, but the marker is the calendar month
 * the day-28 falls in, so a user can only claim it once per month.
 */
async function checkMonthlyPerfectBonus(userId: string, tierMultiplier: number) {
  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < MONTHLY_PERFECT_THRESHOLD; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }

  const missions = await prisma.userMissionPeriod.findMany({
    where: { userId, cadence: "DAILY", periodKey: { in: dates } },
    select: { perfectDay: true, bonusClaimed: true },
  });

  if (missions.length < MONTHLY_PERFECT_THRESHOLD) return;
  if (!missions.every((m) => m.perfectDay && m.bonusClaimed)) return;

  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const bonusRules = await getActiveBonusRules("MONTHLY");
  const monthlyRule = bonusRules.find((r) => r.requirement === "MONTHLY_PERFECT");

  let baseHoney = FALLBACK_MONTHLY_PERFECT_BONUS;
  let baseTickets = FALLBACK_MONTHLY_PERFECT_TICKETS;
  if (monthlyRule) {
    const rewards = parseJsonField(MissionRewardsSchema, monthlyRule.rewards, "BonusRule.rewards", {
      honey: FALLBACK_MONTHLY_PERFECT_BONUS,
      tickets: FALLBACK_MONTHLY_PERFECT_TICKETS,
    });
    baseHoney = rewards.honey;
    baseTickets = rewards.tickets ?? 0;
  }

  const honeyAmount = Math.round(baseHoney * tierMultiplier);

  if (honeyAmount > 0) {
    const result = await earnHoneyDirect(
      userId,
      "MONTHLY_PERFECT_BONUS",
      honeyAmount,
      "Monthly perfect streak: 28 days",
      {
        monthKey,
        windowStart: dates[dates.length - 1],
        windowEnd: dates[0],
        tierMultiplier,
        baseHoney,
      },
      { idempotencyKey: `monthly-perfect:${userId}:${monthKey}` },
    );
    if (result.earned === 0) return;
  }

  if (baseTickets > 0) {
    await incrementEntitlement(userId, "ticketBalance", baseTickets);
  }
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
      const ctaPath = firstStringPath(def?.paths);
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
        ctaPath,
      };
    }),
    progress: mission.progress,
    completed: mission.completed,
    perfectDay: mission.perfectDay,
    bonusClaimed: mission.bonusClaimed,
    perfectDayBonus,
  };
}

/* ── Constants exposed for tests / docs ── */
export {
  FALLBACK_TASK_REWARD,
  FALLBACK_PERFECT_DAY_BONUS,
  FALLBACK_WEEKLY_BONUS_AMOUNT,
  FALLBACK_WEEKLY_BONUS_TICKETS,
  FALLBACK_MONTHLY_PERFECT_BONUS,
  FALLBACK_MONTHLY_PERFECT_TICKETS,
  MONTHLY_PERFECT_THRESHOLD,
  MIN_AUTO_DWELL_MS,
};

/* ════════════════════════════════════════════════════════════════════
 * MONTHLY RAFFLE MISSIONS
 * ────────────────────────────────────────────────────────────────────
 * Hardcoded mission definitions for the monthly raffle arc. Stored on
 * the same `UserMissionPeriod` table (cadence: MONTHLY) introduced by
 * Phase 3.2; helpers below alias `periodKey` back to `month` for
 * compatibility with the existing API contract.
 * ════════════════════════════════════════════════════════════════════ */

export type RaffleMissionReward = {
  honey: number;
  ticket: number;
};

export type RaffleMissionDef = {
  id: string;
  labelKey: string;
  hintKey: string;
  icon: string;
  target: number;
  reward: RaffleMissionReward;
  trackType: "auto-path" | "manual";
  ctaPath?: string;
};

export type RaffleMissionTask = {
  id: string;
  done: boolean;
  claimed: boolean;
  progress: number;
  target: number;
  visitedKeys?: string[];
};

const RAFFLE_COMPLETE_ALL_ID = "complete_all";

/**
 * Honey rebalance v2: monthly raffle missions are primarily a path to
 * tickets, not honey. Each mission grants 1 ticket; two also include a
 * small honey nudge for completion. The complete-all bonus pays 2 tickets.
 */
export const RAFFLE_MISSIONS: RaffleMissionDef[] = [
  {
    id: "explore_sets",
    labelKey: "raffleMissionExploreSets",
    hintKey: "raffleMissionExploreSetsHint",
    icon: "Layers",
    target: 15,
    reward: { honey: 0, ticket: 1 },
    trackType: "auto-path",
    ctaPath: "/sets",
  },
  {
    id: "check_cards",
    labelKey: "raffleMissionCheckCards",
    hintKey: "raffleMissionCheckCardsHint",
    icon: "Search",
    target: 50,
    reward: { honey: 30, ticket: 1 },
    trackType: "auto-path",
    ctaPath: "/trending",
  },
  {
    id: "share_raffle",
    labelKey: "raffleMissionShareRaffle",
    hintKey: "raffleMissionShareRaffleHint",
    icon: "Share2",
    target: 3,
    reward: { honey: 20, ticket: 1 },
    trackType: "manual",
  },
  {
    id: "visit_trending",
    labelKey: "raffleMissionVisitTrending",
    hintKey: "raffleMissionVisitTrendingHint",
    icon: "TrendingUp",
    target: 10,
    reward: { honey: 0, ticket: 1 },
    trackType: "auto-path",
    ctaPath: "/trending",
  },
];

/**
 * Complete-all bonus: 2 tickets — keeps the monthly arc weighted toward
 * raffle entries rather than another honey payout.
 */
export const RAFFLE_BONUS_REWARD: RaffleMissionReward = { honey: 0, ticket: 2 };

const RaffleMissionTaskSchema = z.object({
  id: z.string(),
  done: z.boolean(),
  claimed: z.boolean(),
  progress: z.number(),
  target: z.number(),
  visitedKeys: z.array(z.string()).optional(),
});
const RaffleMissionTasksSchema = z.array(RaffleMissionTaskSchema);

function parseRaffleTasks(raw: unknown): RaffleMissionTask[] {
  return parseJsonField(
    RaffleMissionTasksSchema,
    raw,
    "UserMissionPeriod.tasks (MONTHLY)",
    [],
  );
}

function buildRaffleTasks(): RaffleMissionTask[] {
  const tasks: RaffleMissionTask[] = RAFFLE_MISSIONS.map((m) => ({
    id: m.id,
    done: false,
    claimed: false,
    progress: 0,
    target: m.target,
    visitedKeys: [],
  }));
  tasks.push({
    id: RAFFLE_COMPLETE_ALL_ID,
    done: false,
    claimed: false,
    progress: 0,
    target: RAFFLE_MISSIONS.length,
  });
  return tasks;
}

function syncRaffleBonusTask(tasks: RaffleMissionTask[]) {
  const bonus = tasks.find((t) => t.id === RAFFLE_COMPLETE_ALL_ID);
  if (!bonus) return;
  const regularClaimed = tasks.filter(
    (t) => t.id !== RAFFLE_COMPLETE_ALL_ID && t.claimed,
  ).length;
  bonus.progress = regularClaimed;
  bonus.done = regularClaimed >= RAFFLE_MISSIONS.length;
}

type MonthlyMissionRow = NonNullable<
  Awaited<ReturnType<typeof prisma.userMissionPeriod.findUnique>>
>;

function withMonthAlias<T extends { periodKey: string }>(
  row: T,
): T & { month: string } {
  return { ...row, month: row.periodKey };
}

export async function getOrCreateMonthlyMissions(
  userId: string,
  month?: string,
): Promise<MonthlyMissionRow & { month: string }> {
  const key = month ?? currentMonthKey();
  const existing = await prisma.userMissionPeriod.findUnique({
    where: {
      userId_cadence_periodKey: { userId, cadence: "MONTHLY", periodKey: key },
    },
  });

  if (existing) {
    const tasks = parseRaffleTasks(existing.tasks);
    const hasAllIds =
      RAFFLE_MISSIONS.every((m) => tasks.some((t) => t.id === m.id)) &&
      tasks.some((t) => t.id === RAFFLE_COMPLETE_ALL_ID);
    if (!tasks.length || !hasAllIds) {
      const updated = await prisma.userMissionPeriod.update({
        where: { id: existing.id },
        data: { tasks: buildRaffleTasks() },
      });
      return withMonthAlias(updated);
    }
    return withMonthAlias(existing);
  }

  const created = await prisma.userMissionPeriod.create({
    data: {
      userId,
      cadence: "MONTHLY",
      periodKey: key,
      tasks: buildRaffleTasks(),
    },
  });
  return withMonthAlias(created);
}

/**
 * Track progress for a raffle mission. Uses dedupKey to prevent
 * double-counting (e.g. same set code or same date).
 *
 * Race-safe: read → mutate → update runs inside a Serializable
 * transaction; concurrent path visits cannot both see the same
 * "not-yet-visited" snapshot of the JSON column.
 */
export async function trackRaffleMission(
  userId: string,
  missionId: string,
  opts?: { dedupKey?: string },
) {
  const def = RAFFLE_MISSIONS.find((m) => m.id === missionId);
  if (!def) throw new Error(`Unknown raffle mission: ${missionId}`);

  await getOrCreateMonthlyMissions(userId);

  return prisma.$transaction(
    async (tx) => {
      const mission = await tx.userMissionPeriod.findUnique({
        where: {
          userId_cadence_periodKey: {
            userId,
            cadence: "MONTHLY",
            periodKey: currentMonthKey(),
          },
        },
      });
      if (!mission) throw new Error("Monthly mission not found");

      const tasks = parseRaffleTasks(mission.tasks);
      const task = tasks.find((t) => t.id === missionId);
      if (!task || task.done) return withMonthAlias(mission);

      if (opts?.dedupKey) {
        const visited = task.visitedKeys ?? [];
        if (visited.includes(opts.dedupKey)) return withMonthAlias(mission);
        task.visitedKeys = [...visited, opts.dedupKey];
      }

      task.progress = Math.min(task.progress + 1, task.target);
      if (task.progress >= task.target) task.done = true;

      const updated = await tx.userMissionPeriod.update({
        where: { id: mission.id },
        data: { tasks },
      });
      return withMonthAlias(updated);
    },
    { isolationLevel: "Serializable" },
  );
}

/**
 * Claim the reward for a completed regular raffle mission.
 * Awards honey OR a free raffle ticket (single reward per mission).
 * After claiming, syncs the bonus task's progress.
 */
export async function claimRaffleMissionReward(
  userId: string,
  missionId: string,
) {
  const def = RAFFLE_MISSIONS.find((m) => m.id === missionId);
  if (!def) return { claimed: false, earned: 0, ticketAwarded: false };

  const mission = await getOrCreateMonthlyMissions(userId);
  const tasks = parseRaffleTasks(mission.tasks);
  const task = tasks.find((t) => t.id === missionId);
  if (!task || !task.done || task.claimed) {
    return { claimed: false, earned: 0, ticketAwarded: false };
  }

  task.claimed = true;
  syncRaffleBonusTask(tasks);

  await prisma.userMissionPeriod.update({
    where: { id: mission.id },
    data: { tasks },
  });

  let earned = 0;
  if (def.reward.honey > 0) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { tier: true, tierExpiresAt: true },
    });
    // MONTHLY_MISSION uses tier-only multiplier per the policy table —
    // these are rare events and shouldn't seasonal-2x.
    const tierMult = getHoneyMultiplier(user.tier, user.tierExpiresAt);
    const amount = Math.round(def.reward.honey * tierMult);

    const result = await earnHoneyDirect(
      userId,
      "MONTHLY_MISSION",
      amount,
      `Monthly mission: ${missionId}`,
      {
        missionId,
        month: mission.month,
        baseHoney: def.reward.honey,
        tierMult,
      },
      {
        applyGlobalCap: true,
        idempotencyKey: `monthly-task:${userId}:${mission.month}:${missionId}`,
      },
    );
    earned = result.earned;
  }

  let ticketsAwarded = 0;
  if (def.reward.ticket > 0) {
    ticketsAwarded = await awardFreeTickets(userId, def.reward.ticket);
  }

  return { claimed: true, earned, ticketAwarded: ticketsAwarded > 0, ticketsAwarded };
}

/**
 * Claim the "complete all" bonus reward (2 free tickets per v2).
 *
 * Race-safe via guarded `updateMany`: only the first caller flips
 * `bonusClaimed: true` and pays out the tickets.
 */
export async function claimRaffleMissionBonus(userId: string) {
  const mission = await getOrCreateMonthlyMissions(userId);
  const tasks = parseRaffleTasks(mission.tasks);
  const bonus = tasks.find((t) => t.id === RAFFLE_COMPLETE_ALL_ID);
  if (!bonus || !bonus.done || bonus.claimed) {
    return { claimed: false, ticketAwarded: false, ticketsAwarded: 0 };
  }

  const flip = await prisma.userMissionPeriod.updateMany({
    where: { id: mission.id, bonusClaimed: false },
    data: { bonusClaimed: true },
  });
  if (flip.count === 0) {
    return { claimed: false, ticketAwarded: false, ticketsAwarded: 0 };
  }

  bonus.claimed = true;
  await prisma.userMissionPeriod.update({
    where: { id: mission.id },
    data: { tasks },
  });

  const ticketsAwarded = await awardFreeTickets(userId, RAFFLE_BONUS_REWARD.ticket);
  return { claimed: true, ticketAwarded: ticketsAwarded > 0, ticketsAwarded };
}

async function awardFreeTickets(userId: string, count: number): Promise<number> {
  if (count <= 0) return 0;
  await incrementEntitlement(userId, "ticketBalance", count);
  return count;
}

/**
 * Serialize monthly missions for the client.
 * Separates regular tasks from the bonus task.
 */
export function serializeRaffleMissions(mission: {
  tasks: unknown;
  month: string;
}) {
  const tasks = parseRaffleTasks(mission.tasks);
  const regular = tasks.filter((t) => t.id !== RAFFLE_COMPLETE_ALL_ID);
  const bonus = tasks.find((t) => t.id === RAFFLE_COMPLETE_ALL_ID);
  const completedCount = regular.filter((t) => t.claimed).length;

  return {
    month: mission.month,
    completedCount,
    totalCount: RAFFLE_MISSIONS.length,
    tasks: regular.map((t) => {
      const def = RAFFLE_MISSIONS.find((d) => d.id === t.id);
      return {
        id: t.id,
        done: t.done,
        claimed: t.claimed,
        progress: t.progress,
        target: t.target,
        labelKey: def?.labelKey ?? t.id,
        hintKey: def?.hintKey ?? "",
        icon: def?.icon ?? "Circle",
        trackType: def?.trackType ?? "auto-path",
        reward: def?.reward ?? { honey: 0, ticket: 0 },
        ctaPath: def?.ctaPath ?? null,
      };
    }),
    bonus: {
      done: bonus?.done ?? false,
      claimed: bonus?.claimed ?? false,
      progress: bonus?.progress ?? 0,
      target: RAFFLE_MISSIONS.length,
      reward: RAFFLE_BONUS_REWARD,
    },
  };
}
