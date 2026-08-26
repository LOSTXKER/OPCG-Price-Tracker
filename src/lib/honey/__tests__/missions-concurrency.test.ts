import { beforeEach, describe, expect, it, vi } from "vitest";

const { transactionMock, userMissionPeriodMock } = vi.hoisted(() => ({
  transactionMock: vi.fn(),
  userMissionPeriodMock: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: transactionMock,
    userMissionPeriod: userMissionPeriodMock,
  },
}));

vi.mock("../index", () => ({
  earnHoneyDirect: vi.fn(),
  getHoneyMultiplier: vi.fn(() => 1),
}));

vi.mock("@/lib/users/entitlements", () => ({
  incrementEntitlement: vi.fn(),
}));

vi.mock("@/lib/marketplace/feature-flag", () => ({
  isMarketplaceEnabled: vi.fn(async () => false),
}));

vi.mock("../mission-resolver", () => ({
  resolveDailyMissions: vi.fn(async () => []),
  matchConditionPath: vi.fn(() => false),
  getActiveBonusRules: vi.fn(async () => []),
}));

const {
  getOrCreateMission,
  getOrCreateMonthlyMissions,
  trackMissionByPath,
} = await import("../missions");

function missionRow(
  cadence: "DAILY" | "MONTHLY",
  periodKey: string,
  tasks: unknown[] = [],
) {
  return {
    id: cadence === "DAILY" ? 1 : 2,
    userId: "user-1",
    cadence,
    periodKey,
    tasks,
    progress: 0,
    completed: false,
    perfectDay: false,
    bonusClaimed: false,
    createdAt: new Date("2026-08-26T00:00:00.000Z"),
    updatedAt: new Date("2026-08-26T00:00:00.000Z"),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  transactionMock.mockReset();
  for (const mock of Object.values(userMissionPeriodMock)) mock.mockReset();
  vi.useRealTimers();
});

describe("mission period get-or-create concurrency", () => {
  it("returns the daily row created by a concurrent request after P2002", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-26T12:00:00.000+07:00"));
    const winner = missionRow("DAILY", "2026-08-26", [
      { id: "check_price", done: false, reward: 5, claimed: false },
    ]);

    userMissionPeriodMock.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue(winner);
    userMissionPeriodMock.create
      .mockResolvedValueOnce(winner)
      .mockRejectedValueOnce({ code: "P2002" });

    const rows = await Promise.all([
      getOrCreateMission("user-1"),
      getOrCreateMission("user-1"),
    ]);

    expect(rows).toEqual([
      expect.objectContaining({ id: winner.id, date: winner.periodKey }),
      expect.objectContaining({ id: winner.id, date: winner.periodKey }),
    ]);
    expect(userMissionPeriodMock.findUnique).toHaveBeenNthCalledWith(3, {
      where: {
        userId_cadence_periodKey: {
          userId: "user-1",
          cadence: "DAILY",
          periodKey: "2026-08-26",
        },
      },
    });
  });

  it("returns the monthly row created by a concurrent request after P2002", async () => {
    const winner = missionRow("MONTHLY", "2026-08", [
      { id: "explore_sets", done: false, claimed: false, progress: 0, target: 15 },
    ]);

    userMissionPeriodMock.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue(winner);
    userMissionPeriodMock.create
      .mockResolvedValueOnce(winner)
      .mockRejectedValueOnce({ code: "P2002" });

    const rows = await Promise.all([
      getOrCreateMonthlyMissions("user-1", "2026-08"),
      getOrCreateMonthlyMissions("user-1", "2026-08"),
    ]);

    expect(rows).toEqual([
      expect.objectContaining({ id: winner.id, month: winner.periodKey }),
      expect.objectContaining({ id: winner.id, month: winner.periodKey }),
    ]);
    expect(userMissionPeriodMock.findUnique).toHaveBeenNthCalledWith(3, {
      where: {
        userId_cadence_periodKey: {
          userId: "user-1",
          cadence: "MONTHLY",
          periodKey: "2026-08",
        },
      },
    });
  });

  it("does not hide unrelated create failures", async () => {
    const failure = new Error("database unavailable");
    userMissionPeriodMock.findUnique.mockResolvedValue(null);
    userMissionPeriodMock.create.mockRejectedValue(failure);

    await expect(getOrCreateMonthlyMissions("user-1", "2026-08")).rejects.toBe(failure);
    expect(userMissionPeriodMock.findUnique).toHaveBeenCalledOnce();
  });

  it("retries a serializable path-track after P2034", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-26T12:00:00.000+07:00"));
    const existing = missionRow("DAILY", "2026-08-26", [
      { id: "browse_trending", done: false, reward: 5, claimed: false },
    ]);
    const updated = {
      ...existing,
      tasks: [{ id: "browse_trending", done: true, reward: 5, claimed: false }],
      progress: 1,
      completed: true,
      perfectDay: true,
    };

    userMissionPeriodMock.findUnique.mockResolvedValue(existing);
    userMissionPeriodMock.update.mockResolvedValue(updated);
    transactionMock
      .mockRejectedValueOnce({ code: "P2034" })
      .mockImplementationOnce(async (operation) =>
        operation({ userMissionPeriod: userMissionPeriodMock }),
      );

    await expect(trackMissionByPath("user-1", "/trending")).resolves.toEqual(updated);
    expect(transactionMock).toHaveBeenCalledTimes(2);
    expect(transactionMock).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      { isolationLevel: "Serializable" },
    );
  });

  it("stops after three serializable write conflicts", async () => {
    const conflict = { code: "P2034" };
    const existing = missionRow("DAILY", "2026-08-26", [
      { id: "browse_trending", done: false, reward: 5, claimed: false },
    ]);
    userMissionPeriodMock.findUnique.mockResolvedValue(existing);
    transactionMock.mockRejectedValue(conflict);

    await expect(trackMissionByPath("user-1", "/trending")).rejects.toBe(conflict);
    expect(transactionMock).toHaveBeenCalledTimes(3);
  });

  it("does not retry an unrelated transaction failure", async () => {
    const failure = new Error("connection lost");
    const existing = missionRow("DAILY", "2026-08-26", [
      { id: "browse_trending", done: false, reward: 5, claimed: false },
    ]);
    userMissionPeriodMock.findUnique.mockResolvedValue(existing);
    transactionMock.mockRejectedValue(failure);

    await expect(trackMissionByPath("user-1", "/trending")).rejects.toBe(failure);
    expect(transactionMock).toHaveBeenCalledOnce();
  });
});
