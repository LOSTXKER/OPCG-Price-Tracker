import { z } from "zod";

export const CheckoutPlanSchema = z.enum([
  "PRO_MONTHLY",
  "PRO_YEARLY",
  "PRO_PLUS_MONTHLY",
  "PRO_PLUS_YEARLY",
]);

export const CheckoutRequestSchema = z.object({
  plan: CheckoutPlanSchema,
});

export type CheckoutPlanKey = z.infer<typeof CheckoutPlanSchema>;

export function checkoutPlanFor(
  tier: "PRO" | "PRO_PLUS",
  billing: "monthly" | "yearly",
): CheckoutPlanKey {
  if (tier === "PRO_PLUS") {
    return billing === "monthly" ? "PRO_PLUS_MONTHLY" : "PRO_PLUS_YEARLY";
  }
  return billing === "monthly" ? "PRO_MONTHLY" : "PRO_YEARLY";
}

export function parseCheckoutPlan(value: string | null): CheckoutPlanKey | null {
  const parsed = CheckoutPlanSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
