export function isParallelCard(name: string, rarity: string): boolean {
  return name.includes("パラレル") || rarity.startsWith("P-");
}
