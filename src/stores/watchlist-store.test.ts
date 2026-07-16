import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useWatchlistStore } from "./watchlist-store";

beforeEach(() => {
  useWatchlistStore.setState(useWatchlistStore.getInitialState(), true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("watchlist store synchronization", () => {
  it("copies an authoritative ID snapshot and marks it loaded", () => {
    const source = new Set([4, 4, 9]);
    useWatchlistStore.setState({ loading: true, limitHit: true });

    useWatchlistStore.getState().syncIds(source);
    source.add(12);

    const state = useWatchlistStore.getState();
    expect([...state.ids]).toEqual([4, 9]);
    expect(state.loaded).toBe(true);
    expect(state.loading).toBe(false);
    expect(state.limitHit).toBe(true);
    expect(state.has(12)).toBe(false);
  });

  it("keeps load idempotent after an authoritative sync", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ items: [{ cardId: 99 }] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    useWatchlistStore.getState().syncIds([1, 2]);
    await useWatchlistStore.getState().load();

    expect(fetchMock).not.toHaveBeenCalled();
    expect([...useWatchlistStore.getState().ids]).toEqual([1, 2]);
  });

  it("does not let an older load overwrite a newer authoritative sync", async () => {
    let resolveFetch!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );

    const pendingLoad = useWatchlistStore.getState().load();
    useWatchlistStore.getState().syncIds([1, 2]);
    resolveFetch(jsonResponse({ items: [{ cardId: 99 }] }));
    await pendingLoad;

    const state = useWatchlistStore.getState();
    expect([...state.ids]).toEqual([1, 2]);
    expect(state.loaded).toBe(true);
    expect(state.loading).toBe(false);
  });

  it("still loads from the API and toggles IDs optimistically", async () => {
    const fetchMock = vi.fn(
      async (_url: string | URL | Request, init?: RequestInit) => {
        if ((init?.method ?? "GET") === "GET") {
          return jsonResponse({ items: [{ cardId: 7 }, { cardId: 8 }] });
        }
        return jsonResponse({ ok: true });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    await useWatchlistStore.getState().load();
    expect([...useWatchlistStore.getState().ids]).toEqual([7, 8]);

    await useWatchlistStore.getState().toggle(7);
    expect(useWatchlistStore.getState().has(7)).toBe(false);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/watchlist?cardId=7",
      expect.objectContaining({ method: "DELETE" }),
    );

    await useWatchlistStore.getState().toggle(9);
    expect(useWatchlistStore.getState().has(9)).toBe(true);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/watchlist",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("rolls an optimistic toggle back when the mutation fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: "offline" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    useWatchlistStore.getState().syncIds([7]);

    await useWatchlistStore.getState().toggle(7);

    expect(useWatchlistStore.getState().has(7)).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
