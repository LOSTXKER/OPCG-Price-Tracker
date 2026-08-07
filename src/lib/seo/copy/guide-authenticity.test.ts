import { describe, expect, it } from "vitest";

import {
  GUIDE_AUTHENTICITY_PUBLISHED_AT,
  GUIDE_AUTHENTICITY_UPDATED_AT,
  guideAuthFaq,
  guideAuthRedFlags,
  guideAuthUpdatedLabel,
} from "./guide-authenticity";

describe("guideAuthRedFlags", () => {
  it("links the below-market-price warning to the search page for every language", () => {
    for (const lang of ["TH", "EN", "JP"] as const) {
      const flags = guideAuthRedFlags(lang);
      const priceFlag = flags.find((f) => f.id === "price");
      expect(priceFlag).toBeDefined();
      expect(priceFlag!.link).toEqual(
        expect.objectContaining({ href: "/opcg/search" })
      );
      expect(priceFlag!.link!.label.length).toBeGreaterThan(0);
    }
  });

  it("leaves the other red flags as plain text with no link", () => {
    const flags = guideAuthRedFlags("TH");
    const others = flags.filter((f) => f.id !== "price");
    expect(others.length).toBeGreaterThan(0);
    for (const flag of others) {
      expect(flag.link).toBeUndefined();
      expect(flag.before.length).toBeGreaterThan(0);
    }
  });
});

describe("guideAuthFaq", () => {
  it("links the grading answer to /guide/rarities and the JP/EN answer to /guide/versions", () => {
    for (const lang of ["TH", "EN", "JP"] as const) {
      const items = guideAuthFaq(lang);
      const gradingLinked = items.some((i) => i.link?.href === "/guide/rarities");
      const versionsLinked = items.some((i) => i.link?.href === "/guide/versions");
      expect(gradingLinked).toBe(true);
      expect(versionsLinked).toBe(true);
    }
  });
});

describe("content revision dates", () => {
  it("exposes stable ISO date constants for Article JSON-LD", () => {
    expect(GUIDE_AUTHENTICITY_PUBLISHED_AT).toBe("2026-08-04");
    expect(GUIDE_AUTHENTICITY_UPDATED_AT).toBe("2026-08-07");
  });

  it("formats the updated label per language without throwing", () => {
    for (const lang of ["TH", "EN", "JP"] as const) {
      const label = guideAuthUpdatedLabel(lang);
      expect(label.length).toBeGreaterThan(0);
    }
  });
});
