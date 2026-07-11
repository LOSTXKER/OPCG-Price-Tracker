import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  buildFeatureSections,
  isLifetime,
  isPlanCurrent,
  toPlanTier,
} from "@/lib/billing";

import { PlanCards } from "./plan-cards";
import { PlanFeatureComparison } from "./plan-feature-comparison";

const featureSections = buildFeatureSections();

describe("billing plan presentation", () => {
  it("maps lifetime subscriptions to their visible plan", () => {
    expect(toPlanTier("LIFETIME_PRO")).toBe("PRO");
    expect(toPlanTier("LIFETIME_PRO_PLUS")).toBe("PRO_PLUS");
    expect(isPlanCurrent("PRO", "LIFETIME_PRO")).toBe(true);
    expect(isLifetime("LIFETIME_PRO")).toBe(true);
    expect(isLifetime("LIFETIME_PRO_PLUS")).toBe(true);
    expect(isLifetime("PRO_PLUS")).toBe(false);
  });

  it("keeps pricing cards on yearly prices while preserving action slots", () => {
    const markup = renderToStaticMarkup(
      <PlanCards
        lang="TH"
        featureSections={featureSections}
        variant="pricing"
        billing="yearly"
        isCurrentPlan={() => false}
        renderAction={(plan) => <span>action-{plan.key}</span>}
      />,
    );

    expect(markup).toContain("฿990");
    expect(markup).toContain("฿1,990");
    expect(markup).toContain("ยอดนิยม");
    expect(markup).toContain("1 ปี");
    expect(markup).not.toContain("1 year");
    expect(markup).toContain("action-PRO_PLUS");
    expect(markup).toContain("md:grid-cols-3");
  });

  it("marks the current plan only on subscription cards and comparison", () => {
    const isCurrent = (planKey: "FREE" | "PRO" | "PRO_PLUS") =>
      isPlanCurrent(planKey, "LIFETIME_PRO");
    const cards = renderToStaticMarkup(
      <PlanCards
        lang="TH"
        featureSections={featureSections}
        variant="subscription"
        isCurrentPlan={isCurrent}
        renderAction={(_, current) => (current ? "current" : "upgrade")}
      />,
    );
    const comparison = renderToStaticMarkup(
      <PlanFeatureComparison
        lang="TH"
        featureSections={featureSections}
        variant="subscription"
        isCurrentPlan={isCurrent}
      />,
    );

    expect(cards).toContain("ring-2 ring-primary/40");
    expect(cards).toContain("current");
    expect(comparison).toContain("★");
    expect(comparison).not.toContain("sticky top-0");
  });

  it("keeps the pricing comparison header sticky on desktop", () => {
    const markup = renderToStaticMarkup(
      <PlanFeatureComparison
        lang="TH"
        featureSections={featureSections}
        variant="pricing"
        isCurrentPlan={() => false}
      />,
    );

    expect(markup).toContain("sticky top-0 z-10 bg-background");
    expect(markup).toContain("sm:hidden");
    expect(markup).toContain("hidden sm:block");
  });

  it("does not advertise marketplace entitlements before they are enforced", () => {
    const visibleKeys = buildFeatureSections().flatMap((section) =>
      section.rows.map((row) => row.key),
    );

    expect(visibleKeys).not.toEqual(
      expect.arrayContaining([
        "marketplaceFee",
        "listingBoost",
        "autoPricing",
        "bulkPriceLookup",
      ]),
    );
  });
});
