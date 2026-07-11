/**
 * Single entry-point for billing/tier concerns:
 *
 *   import { getLimits, TIER_LIMITS, TIER_FEATURES, PLANS } from "@/lib/billing";
 *
 * Internal modules (`limits`, `features`, `plans`) own the data; this barrel
 * keeps imports tidy and prevents the previous "3 files, 1 concept" sprawl.
 *
 * NOTE: legacy paths `@/lib/tier`, `@/lib/tier-features`, `@/lib/plan-features`
 * are kept as thin re-exports for backwards compat. Prefer `@/lib/billing` in
 * new code.
 */

export * from "./limits";
export * from "./features";
export * from "./plans";
export * from "./schemas";
