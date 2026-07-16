export function parsePortfolioRouteId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) ? id : null
}

export function getPortfolioIdAfterDelete(
  portfolioIds: readonly number[],
  deletedId: number,
): number | null {
  const currentIndex = portfolioIds.indexOf(deletedId)
  if (currentIndex < 0) {
    return portfolioIds.find((id) => id !== deletedId) ?? null
  }

  return (
    portfolioIds[currentIndex + 1] ??
    portfolioIds[currentIndex - 1] ??
    null
  )
}
