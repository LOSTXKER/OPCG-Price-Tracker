import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { useUIStore } from "@/stores/ui-store";

import DeckCalculatorClient from "./deck-calculator-client";

/**
 * `useAuthState()` returns `null` on the server, and `null` used to render
 * skeletons — so the crawler received a page with no H1 and no body at all.
 * The static example deck is the SSR/initial state now; this locks that in.
 */
describe("DeckCalculatorClient (server render)", () => {
  beforeEach(() => {
    useUIStore.setState({ language: "TH", currency: "THB" });
  });

  it("renders the Thai H1 and the example deck without auth", () => {
    const markup = renderToStaticMarkup(<DeckCalculatorClient />);

    expect(markup).toContain("<h1");
    expect(markup).toContain("สร้างเด็ค");
    expect(markup).toContain("My OP-09 Deck");
    expect(markup).toContain("OP09-001");
    expect(markup).not.toContain("animate-pulse");
  });
});
