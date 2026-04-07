import { prisma } from "@/lib/db";
import { earnHoneyDirect, getHoneyMultiplier } from ".";
import { currentMonthKey } from "./utils";
import { z } from "zod";
import { parseJsonField } from "./schemas";

/* ── Types ── */

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
};

export type RaffleMissionTask = {
  id: string;
  done: boolean;
  claimed: boolean;
  progress: number;
  target: number;
  visitedKeys?: string[];
};

const COMPLETE_ALL_ID = "complete_all";

/* ── Mission definitions (4 regular, single reward each) ── */

export const RAFFLE_MISSIONS: RaffleMissionDef[] = [
  {
    id: "explore_sets",
    labelKey: "raffleMissionExploreSets",
    hintKey: "raffleMissionExploreSetsHint",
    icon: "Layers",
    target: 15,
    reward: { honey: 0, ticket: 1 },
    trackType: "auto-path",
  },
  {
    id: "check_cards",
    labelKey: "raffleMissionCheckCards",
    hintKey: "raffleMissionCheckCardsHint",
    icon: "Search",
    target: 50,
    reward: { honey: 50, ticket: 0 },
    trackType: "auto-path",
  },
  {
    id: "share_raffle",
    labelKey: "raffleMissionShareRaffle",
    hintKey: "raffleMissionShareRaffleHint",
    icon: "Share2",
    target: 3,
    reward: { honey: 30, ticket: 0 },
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
  },
];

export const RAFFLE_BONUS_REWARD: RaffleMissionReward = { honey: 0, ticket: 1 };

/* ── Zod schema for tasks JSON ── */

const RaffleMissionTaskSchema = z.object({
  id: z.string(),
  done: z.boolean(),
  claimed: z.boolean(),
  progress: z.number(),
  target: z.number(),
  visitedKeys: z.array(z.string()).optional(),
});
const RaffleMissionTasksSchema = z.array(RaffleMissionTaskSchema);

function parseTasks(raw: unknown): RaffleMissionTask[] {
  return parseJsonField(RaffleMissionTasksSchema, raw, "MonthlyMission.tasks", []);
}

function buildTasks(): RaffleMissionTask[] {
  const tasks: RaffleMissionTask[] = RAFFLE_MISSIONS.map((m) => ({
    id: m.id,
    done: false,
    claimed: false,
    progress: 0,
    target: m.target,
    visitedKeys: [],
  }));
  tasks.push({
    id: COMPLETE_ALL_ID,
    done: false,
    claimed: false,
    progress: 0,
    target: RAFFLE_MISSIONS.length,
  });
  return tasks;
}

/** Check if all regular missions are claimed and update the bonus task accordingly. */
function syncBonusTask(tasks: RaffleMissionTask[]) {
  const bonus = tasks.find((t) => t.id === COMPLETE_ALL_ID);
  if (!bonus) return;
  const regularClaimed = tasks.filter((t) => t.id !== COMPLETE_ALL_ID && t.claimed).length;
  bonus.progress = regularClaimed;
  bonus.done = regularClaimed >= RAFFLE_MISSIONS.length;
}

/* ── DB operations ── */

export async function getOrCreateMonthlyMissions(userId: string, month?: string) {
  const key = month ?? currentMonthKey();
  const existing = await prisma.monthlyMission.findUnique({
    where: { userId_month: { userId, month: key } },
  });

  if (existing) {
    const tasks = parseTasks(existing.tasks);
    const hasAllIds = RAFFLE_MISSIONS.every((m) => tasks.some((t) => t.id === m.id))
      && tasks.some((t) => t.id === COMPLETE_ALL_ID);
    if (!tasks.length || !hasAllIds) {
      return prisma.monthlyMission.update({
        where: { id: existing.id },
        data: { tasks: buildTasks() },
      });
    }
    return existing;
  }

  return prisma.monthlyMission.create({
    data: { userId, month: key, tasks: buildTasks() },
  });
}

/**
 * Track progress for a mission.
 * Uses dedupKey to prevent double-counting (e.g. same set code or same date).
 */
export async function trackRaffleMission(
  userId: string,
  missionId: string,
  opts?: { dedupKey?: string },
) {
  const def = RAFFLE_MISSIONS.find((m) => m.id === missionId);
  if (!def) throw new Error(`Unknown raffle mission: ${missionId}`);

  const mission = await getOrCreateMonthlyMissions(userId);
  const tasks = parseTasks(mission.tasks);
  const task = tasks.find((t) => t.id === missionId);
  if (!task || task.done) return mission;

  if (opts?.dedupKey) {
    const visited = task.visitedKeys ?? [];
    if (visited.includes(opts.dedupKey)) return mission;
    task.visitedKeys = [...visited, opts.dedupKey];
  }

  if (def.trackType === "manual") {
    task.progress = Math.min(task.progress + 1, task.target);
    if (task.progress >= task.target) task.done = true;
  } else {
    task.progress = Math.min(task.progress + 1, task.target);
    if (task.progress >= task.target) task.done = true;
  }

  return prisma.monthlyMission.update({
    where: { id: mission.id },
    data: { tasks },
  });
}

/**
 * Claim the reward for a completed regular mission.
 * Awards honey OR a free raffle ticket (single reward per mission).
 * After claiming, syncs the bonus task's progress.
 */
export async function claimRaffleMissionReward(userId: string, missionId: string) {
  const def = RAFFLE_MISSIONS.find((m) => m.id === missionId);
  if (!def) return { claimed: false, earned: 0, ticketAwarded: false };

  const mission = await getOrCreateMonthlyMissions(userId);
  const tasks = parseTasks(mission.tasks);
  const task = tasks.find((t) => t.id === missionId);
  if (!task || !task.done || task.claimed) {
    return { claimed: false, earned: 0, ticketAwarded: false };
  }

  task.claimed = true;
  syncBonusTask(tasks);

  await prisma.monthlyMission.update({
    where: { id: mission.id },
    data: { tasks },
  });

  let earned = 0;
  if (def.reward.honey > 0) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { tier: true, tierExpiresAt: true },
    });
    const tierMult = getHoneyMultiplier(user.tier, user.tierExpiresAt);
    const amount = Math.round(def.reward.honey * tierMult);

    const result = await earnHoneyDirect(
      userId,
      "MONTHLY_MISSION",
      amount,
      `Monthly mission: ${missionId}`,
      { missionId, month: mission.month },
    );
    earned = result.earned;
  }

  let ticketAwarded = false;
  if (def.reward.ticket > 0) {
    ticketAwarded = await awardFreeTicket(userId);
  }

  return { claimed: true, earned, ticketAwarded };
}

/**
 * Claim the "complete all" bonus reward (1 free ticket).
 */
export async function claimRaffleMissionBonus(userId: string) {
  const mission = await getOrCreateMonthlyMissions(userId);
  const tasks = parseTasks(mission.tasks);
  const bonus = tasks.find((t) => t.id === COMPLETE_ALL_ID);
  if (!bonus || !bonus.done || bonus.claimed) {
    return { claimed: false, ticketAwarded: false };
  }

  bonus.claimed = true;

  await prisma.monthlyMission.update({
    where: { id: mission.id },
    data: { tasks },
  });

  const ticketAwarded = await awardFreeTicket(userId);
  return { claimed: true, ticketAwarded };
}

async function awardFreeTicket(userId: string): Promise<boolean> {
  await prisma.user.update({
    where: { id: userId },
    data: { ticketBalance: { increment: 1 } },
  });
  return true;
}

/**
 * Serialize monthly missions for the client.
 * Separates regular tasks from the bonus task.
 */
export function serializeRaffleMissions(mission: { tasks: unknown; month: string }) {
  const tasks = parseTasks(mission.tasks);
  const regular = tasks.filter((t) => t.id !== COMPLETE_ALL_ID);
  const bonus = tasks.find((t) => t.id === COMPLETE_ALL_ID);
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
