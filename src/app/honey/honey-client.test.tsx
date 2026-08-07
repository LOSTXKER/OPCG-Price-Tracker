import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { useUIStore } from "@/stores/ui-store";

import HoneyClient from "./honey-client";

/**
 * `useAuthState()` returns `null` on the server (the effect that resolves
 * real auth is client-only) — same constraint as
 * deck-calculator-client.test.tsx. That `null` branch used to be four gray
 * skeleton blocks with no text at all, so a crawler (or anyone whose JS
 * hasn't run yet) received a page with no real content in the first screen.
 * It must now lead with the indexable public explainer instead.
 */
describe("HoneyClient (server render, auth unknown)", () => {
  beforeEach(() => {
    useUIStore.setState({ language: "TH", currency: "THB" });
  });

  it("renders the H1 and the public explainer before any loading placeholder", () => {
    const markup = renderToStaticMarkup(<HoneyClient />);

    expect(markup).toContain("<h1");
    expect(markup).toContain("Honey Rewards");
    expect(markup).toContain("Honey คืออะไร และได้มายังไง");

    // Ordering: the explainer's heading must appear before the loading
    // status row, not after four dashboard-shaped skeleton blocks.
    const explainerIndex = markup.indexOf("Honey คืออะไร และได้มายังไง");
    const loadingIndex = markup.indexOf('role="status"');
    expect(explainerIndex).toBeGreaterThan(-1);
    expect(loadingIndex).toBeGreaterThan(explainerIndex);
  });

  it("renders exactly one loading placeholder, not a dashboard-shaped skeleton stack", () => {
    const markup = renderToStaticMarkup(<HoneyClient />);
    const statusMatches = markup.match(/role="status"/g) ?? [];
    expect(statusMatches).toHaveLength(1);

    // The old placeholder was four fixed-height panels approximating the
    // dashboard's shape — that shape must be gone from the auth-unknown branch.
    expect(markup).not.toContain("h-48 rounded-xl");
    expect(markup).not.toContain("h-64 rounded-xl");
  });

  it("does not render the explainer twice", () => {
    const markup = renderToStaticMarkup(<HoneyClient />);
    const occurrences = markup.split("Honey คืออะไร และได้มายังไง").length - 1;
    expect(occurrences).toBe(1);
  });
});
