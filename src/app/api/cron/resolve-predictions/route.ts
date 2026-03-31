import { cronHandler } from "@/lib/api/cron-auth";
import { prisma } from "@/lib/db";
import { earnHoneyDirect } from "@/lib/honey";

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
    include: { card: { select: { latestPriceJpy: true } } },
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

    await prisma.pricePrediction.update({
      where: { id: pred.id },
      data: { resolved: true, correct },
    });
    resolved++;

    if (correct && !pred.rewarded) {
      await earnHoneyDirect(pred.userId, "PRICE_PREDICTION", 20, "Correct price prediction", {
        predictionId: pred.id,
        cardId: pred.cardId,
      });
      await prisma.pricePrediction.update({
        where: { id: pred.id },
        data: { rewarded: true },
      });
      rewarded++;
    }
  }

  return { resolved, rewarded };
});
