import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  setSparklines: vi.fn(),
  cleanup: undefined as (() => void) | undefined,
}));

vi.mock("react", () => ({
  useEffect: (effect: () => void | (() => void)) => {
    mocks.cleanup = effect() ?? undefined;
  },
  useState: () => [{}, mocks.setSparklines],
}));

vi.mock("@/lib/api/client", () => ({
  apiGet: mocks.apiGet,
}));

import { useSparklines as runSparklinesEffect } from "./use-sparklines";

describe("useSparklines", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cleanup = undefined;
  });

  it("fetches every unique id in batches of at most 50 and merges the responses", async () => {
    mocks.apiGet.mockImplementation(async (url: string) => {
      const ids = new URL(url, "https://meecard.test").searchParams
        .get("ids")!
        .split(",")
        .map(Number);
      return {
        sparklines: Object.fromEntries(ids.map((id) => [id, [id, id + 1]])),
      };
    });
    const cards = [
      ...Array.from({ length: 105 }, (_, index) => ({ id: index + 1 })),
      { id: 1 },
      { id: null },
    ];

    runSparklinesEffect(cards);

    await vi.waitFor(() => {
      expect(mocks.setSparklines).toHaveBeenCalledOnce();
    });
    expect(mocks.apiGet).toHaveBeenCalledTimes(3);

    const batches = mocks.apiGet.mock.calls.map(([url]) =>
      new URL(url as string, "https://meecard.test").searchParams
        .get("ids")!
        .split(",")
        .map(Number),
    );
    expect(batches.map((batch) => batch.length)).toEqual([50, 50, 5]);
    expect(batches.flat()).toEqual(
      Array.from({ length: 105 }, (_, index) => index + 1),
    );

    const signals = mocks.apiGet.mock.calls.map(([, signal]) =>
      signal as AbortSignal,
    );
    expect(signals.every((signal) => signal === signals[0])).toBe(true);
    expect(signals[0].aborted).toBe(false);
    expect(Object.keys(mocks.setSparklines.mock.calls[0][0])).toHaveLength(105);

    mocks.cleanup?.();
    expect(signals[0].aborted).toBe(true);
  });

  it("does not publish a response after the effect is aborted", async () => {
    let resolveRequest:
      | ((value: { sparklines: Record<number, number[]> }) => void)
      | undefined;
    mocks.apiGet.mockImplementation(
      () =>
        new Promise<{ sparklines: Record<number, number[]> }>((resolve) => {
          resolveRequest = resolve;
        }),
    );

    runSparklinesEffect([{ id: 7 }]);
    mocks.cleanup?.();
    resolveRequest?.({ sparklines: { 7: [100, 110] } });
    await Promise.resolve();
    await Promise.resolve();

    expect(mocks.setSparklines).not.toHaveBeenCalled();
  });
});
