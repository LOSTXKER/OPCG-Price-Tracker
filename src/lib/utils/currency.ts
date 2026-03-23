const DEFAULT_RATE = 0.296;

export function jpyToThb(jpy: number, rate?: number): number {
  return Math.round(jpy * (rate ?? DEFAULT_RATE) * 100) / 100;
}

export function thbToJpy(thb: number, rate?: number): number {
  const r = rate ?? DEFAULT_RATE;
  if (r === 0) return 0;
  return Math.round(thb / r);
}

export function formatJpy(amount: number): string {
  return `¥${amount.toLocaleString()}`;
}

export function formatThb(amount: number): string {
  return `${amount.toLocaleString()} ฿`;
}

export function formatPrice(jpy: number, rate?: number): { jpy: string; thb: string } {
  return {
    jpy: formatJpy(jpy),
    thb: formatThb(jpyToThb(jpy, rate)),
  };
}
