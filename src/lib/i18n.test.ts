import { describe, expect, it } from "vitest";

import { getHtmlLang } from "@/lib/i18n";

describe("getHtmlLang", () => {
  it.each([
    ["TH", "th"],
    ["EN", "en"],
    ["JP", "ja"],
  ] as const)("maps %s to %s", (language, expected) => {
    expect(getHtmlLang(language)).toBe(expected);
  });
});
