import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthUser: vi.fn(),
  transaction: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/api/auth", () => ({
  requireAuthUser: mocks.requireAuthUser,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: mocks.transaction,
    portfolio: {
      findMany: mocks.findMany,
      count: mocks.count,
      create: mocks.create,
    },
  },
}));

import { GET, POST } from "./route";

const tx = {
  portfolio: {
    count: mocks.count,
    create: mocks.create,
  },
};

function authUser(
  tier: "FREE" | "PRO" | "PRO_PLUS" = "FREE",
  tierExpiresAt: Date | null = null,
) {
  return {
    ok: true,
    user: { id: "user_1", tier, tierExpiresAt },
  } as const;
}

describe("portfolio collection route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthUser.mockResolvedValue(authUser());
    mocks.transaction.mockImplementation(
      async (callback: (client: typeof tx) => unknown) => callback(tx),
    );
    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);
    mocks.create.mockResolvedValue({ id: 1, name: "Main", isPublic: false, items: [] });
  });

  it("returns the effective server tier and finite quotas", async () => {
    mocks.requireAuthUser.mockResolvedValue(
      authUser("PRO", new Date("2020-01-01T00:00:00.000Z")),
    );

    const response = await GET(
      new NextRequest("https://meecard.test/api/portfolio"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      portfolios: [],
      effectiveTier: "FREE",
      limits: { portfolioCount: 1, portfolioCards: 30 },
    });
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      }),
    );
  });

  it("serializes unlimited quotas as null", async () => {
    mocks.requireAuthUser.mockResolvedValue(
      authUser("PRO_PLUS", new Date("2099-01-01T00:00:00.000Z")),
    );

    const response = await GET(
      new NextRequest("https://meecard.test/api/portfolio"),
    );
    const body = await response.json();

    expect(body.limits).toEqual({ portfolioCount: null, portfolioCards: null });
  });

  it("rejects creation without privacy before writing", async () => {
    const response = await POST(
      new NextRequest("https://meecard.test/api/portfolio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Main" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("checks quota and creates inside the same serializable transaction", async () => {
    const response = await POST(
      new NextRequest("https://meecard.test/api/portfolio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Main", isPublic: false }),
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ isolationLevel: "Serializable" }),
    );
    expect(mocks.count).toHaveBeenCalledBefore(mocks.create);
  });

  it("returns 403 without creating when the server quota is full", async () => {
    mocks.count.mockResolvedValue(1);

    const response = await POST(
      new NextRequest("https://meecard.test/api/portfolio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Second", isPublic: true }),
      }),
    );

    expect(response.status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("retries a serializable write conflict before creating", async () => {
    mocks.transaction.mockRejectedValueOnce({ code: "P2034" });

    const response = await POST(
      new NextRequest("https://meecard.test/api/portfolio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Main", isPublic: false }),
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
    expect(mocks.create).toHaveBeenCalledTimes(1);
  });
});
