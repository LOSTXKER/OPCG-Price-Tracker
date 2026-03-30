import Stripe from "stripe";
import { serverEnv } from "@/lib/env";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(serverEnv().STRIPE_SECRET_KEY!);
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

function buildPlans() {
  const env = serverEnv();
  return {
    PRO_MONTHLY: {
      priceId: env.STRIPE_PRO_MONTHLY_PRICE_ID!,
      tier: "PRO" as const,
      interval: "month" as const,
      amount: 129_00,
      label: "Pro — ฿129/mo",
    },
    PRO_YEARLY: {
      priceId: env.STRIPE_PRO_YEARLY_PRICE_ID!,
      tier: "PRO" as const,
      interval: "year" as const,
      amount: 990_00,
      label: "Pro — ฿990/yr",
    },
    PRO_PLUS_MONTHLY: {
      priceId: env.STRIPE_PRO_PLUS_MONTHLY_PRICE_ID!,
      tier: "PRO_PLUS" as const,
      interval: "month" as const,
      amount: 249_00,
      label: "Pro+ — ฿249/mo",
    },
    PRO_PLUS_YEARLY: {
      priceId: env.STRIPE_PRO_PLUS_YEARLY_PRICE_ID!,
      tier: "PRO_PLUS" as const,
      interval: "year" as const,
      amount: 1990_00,
      label: "Pro+ — ฿1,990/yr",
    },
  } as const;
}

let _plans: ReturnType<typeof buildPlans> | null = null;

export function getStripePlans() {
  if (!_plans) _plans = buildPlans();
  return _plans;
}

export const STRIPE_PLANS = new Proxy({} as ReturnType<typeof buildPlans>, {
  get(_, prop) {
    return (getStripePlans() as Record<string | symbol, unknown>)[prop];
  },
});

export type PlanKey = keyof typeof STRIPE_PLANS;

export function planByPriceId(priceId: string) {
  return Object.values(STRIPE_PLANS).find((p) => p.priceId === priceId) ?? null;
}
