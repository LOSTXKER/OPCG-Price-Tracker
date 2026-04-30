import "server-only";
import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { getAdminConfig } from "@/lib/admin/config";

/**
 * Server-side helpers for the `marketplace_enabled` admin flag.
 *
 * The marketplace ships disabled (see `ADMIN_CONFIG_DEFAULTS.marketplaceEnabled`)
 * and admins flip it on from `/admin/config` once the storefront is ready.
 * Callers fall into three buckets:
 *
 * - Server components / layouts (`/marketplace/*`, `/seller/*`, `/orders/*`)
 *   call `assertMarketplaceEnabled()` and let it `notFound()` when the flag is
 *   off — visitors see the same 404 they'd see if the route didn't exist.
 * - API routes under `/api/listings/*`, `/api/orders/*`, etc. call
 *   `guardMarketplaceApi()` and early-return its 404 response.
 * - Internal logic that only needs the boolean (e.g. honey mission gating in
 *   `lib/honey/missions.ts`) calls `isMarketplaceEnabled()`.
 */

/** Resolve the current `marketplaceEnabled` flag from the cached admin config. */
export async function isMarketplaceEnabled(): Promise<boolean> {
  const config = await getAdminConfig();
  return config.marketplaceEnabled;
}

/**
 * Use inside `app/**` server components/layouts. When the marketplace is
 * disabled this throws `notFound()`, which Next.js renders as the standard
 * 404 page — keeping the storefront invisible to users until launch.
 */
export async function assertMarketplaceEnabled(): Promise<void> {
  if (!(await isMarketplaceEnabled())) {
    notFound();
  }
}

/**
 * Use at the top of marketplace API route handlers. Returns a 404 response
 * when the flag is off (to early-return), or `null` when the route should
 * proceed. Mirrors `requireAuthUser()`'s `{ ok, response }` pattern but only
 * needs the response since the success case carries no data.
 */
export async function guardMarketplaceApi(): Promise<NextResponse | null> {
  if (await isMarketplaceEnabled()) return null;
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
