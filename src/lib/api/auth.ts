/**
 * Canonical auth-helper import for API routes — re-exports from `@/lib/auth` so
 * `route.ts` files pull auth from `@/lib/api/*` alongside the other API helpers
 * (api-handler, admin-helpers, request-body). Non-route code (server
 * components, actions) may import from `@/lib/auth` directly.
 */
export { getAuthUser, requireAuthUser } from "@/lib/auth";
