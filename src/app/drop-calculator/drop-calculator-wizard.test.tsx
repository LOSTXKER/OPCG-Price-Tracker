import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  DropCalculatorWizard,
  getDefaultDropSetCode,
} from "./drop-calculator-client";

describe("DropCalculatorWizard", () => {
  it("shows three Thai steps and exposes the current step accessibly", () => {
    const markup = renderToStaticMarkup(
      <DropCalculatorWizard lang="TH" currentStep={2} />,
    );

    expect(markup).toContain("เลือกชุดการ์ด");
    expect(markup).toContain("เลือกการ์ดที่อยากได้");
    expect(markup).toContain("ดูผลลัพธ์");
    expect(markup.match(/aria-current="step"/g)).toHaveLength(2);
    expect(markup).toContain("<nav");
    expect(markup).toContain("2 / 3");
    expect(markup).toContain("size-6");
    expect(markup).not.toContain("shadow-[var(--panel-shadow)]");
  });
});

describe("getDefaultDropSetCode", () => {
  it("starts from the newest set returned by the API", () => {
    expect(
      getDefaultDropSetCode([
        {
          id: 15,
          code: "OP15",
          name: "OP15",
          nameEn: null,
          nameTh: null,
          type: "booster",
          releaseDate: "2026-07-01",
          imageUrl: null,
        },
        {
          id: 14,
          code: "OP14",
          name: "OP14",
          nameEn: null,
          nameTh: null,
          type: "booster",
          releaseDate: "2026-06-01",
          imageUrl: null,
        },
      ]),
    ).toBe("OP15");
  });

  it("keeps the compact no-set fallback when there is no data", () => {
    expect(getDefaultDropSetCode([])).toBe("");
  });
});
