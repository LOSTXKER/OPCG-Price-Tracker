import { describe, expect, it } from "vitest";

import { getSafeInternalRedirect } from "./safe-redirect";

describe("getSafeInternalRedirect", () => {
  it("preserves a safe internal path, query, and hash", () => {
    expect(
      getSafeInternalRedirect("/pricing?checkout=PRO_MONTHLY#plans"),
    ).toBe("/pricing?checkout=PRO_MONTHLY#plans");
  });

  it.each([
    "https://evil.example/steal",
    "//evil.example/steal",
    "/\\evil.example/steal",
    "/%2F%2Fevil.example/steal",
    "javascript:alert(1)",
    "pricing",
  ])("rejects unsafe redirect %s", (redirect) => {
    expect(getSafeInternalRedirect(redirect, "/pricing")).toBe("/pricing");
  });
});
