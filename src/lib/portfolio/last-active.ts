export const PORTFOLIO_LAST_ACTIVE_COOKIE = "portfolio-last-active"
export const PORTFOLIO_LAST_ACTIVE_MAX_AGE = 60 * 60 * 24 * 365

export function parseLastActivePortfolioId(
  value: string | null | undefined,
): number | null {
  if (!value || !/^\d+$/.test(value)) return null

  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export function readLastActivePortfolioId(): number | null {
  if (typeof document === "undefined") return null

  const prefix = `${PORTFOLIO_LAST_ACTIVE_COOKIE}=`
  const encodedValue = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length)

  if (!encodedValue) return null

  try {
    return parseLastActivePortfolioId(decodeURIComponent(encodedValue))
  } catch {
    return null
  }
}

/** Persisted per-browser after the portfolio has been validated as user-owned. */
export function setLastActivePortfolioId(id: number): void {
  if (typeof document === "undefined") return

  const safeId = parseLastActivePortfolioId(String(id))
  if (safeId == null) return

  document.cookie = `${PORTFOLIO_LAST_ACTIVE_COOKIE}=${safeId}; Path=/; Max-Age=${PORTFOLIO_LAST_ACTIVE_MAX_AGE}; SameSite=Lax`
}

export function clearLastActivePortfolioId(): void {
  if (typeof document === "undefined") return
  document.cookie = `${PORTFOLIO_LAST_ACTIVE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
}
