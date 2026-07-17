import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AlertSectionHeading } from "./alerts-manager-client";

describe("AlertSectionHeading", () => {
  it("uses a compact semantic h2 and keeps the section count visible", () => {
    const markup = renderToStaticMarkup(
      <AlertSectionHeading id="active-alerts-heading" title="Active" count={3} />,
    );

    // Count sits inline next to the label (tab-badge grammar), inside the h2.
    expect(markup).toContain('id="active-alerts-heading"');
    expect(markup).toContain("text-h5");
    expect(markup).toMatch(/<h2[^>]*>Active<span[^>]*>3<\/span><\/h2>/);
    expect(markup).not.toContain("<h3");
  });
});
