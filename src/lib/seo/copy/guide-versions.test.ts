import { describe, expect, it } from "vitest";

import {
  GUIDE_VERSIONS_PUBLISHED_AT,
  GUIDE_VERSIONS_UPDATED_AT,
  guideVersionsFaq,
  guideVersionsPriceBody,
  guideVersionsThaiBody,
  guideVersionsThaiHeading,
  guideVersionsUpdatedLabel,
} from "./guide-versions";

describe("guideVersionsPriceBody", () => {
  it("links the 'every price on this site' sentence to /opcg/sets for every language", () => {
    for (const lang of ["TH", "EN", "JP"] as const) {
      const paragraphs = guideVersionsPriceBody(lang);
      const sourceParagraph = paragraphs.find((p) => p.id === "source");
      expect(sourceParagraph).toBeDefined();
      expect(sourceParagraph!.link).toEqual(
        expect.objectContaining({ href: "/opcg/sets" })
      );
    }
  });

  it("leaves the remaining paragraphs as plain text", () => {
    const paragraphs = guideVersionsPriceBody("TH");
    const others = paragraphs.filter((p) => p.id !== "source");
    expect(others.length).toBeGreaterThan(0);
    for (const paragraph of others) {
      expect(paragraph.link).toBeUndefined();
    }
  });
});

describe("guideVersionsThaiBody / guideVersionsThaiHeading", () => {
  it("still states there is no Thai-language printing (fact must not regress)", () => {
    const body = guideVersionsThaiBody("TH").join(" ");
    expect(body).toMatch(/ยังไม่มีฉบับที่พิมพ์เป็นภาษาไทย/);
  });

  it("names KIDZ & KITZ as the official Thailand distributor", () => {
    const body = guideVersionsThaiBody("TH").join(" ");
    expect(body).toContain("KIDZ & KITZ");
  });

  it("renders a non-empty heading for every language", () => {
    for (const lang of ["TH", "EN", "JP"] as const) {
      expect(guideVersionsThaiHeading(lang).length).toBeGreaterThan(0);
      expect(guideVersionsThaiBody(lang).length).toBeGreaterThan(0);
    }
  });
});

describe("guideVersionsFaq", () => {
  it("includes a short Thai-language FAQ answer that does not claim a Thai printing exists", () => {
    const items = guideVersionsFaq("TH");
    const thaiLangFaq = items.find((i) => i.question === "การ์ดวันพีชมีภาษาไทยไหม?");
    expect(thaiLangFaq).toBeDefined();
    expect(thaiLangFaq!.answer).toContain("ยังไม่มี");
    expect(thaiLangFaq!.answer).toContain("KIDZ & KITZ");
  });

  it("links the price FAQ answer to /opcg/sets", () => {
    for (const lang of ["TH", "EN", "JP"] as const) {
      const items = guideVersionsFaq(lang);
      const priceLinked = items.some((i) => i.link?.href === "/opcg/sets");
      expect(priceLinked).toBe(true);
    }
  });
});

describe("content revision dates", () => {
  it("exposes stable ISO date constants for Article JSON-LD", () => {
    expect(GUIDE_VERSIONS_PUBLISHED_AT).toBe("2026-08-04");
    expect(GUIDE_VERSIONS_UPDATED_AT).toBe("2026-08-07");
  });

  it("formats the updated label per language without throwing", () => {
    for (const lang of ["TH", "EN", "JP"] as const) {
      expect(guideVersionsUpdatedLabel(lang).length).toBeGreaterThan(0);
    }
  });
});
