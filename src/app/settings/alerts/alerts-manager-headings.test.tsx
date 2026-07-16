import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AlertSectionHeading } from "./alerts-manager-client";

describe("AlertSectionHeading", () => {
  it("uses a compact semantic h2 and keeps the section count visible", () => {
    const markup = renderToStaticMarkup(
      <AlertSectionHeading id="active-alerts-heading" title="Active" count={3} />,
    );

    expect(markup).toContain(
      '<h2 id="active-alerts-heading" class="text-h4">Active</h2>',
    );
    expect(markup).toContain('class="text-meta tabular-nums">3</span>');
    expect(markup).not.toContain("<h3");
  });
});
