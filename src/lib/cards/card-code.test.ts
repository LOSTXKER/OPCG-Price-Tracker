import { describe, expect, it } from "vitest";

import { baseCardCode, cardVariant, formatCardCodeLabel } from "./card-code";

/**
 * Owner ruling (เบส): the internal `_pN` / `_rN` printing suffix is a database
 * key, not something Bandai prints on a card, so it must never reach a reader.
 * These tests pin the helper every reader-facing surface routes through.
 *
 * Shapes below are the real ones in the catalogue (checked 2026-08-08 against
 * the live DB: 3,838 cards — 1,082 `_pN`, 362 `_rN`, prefixes OP/ST/EB/P/PRB).
 */
describe("baseCardCode", () => {
  it.each([
    ["OP09-001_p1", "OP09-001"],
    ["OP13-118_p3", "OP13-118"],
    ["OP05-119_p7", "OP05-119"],
    ["ST01-012_p1", "ST01-012"],
    ["EB01-006_r1", "EB01-006"],
    ["P-014_p2", "P-014"],
    ["P-029_r2", "P-029"],
    ["PRB02-006_p2", "PRB02-006"],
  ])("strips the printing suffix: %s → %s", (input, expected) => {
    expect(baseCardCode(input)).toBe(expected);
  });

  it.each(["OP09-001", "ST01-001", "EB01-001", "P-014", "PRB02-006"])(
    "leaves a standard print untouched: %s",
    (code) => {
      expect(baseCardCode(code)).toBe(code);
    },
  );

  it("only strips a trailing suffix, never a dash or an inner underscore", () => {
    // The set prefix itself contains a dash — stripping greedily would turn
    // every code into "OP09".
    expect(baseCardCode("OP09-001")).toBe("OP09-001");
    expect(baseCardCode("OP09-001_p1_p2")).toBe("OP09-001_p1");
  });
});

describe("cardVariant", () => {
  it("reads the printing kind and its index", () => {
    expect(cardVariant("OP09-001_p2")).toEqual({ kind: "parallel", index: 2 });
    expect(cardVariant("EB01-006_r1")).toEqual({ kind: "reprint", index: 1 });
  });

  it("returns null for a standard print", () => {
    expect(cardVariant("OP09-001")).toBeNull();
  });
});

describe("formatCardCodeLabel", () => {
  it("names the parallel in words instead of exposing the suffix", () => {
    expect(formatCardCodeLabel("EB01-001_p1")).toBe("EB01-001 (Parallel 1)");
  });

  it("strips a reprint suffix rather than leaking it", () => {
    // Regression: the previous implementation only matched `_p\d+`, so every
    // `_r1` reprint fell through to the raw code — and this helper feeds the
    // <title> of ~3,800 card pages.
    expect(formatCardCodeLabel("EB01-006_r1")).toBe("EB01-006");
  });

  it("leaves a standard print untouched", () => {
    expect(formatCardCodeLabel("OP01-003")).toBe("OP01-003");
  });
});

describe("no reader-facing helper emits a printing suffix", () => {
  const codes = ["OP09-001_p1", "OP13-118_p3", "EB01-006_r1", "P-014_p2"];

  it.each(codes)("baseCardCode(%s) has no `_p`/`_r` tail", (code) => {
    expect(baseCardCode(code)).not.toMatch(/_[a-z]\d+$/i);
  });

  it.each(codes)("formatCardCodeLabel(%s) has no `_p`/`_r` tail", (code) => {
    expect(formatCardCodeLabel(code)).not.toMatch(/_[a-z]\d/i);
  });
});
