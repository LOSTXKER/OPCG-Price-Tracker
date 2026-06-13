/**
 * Thin wrapper around fetch for client-side JSON API calls (user-facing
 * routes). Counterpart of `adminJsonFetch` in `admin-client.ts`.
 *
 * - Serializes JSON bodies and sets Content-Type.
 * - Parses the `{ error }` envelope on non-2xx and throws `ApiError` so
 *   callers can branch on `status` (401 → sign out, 403 → tier limit, ...).
 * - `apiTry` wraps a call for the fire-and-forget pattern where failures
 *   degrade to `null` instead of throwing (non-critical widgets).
 */

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type JsonRequestOptions = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
};

export async function apiFetch<T = unknown>(
  url: string,
  opts: JsonRequestOptions = {},
): Promise<T> {
  const { method = "GET", body, signal } = opts;
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const err = (await res.json()) as { error?: string };
      if (err?.error) message = err.error;
    } catch {
      /* ignore parse errors */
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export function apiGet<T = unknown>(url: string, signal?: AbortSignal): Promise<T> {
  return apiFetch<T>(url, { signal });
}

export function apiPost<T = unknown>(url: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  return apiFetch<T>(url, { method: "POST", body, signal });
}

export function apiPatch<T = unknown>(url: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  return apiFetch<T>(url, { method: "PATCH", body, signal });
}

export function apiDelete<T = unknown>(url: string, signal?: AbortSignal): Promise<T> {
  return apiFetch<T>(url, { method: "DELETE", signal });
}

/** Resolve to `null` instead of throwing — for non-critical data fetches. */
export async function apiTry<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}
