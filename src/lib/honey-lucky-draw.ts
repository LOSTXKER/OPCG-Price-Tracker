import { prisma } from "@/lib/db";
import { spendHoney, earnHoneyDirect } from "@/lib/honey";

export const LUCKY_DRAW_COST = 100;

type DrawOutcome = {
  type: "honey" | "badge" | "trial";
  label: string;
  amount?: number;
  badgeName?: string;
  trialDays?: number;
};

const POOL: { weight: number; outcome: DrawOutcome }[] = [
  { weight: 40, outcome: { type: "honey", label: "+20 Honey", amount: 20 } },
  { weight: 25, outcome: { type: "honey", label: "+50 Honey", amount: 50 } },
  { weight: 20, outcome: { type: "badge", label: "Random Badge", badgeName: "Lucky Badge" } },
  { weight: 10, outcome: { type: "honey", label: "+150 Honey", amount: 150 } },
  { weight: 5, outcome: { type: "trial", label: "1-day Pro Trial", trialDays: 1 } },
];

function roll(): DrawOutcome {
  const total = POOL.reduce((sum, p) => sum + p.weight, 0);
  let r = Math.random() * total;
  for (const entry of POOL) {
    r -= entry.weight;
    if (r <= 0) return entry.outcome;
  }
  return POOL[0].outcome;
}

export async function performLuckyDraw(
  userId: string,
): Promise<{ success: false; error: string } | { success: true; outcome: DrawOutcome; total: number }> {
  const spend = await spendHoney(userId, LUCKY_DRAW_COST, "Lucky Draw", { action: "lucky-draw" });
  if (!spend.success) {
    return { success: false, error: "Insufficient honey" };
  }

  const outcome = roll();
  let total = spend.total;

  switch (outcome.type) {
    case "honey": {
      const result = await earnHoneyDirect(userId, "LUCKY_DRAW", outcome.amount!, "Lucky Draw: " + outcome.label, {
        action: "lucky-draw",
      });
      total = result.total;
      break;
    }
    case "badge": {
      await prisma.userBadge.create({
        data: { userId, name: outcome.badgeName ?? "Lucky Badge", nameEn: "Lucky Badge", nameTh: "แบดจ์นำโชค" },
      });
      break;
    }
    case "trial": {
      const days = outcome.trialDays ?? 1;
      const expiresAt = new Date(Date.now() + days * 86_400_000);
      const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { tier: true } });
      if (user.tier === "FREE") {
        await prisma.user.update({
          where: { id: userId },
          data: { tier: "PRO", tierExpiresAt: expiresAt },
        });
      }
      break;
    }
  }

  return { success: true, outcome, total };
}
