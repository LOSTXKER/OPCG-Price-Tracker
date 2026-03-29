/**
 * Thin wrapper around fetch for admin JSON API calls.
 * Handles Content-Type headers and JSON serialization.
 * Throws an error (with the server's error message when available) for non-2xx responses.
 */
export async function adminJsonFetch<T = unknown>(
  url: string,
  opts: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const { method = "POST", body, signal } = opts;
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const err = await res.json();
      if (err?.error) message = err.error;
    } catch { /* ignore parse errors */ }
    throw new Error(message);
  }
  return res.json();
}
