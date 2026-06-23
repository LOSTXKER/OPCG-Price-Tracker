import { cronHandler } from "@/lib/api/cron-auth";
import { prisma } from "@/lib/db";
import { earnHoney, getHoneyMultiplier } from "@/lib/honey";

export const dynamic = "force-dynamic";

function getPreviousWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) - 7;
  d.setDate(diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const GET = cronHandler(async () => {
  const prevWeek = getPreviousWeekStart();

  const unresolved = await prisma.pricePrediction.findMany({
    where: { resolved: false, weekStart: prevWeek },
    include: {
      card: { select: { latestPriceJpy: true } },
      user: { select: { tier: true, tierExpiresAt: true } },
    },
  });

  let resolved = 0;
  let rewarded = 0;

  for (const pred of unresolved) {
    const currentPrice = pred.card.latestPriceJpy ?? 0;
    const wentUp = currentPrice > pred.priceAtPrediction;
    const wentDown = currentPrice < pred.priceAtPrediction;
    const correct =
      (pred.direction === "UP" && wentUp) ||
      (pred.direction === "DOWN" && wentDown);
    const willReward = correct && !pred.rewarded;

    if (willReward) {
      // Route through earnHoney so PRICE_PREDICTION picks up tier × seasonal
      // multipliers per the central policy. Returns null if the user hits
      // a daily/global cap, which is fine — we still mark `rewarded` so the
      // record isn't retried indefinitely.
      await earnHoney(
        pred.userId,
        "PRICE_PREDICTION",
        "Correct price prediction",
        { predictionId: pred.id, cardId: pred.cardId },
        getHoneyMultiplier(pred.user.tier, pred.user.tierExpiresAt),
      );
      rewarded++;
    }

    // One update per row — resolve, correctness, and reward flag together
    // (was two sequential updates on the same record).
    await prisma.pricePrediction.update({
      where: { id: pred.id },
      data: { resolved: true, correct, ...(willReward ? { rewarded: true } : {}) },
    });
    resolved++;
  }

  return { resolved, rewarded };
});
