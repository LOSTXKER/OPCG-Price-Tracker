import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ApiError,
  DEFAULT_API_GET_TIMEOUT_MS,
  DEFAULT_API_REQUEST_TIMEOUT_MS,
  DEFAULT_API_UPLOAD_TIMEOUT_MS,
  apiForm,
  apiGet,
  apiPost,
} from "./client";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("apiGet timeout", () => {
  it("aborts a read that exceeds the shared timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
      ),
    );

    const request = apiGet("/api/slow");
    const rejection = expect(request).rejects.toEqual(
      expect.objectContaining<Partial<ApiError>>({ status: 408 }),
    );

    await vi.advanceTimersByTimeAsync(DEFAULT_API_GET_TIMEOUT_MS);
    await rejection;
  });

  it("clears its timeout after a successful response", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(apiGet<{ ok: boolean }>("/api/fast")).resolves.toEqual({
      ok: true,
    });
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("mutation timeouts", () => {
  function stubPendingFetch() {
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
      ),
    );
  }

  it("aborts JSON mutations that exceed the shared timeout", async () => {
    vi.useFakeTimers();
    stubPendingFetch();

    const request = apiPost("/api/slow", { value: 1 });
    const rejection = expect(request).rejects.toEqual(
      expect.objectContaining<Partial<ApiError>>({ status: 408 }),
    );

    await vi.advanceTimersByTimeAsync(DEFAULT_API_REQUEST_TIMEOUT_MS);
    await rejection;
  });

  it("gives uploads a longer finite timeout", async () => {
    vi.useFakeTimers();
    stubPendingFetch();

    const request = apiForm("/api/upload", new FormData());
    const rejection = expect(request).rejects.toEqual(
      expect.objectContaining<Partial<ApiError>>({ status: 408 }),
    );

    await vi.advanceTimersByTimeAsync(DEFAULT_API_UPLOAD_TIMEOUT_MS - 1);
    expect(vi.mocked(fetch)).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1);
    await rejection;
  });

  it("preserves caller cancellation instead of reporting a timeout", async () => {
    stubPendingFetch();
    const controller = new AbortController();
    const request = apiPost("/api/cancelled", undefined, controller.signal);

    controller.abort();

    await expect(request).rejects.toMatchObject({ name: "AbortError" });
  });
});

describe("error identification", () => {
  function stubJsonError(status: number, body: unknown) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify(body), {
          status,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
  }

  it("names the failing call inside a 5xx message", async () => {
    // The generic 500 envelope is identical for every route — an overlay
    // showing bare "Internal server error" was untraceable (chased twice,
    // 2026-08-07). The route now rides along in the message.
    stubJsonError(500, { error: "Internal server error" });

    await expect(apiGet("/api/mystery")).rejects.toMatchObject({
      status: 500,
      request: "GET /api/mystery",
      message: "Internal server error (GET /api/mystery)",
    });
  });

  it("keeps 4xx messages verbatim — surfaces show them to users", async () => {
    stubJsonError(404, { error: "ไม่พบการ์ดใบนี้" });

    await expect(apiPost("/api/cards/nope", {})).rejects.toMatchObject({
      status: 404,
      request: "POST /api/cards/nope",
      message: "ไม่พบการ์ดใบนี้",
    });
  });
});
