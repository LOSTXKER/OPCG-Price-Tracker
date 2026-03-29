import { NextRequest, NextResponse } from "next/server";
import { MAX_LISTING_QUANTITY, MIN_LISTING_QUANTITY } from "@/lib/constants/ui";

/**
 * Safely parse the JSON body of a request.
 * Returns `{ ok: true, body }` on success or `{ ok: false, response }` with a 400 error response.
 */
export async function parseJsonBody<T = Record<string, unknown>>(
  request: NextRequest,
): Promise<{ ok: true; body: T } | { ok: false; response: NextResponse }> {
  try {
    const body = (await request.json()) as T;
    return { ok: true, body };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }
}

/**
 * Validate a listing/portfolio quantity value.
 * Returns the integer on success or a 400 NextResponse on failure.
 */
export function parseListingQuantity(
  raw: unknown,
): { ok: true; value: number } | { ok: false; response: NextResponse } {
  const qty = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(qty) || qty < MIN_LISTING_QUANTITY || qty > MAX_LISTING_QUANTITY) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `quantity must be an integer from ${MIN_LISTING_QUANTITY} to ${MAX_LISTING_QUANTITY}` },
        { status: 400 },
      ),
    };
  }
  return { ok: true, value: qty };
}

/**
 * Parse pagination params from URLSearchParams.
 * Clamps page ≥ 1 and limit to [1, maxLimit].
 */
export function parsePageLimit(
  sp: URLSearchParams,
  { defaultLimit = 20, maxLimit = 100 }: { defaultLimit?: number; maxLimit?: number } = {},
): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(sp.get("limit") || String(defaultLimit), 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}
