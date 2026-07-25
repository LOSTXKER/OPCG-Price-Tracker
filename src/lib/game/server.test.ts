import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  cookies: vi.fn(),
}))

vi.mock("next/headers", () => ({
  headers: mocks.headers,
  cookies: mocks.cookies,
}))

import { getServerGame, getServerGameConfig } from "./server"

function mockRequestScope({
  header,
  cookie,
}: {
  header?: string
  cookie?: string
}) {
  mocks.headers.mockResolvedValue({
    get: vi.fn(() => header ?? null),
  })
  mocks.cookies.mockResolvedValue({
    get: vi.fn(() => (cookie == null ? undefined : { value: cookie })),
  })
}

describe("server game resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequestScope({})
  })

  it("preserves the aggregate all request header", async () => {
    mockRequestScope({ header: "all", cookie: "pokemon" })

    await expect(getServerGame()).resolves.toBe("all")
    expect(mocks.cookies).not.toHaveBeenCalled()
  })

  it("accepts the launch-ready OPCG request header", async () => {
    mockRequestScope({ header: "opcg", cookie: "pokemon" })

    await expect(getServerGame()).resolves.toBe("opcg")
    expect(mocks.cookies).not.toHaveBeenCalled()
  })

  it.each([
    ["pokemon", "opcg", "opcg"],
    ["unknown", "opcg", "opcg"],
    ["pokemon", undefined, "opcg"],
    ["unknown", undefined, "opcg"],
  ])(
    "rejects request header %s and falls back through cookie %s",
    async (header, cookie, expected) => {
      mockRequestScope({ header, cookie })

      await expect(getServerGame()).resolves.toBe(expected)
      expect(mocks.cookies).toHaveBeenCalledOnce()
    },
  )

  it.each(["pokemon", "unknown"])(
    "falls back to OPCG for stale cookie %s",
    async (cookie) => {
      mockRequestScope({ cookie })

      await expect(getServerGame()).resolves.toBe("opcg")
    },
  )

  it("never returns a roadmap config from stale request scope", async () => {
    mockRequestScope({ header: "pokemon", cookie: "pokemon" })

    const config = await getServerGameConfig()

    expect(config?.slug).toBe("opcg")
    expect(config?.slug).not.toBe("pokemon")
  })
})
