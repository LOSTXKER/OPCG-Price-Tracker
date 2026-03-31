import { prisma } from "@/lib/db";
import { earnHoney, getHoneyMultiplier } from "@/lib/honey";

/**
 * DB columns keep their original names for backwards compat:
 *   checkedPrice → "Check a card price"   (visit /cards/[code])
 *   addedCard    → "Browse the market"     (visit /, /cards, /trending, /market-overview, /search, /sets)
 *   viewedSet    → "Use a tool"            (visit /compare, /portfolio, /watchlist, /deck-calculator, /pull-calculator, /marketplace)
 */
type MissionTask = "checkedPrice" | "addedCard" | "viewedSet";

const BROWSE_PREFIXES = ["/cards", "/trending", "/market-overview", "/search", "/sets"];
const TOOL_PREFIXES = ["/compare", "/portfolio", "/watchlist", "/deck-calculator", "/pull-calculator", "/marketplace"];

export function pathToMissionTask(pathname: string): MissionTask | null {
  if (/^\/cards\/[^/]+/.test(pathname)) return "checkedPrice";
  for (const p of TOOL_PREFIXES) if (pathname === p || pathname.startsWith(p + "/")) return "viewedSet";
  if (pathname === "/") return "addedCard";
  for (const p of BROWSE_PREFIXES) if (pathname === p || pathname.startsWith(p + "/")) return "addedCard";
  return null;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getOrCreateMission(userId: string) {
  const date = todayStr();
  return prisma.dailyMission.upsert({
    where: { userId_date: { userId, date } },
    update: {},
    create: { userId, date },
  });
}

export async function trackMission(userId: string, task: MissionTask) {
  const mission = await getOrCreateMission(userId);
  if (mission.completed) return mission;
  if (mission[task]) return mission;

  const data: Record<string, boolean> = { [task]: true };

  const updated = { ...mission, [task]: true };
  if (updated.checkedPrice && updated.addedCard && updated.viewedSet) {
    data.completed = true;
  }

  return prisma.dailyMission.update({
    where: { id: mission.id },
    data,
  });
}

export async function claimMissionReward(userId: string) {
  const mission = await getOrCreateMission(userId);
  if (!mission.completed || mission.rewardClaimed) {
    return { claimed: false, mission };
  }

  await prisma.dailyMission.update({
    where: { id: mission.id },
    data: { rewardClaimed: true },
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { tier: true, tierExpiresAt: true },
  });

  const result = await earnHoney(
    userId,
    "DAILY_MISSION",
    "Daily mission completed",
    undefined,
    getHoneyMultiplier(user.tier, user.tierExpiresAt),
  );

  return { claimed: true, mission: { ...mission, rewardClaimed: true }, earned: result?.earned ?? 0 };
}
