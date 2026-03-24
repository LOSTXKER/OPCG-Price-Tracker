export function rarityGlowClass(_rarity: string): string {
  return ""
}

export function rarityBorderClass(rarity: string): string {
  const upper = rarity.toUpperCase()
  if (upper === "SEC" || upper === "P-SEC" || upper === "SP") return "border-l-2 border-l-gold"
  if (upper === "SR" || upper === "P-SR") return "border-l-2 border-l-purple-500"
  if (upper === "R" || upper === "P-R") return "border-l-2 border-l-blue-500"
  return ""
}
