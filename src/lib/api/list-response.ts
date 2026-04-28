import { NextResponse } from "next/server";

/**
 * Standard envelope shape for paginated admin list endpoints.
 * Adopt this for new endpoints; legacy endpoints can pass extra fields
 * via the `extra` parameter so existing clients keep working.
 */
export interface PaginatedEnvelope<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedJsonInput<T, TExtra extends Record<string, unknown> = Record<string, never>> {
  rows: T[];
  total: number;
  page: number;
  limit: number;
  /**
   * Alias the `items` field to a custom name (e.g. `users`, `cards`, `mappings`)
   * so existing clients don't have to change. Use sparingly.
   */
  itemsKey?: string;
  /** Additional fields to merge into the response (e.g. counts, stats). */
  extra?: TExtra;
}

/**
 * Build a standardized JSON response for paginated lists.
 *
 * Always includes:
 *   - items (or alias) — the rows
 *   - total            — total matching count (across pages)
 *   - page, limit      — echo of the input pagination
 *   - totalPages       — ceil(total / limit), at least 1
 *   - hasMore          — true if there are more pages after this one
 *
 * Extra fields (e.g. `stats`, `counts`, `sets`) can be merged via `extra`.
 */
export function paginatedJson<T, TExtra extends Record<string, unknown> = Record<string, never>>(
  input: PaginatedJsonInput<T, TExtra>,
): NextResponse {
  const { rows, total, page, limit, itemsKey = "items", extra } = input;
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
  const hasMore = page < totalPages;
  const body = {
    [itemsKey]: rows,
    total,
    page,
    limit,
    totalPages,
    hasMore,
    ...(extra ?? {}),
  } as Record<string, unknown>;
  return NextResponse.json(body);
}
