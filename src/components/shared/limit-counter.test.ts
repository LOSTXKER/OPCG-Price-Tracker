import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  LimitCounter,
  getLimitMeterTreatment,
  getLimitPresentation,
} from "./limit-counter";

describe("limit counter presentation", () => {
  it("keeps low usage visible without warning styling", () => {
    expect(getLimitPresentation(8, 15)).toEqual({
      percent: 53.333333333333336,
      isUnlimited: false,
      isFull: false,
      isHigh: false,
    });
  });

  it("marks high and full finite quotas", () => {
    expect(getLimitPresentation(12, 15)).toMatchObject({
      percent: 80,
      isHigh: true,
      isFull: false,
    });
    expect(getLimitPresentation(16, 15)).toMatchObject({
      percent: 100,
      isHigh: false,
      isFull: true,
    });
  });

  it("treats unlimited quotas as unmetered", () => {
    expect(getLimitPresentation(250, Number.POSITIVE_INFINITY)).toEqual({
      percent: 0,
      isUnlimited: true,
      isFull: false,
      isHigh: false,
    });
  });

  it("keeps normal and unlimited usage informational only", () => {
    expect(
      getLimitMeterTreatment(getLimitPresentation(8, 15)),
    ).toEqual({
      showProgress: false,
      showUpgradePrompt: false,
      tone: "neutral",
    });
    expect(
      getLimitMeterTreatment(
        getLimitPresentation(250, Number.POSITIVE_INFINITY),
      ),
    ).toEqual({
      showProgress: false,
      showUpgradePrompt: false,
      tone: "neutral",
    });
  });

  it("uses a quiet warning treatment only near or at the limit", () => {
    expect(
      getLimitMeterTreatment(getLimitPresentation(12, 15)),
    ).toEqual({
      showProgress: true,
      showUpgradePrompt: true,
      tone: "warning",
    });
    expect(
      getLimitMeterTreatment(getLimitPresentation(15, 15)),
    ).toEqual({
      showProgress: true,
      showUpgradePrompt: true,
      tone: "warning",
    });
  });

  it("adds hidden context and state metadata to a ratio badge", () => {
    const markup = renderToStaticMarkup(
      createElement(LimitCounter, {
        current: 8,
        max: 15,
        label: "การ์ดในรายการโปรด",
      }),
    );

    expect(markup).toContain('data-slot="limit-badge"');
    expect(markup).toContain('data-limit-state="normal"');
    expect(markup).toContain("การ์ดในรายการโปรด 8/15");
    expect(markup).toContain('aria-hidden="true">8/15');
  });
});
