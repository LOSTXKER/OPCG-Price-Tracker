export function calculatePriceChange(
  currentPrice: number,
  previousPrice: number
): { amount: number; percentage: number } {
  const amount = currentPrice - previousPrice;
  const percentage =
    previousPrice === 0 ? 0 : (amount / previousPrice) * 100;
  return {
    amount,
    percentage: Math.round(percentage * 100) / 100,
  };
}

export function formatPriceChange(percentage: number): string {
  const sign = percentage > 0 ? "+" : "";
  return `${sign}${percentage.toFixed(1)}%`;
}

export function getPriceChangeColor(percentage: number): "up" | "down" | "neutral" {
  if (percentage > 0) return "up";
  if (percentage < 0) return "down";
  return "neutral";
}
