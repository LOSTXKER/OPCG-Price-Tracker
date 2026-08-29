import { describe, expect, it } from "vitest";

import { detectIosSafari, isDismissalActive } from "./use-install-prompt";

const DAY = 24 * 60 * 60 * 1000;

describe("detectIosSafari", () => {
  const IPHONE_SAFARI =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
  const IPHONE_CHROME =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1";
  const IPHONE_FIREFOX =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15";
  const IPAD_DESKTOP_MODE =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
  const MAC_SAFARI =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
  const ANDROID_CHROME =
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";

  it("recognises real Safari on iPhone — the only browser that can add to the home screen there", () => {
    expect(detectIosSafari(IPHONE_SAFARI, 5)).toBe(true);
  });

  it.each([
    ["Chrome on iOS", IPHONE_CHROME],
    ["Firefox on iOS", IPHONE_FIREFOX],
  ])("rejects %s — it has no Add to Home Screen item to point at", (_label, ua) => {
    expect(detectIosSafari(ua, 5)).toBe(false);
  });

  it("recognises an iPad in desktop mode, which claims to be a Mac but reports touch", () => {
    expect(detectIosSafari(IPAD_DESKTOP_MODE, 5)).toBe(true);
  });

  it("does not mistake a desktop Mac for an iPad — it reports no touch points", () => {
    expect(detectIosSafari(MAC_SAFARI, 0)).toBe(false);
  });

  it("leaves Android alone — it gets the real install prompt, not instructions", () => {
    expect(detectIosSafari(ANDROID_CHROME, 5)).toBe(false);
  });
});

describe("isDismissalActive", () => {
  const now = 1_800_000_000_000;

  it("keeps quiet for the 30 days after a dismissal", () => {
    expect(isDismissalActive(now - 29 * DAY, now)).toBe(true);
  });

  it("asks again once the window has passed", () => {
    expect(isDismissalActive(now - 31 * DAY, now)).toBe(false);
  });

  it("treats unparseable storage as never dismissed", () => {
    expect(isDismissalActive(Number.NaN, now)).toBe(false);
  });

  it("does not stay silent forever when the clock moves backwards", () => {
    expect(isDismissalActive(now + 5 * DAY, now)).toBe(false);
  });
});
