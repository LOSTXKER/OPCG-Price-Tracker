import { toast } from "sonner";

/**
 * Shared admin JSON fetch helper — the canonical client wrapper for
 * `/api/admin/*` routes.
 *
 * - GET is the default method (use `method: "POST"` etc. when mutating)
 * - Optional `toastOnError` to surface errors via sonner with a single line
 * - Optional `toastOnSuccess` for fire-and-forget mutations
 * - Always parses `{ error }` shape on non-2xx and throws Error(message)
 */
export interface AdminFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  toastOnError?: boolean | string;
  toastOnSuccess?: string;
}

export async function adminFetch<T = unknown>(
  url: string,
  opts: AdminFetchOptions = {},
): Promise<T> {
  const { method = "GET", body, signal, toastOnError, toastOnSuccess } = opts;

  const init: RequestInit = { method, signal };
  if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    const message = err instanceof Error ? err.message : "Network error";
    if (toastOnError) {
      toast.error(typeof toastOnError === "string" ? toastOnError : message);
    }
    throw new Error(message);
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const errBody = await res.json();
      if (errBody?.error) message = errBody.error;
    } catch {
      // ignore JSON parse errors
    }
    if (toastOnError) {
      toast.error(typeof toastOnError === "string" ? toastOnError : message);
    }
    throw new Error(message);
  }

  // 204 / empty body
  if (res.status === 204) {
    if (toastOnSuccess) toast.success(toastOnSuccess);
    return undefined as T;
  }

  const data = (await res.json()) as T;
  if (toastOnSuccess) toast.success(toastOnSuccess);
  return data;
}

/**
 * Admin counterpart of `apiForm` — send a multipart `FormData` body (file
 * uploads). Skips Content-Type so the browser sets the multipart boundary.
 * Same `{ error }`-on-non-2xx contract and optional toasts as `adminFetch`.
 */
export async function adminForm<T = unknown>(
  url: string,
  form: FormData,
  opts: Omit<AdminFetchOptions, "method" | "body"> & { method?: "POST" | "PUT" | "PATCH" } = {},
): Promise<T> {
  const { method = "POST", signal, toastOnError, toastOnSuccess } = opts;

  let res: Response;
  try {
    res = await fetch(url, { method, body: form, signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    const message = err instanceof Error ? err.message : "Network error";
    if (toastOnError) {
      toast.error(typeof toastOnError === "string" ? toastOnError : message);
    }
    throw new Error(message);
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const errBody = await res.json();
      if (errBody?.error) message = errBody.error;
    } catch {
      // ignore JSON parse errors
    }
    if (toastOnError) {
      toast.error(typeof toastOnError === "string" ? toastOnError : message);
    }
    throw new Error(message);
  }

  const data = (await res.json()) as T;
  if (toastOnSuccess) toast.success(toastOnSuccess);
  return data;
}

/**
 * Build a URLSearchParams string from a plain object.
 * Skips `null`, `undefined`, empty string, and `false` (so booleans only appear when true).
 * Numbers are coerced via String(); arrays are joined with `,`.
 */
export function buildAdminQuery(
  params: Record<string, string | number | boolean | string[] | null | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "" || value === false) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      sp.set(key, value.join(","));
    } else {
      sp.set(key, String(value));
    }
  }
  return sp.toString();
}
