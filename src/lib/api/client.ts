/**
 * Thin wrapper around fetch for client-side JSON API calls (user-facing
 * routes). Counterpart of `adminFetch` in `admin/admin-fetch.ts`.
 *
 * - Serializes JSON bodies and sets Content-Type.
 * - Parses the `{ error }` envelope on non-2xx and throws `ApiError` so
 *   callers can branch on `status` (401 → sign out, 403 → tier limit, ...).
 * - `apiTry` wraps a call for the fire-and-forget pattern where failures
 *   degrade to `null` instead of throwing (non-critical widgets).
 */

export class ApiError extends Error {
  readonly status: number;
  /** `"GET /api/..."` — which call failed. Set for every ensureOk throw. */
  readonly request?: string;

  constructor(status: number, message: string, request?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.request = request;
  }
}

type JsonRequestOptions = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export const DEFAULT_API_REQUEST_TIMEOUT_MS = 10_000;
export const DEFAULT_API_GET_TIMEOUT_MS = DEFAULT_API_REQUEST_TIMEOUT_MS;
export const DEFAULT_API_UPLOAD_TIMEOUT_MS = 30_000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  signal: AbortSignal | undefined,
  timeoutMs: number | undefined,
): Promise<Response> {
  const controller = timeoutMs ? new AbortController() : null;
  let timedOut = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const abortFromParent = () => controller?.abort(signal?.reason);
  if (controller && signal) {
    if (signal.aborted) abortFromParent();
    else signal.addEventListener("abort", abortFromParent, { once: true });
  }

  if (controller && timeoutMs) {
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
  }

  try {
    return await fetch(url, {
      ...init,
      signal: controller?.signal ?? signal,
    });
  } catch (error) {
    if (timedOut) throw new ApiError(408, "Request timed out");
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortFromParent);
  }
}

/** Throw ApiError (carrying the `{ error }` envelope) when a response is non-2xx. */
async function ensureOk(res: Response, request: string): Promise<void> {
  if (res.ok) return;
  let message = `Request failed: ${res.status}`;
  try {
    const err = (await res.json()) as { error?: string };
    if (err?.error) message = err.error;
  } catch {
    /* ignore parse errors */
  }
  // 5xx messages are always the generic apiHandler envelope ("Internal server
  // error") — useless in an error overlay that doesn't say WHICH call died
  // (we chased exactly that twice, 2026-08-07). Append the route so the
  // overlay/log self-identifies. 4xx messages stay clean: they are
  // user-meaningful strings that surfaces show verbatim.
  if (res.status >= 500) message = `${message} (${request})`;
  throw new ApiError(res.status, message, request);
}

export async function apiFetch<T = unknown>(
  url: string,
  opts: JsonRequestOptions = {},
): Promise<T> {
  const { method = "GET", body, signal, timeoutMs } = opts;
  const res = await fetchWithTimeout(
    url,
    {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    },
    signal,
    timeoutMs,
  );
  await ensureOk(res, `${method} ${url}`);
  return res.json() as Promise<T>;
}

/**
 * Send a multipart `FormData` body (file uploads). Unlike `apiFetch`, this does
 * NOT set Content-Type — the browser sets it with the correct multipart
 * boundary. Same ApiError-on-non-2xx contract; returns the parsed JSON body.
 */
export async function apiForm<T = unknown>(
  url: string,
  form: FormData,
  opts: { method?: string; signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<T> {
  const {
    method = "POST",
    signal,
    timeoutMs = DEFAULT_API_UPLOAD_TIMEOUT_MS,
  } = opts;
  const res = await fetchWithTimeout(
    url,
    { method, body: form },
    signal,
    timeoutMs,
  );
  await ensureOk(res, `${method} ${url}`);
  return res.json() as Promise<T>;
}

export function apiGet<T = unknown>(url: string, signal?: AbortSignal): Promise<T> {
  return apiFetch<T>(url, { signal, timeoutMs: DEFAULT_API_GET_TIMEOUT_MS });
}

export function apiPost<T = unknown>(url: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  return apiFetch<T>(url, {
    method: "POST",
    body,
    signal,
    timeoutMs: DEFAULT_API_REQUEST_TIMEOUT_MS,
  });
}

export function apiPatch<T = unknown>(url: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  return apiFetch<T>(url, {
    method: "PATCH",
    body,
    signal,
    timeoutMs: DEFAULT_API_REQUEST_TIMEOUT_MS,
  });
}

export function apiDelete<T = unknown>(url: string, signal?: AbortSignal): Promise<T> {
  return apiFetch<T>(url, {
    method: "DELETE",
    signal,
    timeoutMs: DEFAULT_API_REQUEST_TIMEOUT_MS,
  });
}

/** Resolve to `null` instead of throwing — for non-critical data fetches. */
export async function apiTry<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}
