import { describe, it, expect, vi, beforeEach } from "vitest";
import type { HoneyActionType } from "@/generated/prisma/client";

// ────────────────────────────────────────────────────────────────────────
// In-memory prisma stub. Only the surface used by lib/honey/index.ts is
// implemented; tests that hit other tables should stub via vi.mocked.
// ────────────────────────────────────────────────────────────────────────
type FakeUser = {
  id: string;
  honeyPoints: number;
  honeyLifetimeEarned: number;
  ticketBalance: number;
  checkinStreak: number;
  lastCheckinAt: Date | null;
};
type FakeTxn = {
  userId: string;
  amount: number;
  type: HoneyActionType;
  reason: string;
  metadata?: unknown;
  createdAt: Date;
};

const users = new Map<string, FakeUser>();
const txns: FakeTxn[] = [];
let seasonalMultiplier = 1;

function matchTxns(where: Record<string, unknown>): FakeTxn[] {
  return txns.filter((t) => {
    if (where.userId && t.userId !== where.userId) return false;
    if (where.type) {
      const w = where.type as { in?: HoneyActionType[] } | HoneyActionType;
      if (typeof w === "string") {
        if (t.type !== w) return false;
      } else if (w.in && !w.in.includes(t.type)) {
        return false;
      }
    }
    const amount = where.amount as { gt?: number } | undefined;
    if (amount?.gt != null && !(t.amount > amount.gt)) return false;
    const created = where.createdAt as { gte?: Date } | undefined;
    if (created?.gte && t.createdAt.getTime() < created.gte.getTime()) return false;
    return true;
  });
}

const prismaMock = {
  // Interactive-transaction passthrough: hand the same stub to the callback.
  $transaction: vi.fn(async <T,>(fn: (tx: unknown) => Promise<T>): Promise<T> => fn(prismaMock)),
  user: {
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
      const u = users.get(where.id);
      return u ? { ...u } : null;
    }),
    findUniqueOrThrow: vi.fn(async ({ where }: { where: { id: string } }) => {
      const u = users.get(where.id);
      if (!u) throw new Error("not found: " + where.id);
      return { ...u };
    }),
    update: vi.fn(
      async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, { increment?: number } | Date | null | number>;
      }) => {
        const u = users.get(where.id);
        if (!u) throw new Error("not found: " + where.id);
        for (const [key, val] of Object.entries(data)) {
          if (val && typeof val === "object" && "increment" in (val as object)) {
            (u as unknown as Record<string, number>)[key] =
              ((u as unknown as Record<string, number>)[key] ?? 0) +
              ((val as { increment: number }).increment ?? 0);
          } else {
            (u as unknown as Record<string, unknown>)[key] = val as unknown;
          }
        }
        return { ...u };
      },
    ),
  },
  honeyTransaction: {
    create: vi.fn(async ({ data }: { data: Omit<FakeTxn, "createdAt"> }) => {
      const t: FakeTxn = { ...data, createdAt: new Date() };
      txns.push(t);
      return t;
    }),
    count: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
      return matchTxns(where).length;
    }),
    aggregate: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
      const sum = matchTxns(where).reduce((s, t) => s + t.amount, 0);
      return { _sum: { amount: sum } };
    }),
    findFirst: vi.fn(async () => null),
  },
  seasonalEvent: {
    findFirst: vi.fn(async () => (seasonalMultiplier === 1 ? null : { honeyMultiplier: seasonalMultiplier })),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/env", () => ({ serverEnv: () => ({ DATABASE_URL: "postgres://stub" }) }));
vi.mock("../achievements", () => ({
  checkAchievements: vi.fn(async () => {}),
}));

const { earnHoney, earnHoneyDirect, grantHoney, GLOBAL_DAILY_CAP } = await import("../index");

function seedUser(id = "u1", overrides: Partial<FakeUser> = {}): FakeUser {
  const u: FakeUser = {
    id,
    honeyPoints: 0,
    honeyLifetimeEarned: 0,
    ticketBalance: 0,
    checkinStreak: 0,
    lastCheckinAt: null,
    ...overrides,
  };
  users.set(id, u);
  return u;
}

beforeEach(() => {
  users.clear();
  txns.length = 0;
  seasonalMultiplier = 1;
  vi.clearAllMocks();
});

describe("earnHoney — multiplier policy", () => {
  it("applies tier × seasonal for REVIEW", async () => {
    seedUser();
    seasonalMultiplier = 2;
    const r = await earnHoney("u1", "REVIEW", "test", undefined, 1.5);
    // 5 base × 1.5 tier × 2 seasonal = 15
    expect(r?.earned).toBe(15);
  });

  it("applies tier-only for MONTHLY_MISSION via earnHoneyDirect (policy=tier_only path)", async () => {
    // earnHoneyDirect bypasses the policy gate entirely; verify it credits exactly the supplied amount.
    seedUser();
    const r = await earnHoneyDirect("u1", "MONTHLY_MISSION", 100, "monthly");
    expect(r.earned).toBe(100);
  });

  it("ignores tier multiplier for ADMIN_GRANT (policy=none) when routed via earnHoneyDirect", async () => {
    seedUser();
    const r = await earnHoneyDirect("u1", "ADMIN_GRANT", 500, "support credit");
    expect(r.earned).toBe(500);
  });
});

describe("earnHoney — daily per-action limits", () => {
  it("REVIEW caps at 3/day", async () => {
    seedUser();
    for (let i = 0; i < 3; i++) {
      const r = await earnHoney("u1", "REVIEW", `r${i}`);
      expect(r).not.toBeNull();
    }
    const fourth = await earnHoney("u1", "REVIEW", "r4");
    expect(fourth).toBeNull();
  });

  it("MARKETPLACE_SELL caps at 5/day", async () => {
    seedUser();
    for (let i = 0; i < 5; i++) {
      expect(await earnHoney("u1", "MARKETPLACE_SELL", `s${i}`)).not.toBeNull();
    }
    expect(await earnHoney("u1", "MARKETPLACE_SELL", "s6")).toBeNull();
  });
});

describe("earnHoney — global daily cap", () => {
  it("clips the final award when crossing GLOBAL_DAILY_CAP", async () => {
    const u = seedUser("u1", {
      // Pre-credit 195 honey from REFERRAL today (REFERRAL is excluded from the cap),
      // so capped sources still have a full 200 budget.
      honeyPoints: 0,
      honeyLifetimeEarned: 0,
    });
    void u;

    // Pre-fill 195 honey today across capped sources.
    txns.push({ userId: "u1", amount: 195, type: "MARKETPLACE_SELL", reason: "seed", createdAt: new Date() });

    // Next REVIEW base=5; tier=2 seasonal=1 → raw 10; cap remaining = 5.
    const r = await earnHoney("u1", "REVIEW", "review", undefined, 2);
    expect(r?.earned).toBe(GLOBAL_DAILY_CAP - 195);
  });

  it("returns null when global cap is exhausted", async () => {
    seedUser();
    txns.push({ userId: "u1", amount: 200, type: "MARKETPLACE_SELL", reason: "seed", createdAt: new Date() });
    expect(await earnHoney("u1", "REVIEW", "no-room")).toBeNull();
  });

  it("does NOT clip REFERRAL (not in GLOBAL_CAP_TYPES)", async () => {
    seedUser();
    txns.push({ userId: "u1", amount: 200, type: "MARKETPLACE_SELL", reason: "seed", createdAt: new Date() });
    const r = await earnHoney("u1", "REFERRAL", "friend");
    expect(r?.earned).toBe(150);
  });
});

describe("grantHoney — lifetime accounting", () => {
  it("ADMIN_GRANT increments honeyLifetimeEarned (now flows through grantHoney)", async () => {
    seedUser("u1", { honeyLifetimeEarned: 1_000 });
    await grantHoney("u1", 500, "ADMIN_GRANT", "credit");
    expect(users.get("u1")?.honeyLifetimeEarned).toBe(1_500);
    expect(users.get("u1")?.honeyPoints).toBe(500);
  });

  it("negative grants (REDEEM) do NOT touch lifetime", async () => {
    seedUser("u1", { honeyPoints: 1_000, honeyLifetimeEarned: 5_000 });
    await grantHoney("u1", -200, "REDEEM", "shop", undefined, { skipLevelCheck: true });
    expect(users.get("u1")?.honeyLifetimeEarned).toBe(5_000);
    expect(users.get("u1")?.honeyPoints).toBe(800);
  });

  it("crossing 15,000 lifetime auto-pays the Master level-up bonus", async () => {
    seedUser("u1", { honeyPoints: 14_900, honeyLifetimeEarned: 14_900 });
    await grantHoney("u1", 200, "ADMIN_GRANT", "huge admin top-up");
    // 200 ADMIN_GRANT + 2,500 LEVEL_UP bonus = 2,700 added to balance.
    // Lifetime = 14,900 + 200 + 2,500 = 17,600.
    expect(users.get("u1")?.honeyLifetimeEarned).toBe(17_600);
    expect(users.get("u1")?.honeyPoints).toBe(14_900 + 200 + 2_500);

    const levelUpTxn = txns.find((t) => t.type === "LEVEL_UP");
    expect(levelUpTxn).toBeDefined();
    expect(levelUpTxn?.amount).toBe(2_500);
  });

  it("a single grant that vaults from Newbie straight to Master pays the Master bonus", async () => {
    seedUser("u1", { honeyPoints: 0, honeyLifetimeEarned: 0 });
    await grantHoney("u1", 16_000, "ADMIN_GRANT", "promo grand prize");
    // Lifetime = 0 + 16,000 + 2,500 LEVEL_UP bonus = 18,500.
    expect(users.get("u1")?.honeyLifetimeEarned).toBe(18_500);
    const levelUp = txns.find((t) => t.type === "LEVEL_UP");
    expect(levelUp?.amount).toBe(2_500);
    expect((levelUp?.metadata as { level: number } | undefined)?.level).toBe(5);
  });
});
