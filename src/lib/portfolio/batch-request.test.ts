import { describe, expect, it } from "vitest"

import {
  clearPortfolioBatchRequestScope,
  createScopedPortfolioBatchKey,
} from "./batch-request"

describe("portfolio batch request sessions", () => {
  it("reuses keys only inside the same dialog session", () => {
    const payload = '{"portfolioId":1}'

    expect(createScopedPortfolioBatchKey("session-a", payload)).toBe(
      createScopedPortfolioBatchKey("session-a", payload),
    )
    expect(createScopedPortfolioBatchKey("session-a", payload)).not.toBe(
      createScopedPortfolioBatchKey("session-b", payload),
    )
  })

  it("clears abandoned retries without touching another session", () => {
    const sessionAKey = createScopedPortfolioBatchKey("session-a", "payload-a")
    const sessionASecondKey = createScopedPortfolioBatchKey(
      "session-a",
      "payload-b",
    )
    const sessionBKey = createScopedPortfolioBatchKey("session-b", "payload-a")
    const requestIds = new Map([
      [sessionAKey, "request-a"],
      [sessionASecondKey, "request-a-2"],
      [sessionBKey, "request-b"],
    ])

    clearPortfolioBatchRequestScope(requestIds, "session-a")

    expect([...requestIds.entries()]).toEqual([[sessionBKey, "request-b"]])
  })
})
