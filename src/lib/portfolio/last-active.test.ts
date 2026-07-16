import { afterEach, describe, expect, it, vi } from "vitest"

import {
  PORTFOLIO_LAST_ACTIVE_COOKIE,
  PORTFOLIO_LAST_ACTIVE_MAX_AGE,
  clearLastActivePortfolioId,
  parseLastActivePortfolioId,
  readLastActivePortfolioId,
  setLastActivePortfolioId,
} from "./last-active"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("portfolio last-active preference", () => {
  it.each([undefined, null, "", "0", "-1", "1.5", "abc"])(
    "rejects an invalid id: %s",
    (value) => {
      expect(parseLastActivePortfolioId(value)).toBeNull()
    },
  )

  it("parses a positive safe integer", () => {
    expect(parseLastActivePortfolioId("42")).toBe(42)
  })

  it("reads the preference without being confused by other cookies", () => {
    vi.stubGlobal("document", {
      cookie: `theme=dark; ${PORTFOLIO_LAST_ACTIVE_COOKIE}=17; kuma-lang=TH`,
    })

    expect(readLastActivePortfolioId()).toBe(17)
  })

  it("writes a one-year, site-wide, lax cookie", () => {
    const documentStub = { cookie: "" }
    vi.stubGlobal("document", documentStub)

    setLastActivePortfolioId(23)

    expect(documentStub.cookie).toBe(
      `${PORTFOLIO_LAST_ACTIVE_COOKIE}=23; Path=/; Max-Age=${PORTFOLIO_LAST_ACTIVE_MAX_AGE}; SameSite=Lax`,
    )
  })

  it("expires the preference explicitly", () => {
    const documentStub = { cookie: "" }
    vi.stubGlobal("document", documentStub)

    clearLastActivePortfolioId()

    expect(documentStub.cookie).toBe(
      `${PORTFOLIO_LAST_ACTIVE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`,
    )
  })
})
