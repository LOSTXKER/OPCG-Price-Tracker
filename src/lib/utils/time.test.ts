import { describe, expect, it, vi } from "vitest"

import { localDateInputValue } from "./time"

describe("localDateInputValue", () => {
  it("uses the local calendar day instead of the UTC day", () => {
    const lateBangkokTime = new Date("2026-07-23T17:30:00.000Z")
    const offset = vi
      .spyOn(lateBangkokTime, "getTimezoneOffset")
      .mockReturnValue(-420)

    expect(localDateInputValue(lateBangkokTime)).toBe("2026-07-24")
    offset.mockRestore()
  })
})
