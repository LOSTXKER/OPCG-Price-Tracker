import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ConversationSidebar } from "./conversation-sidebar";

describe("ConversationSidebar filters", () => {
  it("uses the canonical equal-width radiogroup", () => {
    const markup = renderToStaticMarkup(
      <ConversationSidebar conversations={[]} activeListingId={null} />,
    );

    expect(markup).toContain('role="radiogroup"');
    expect(markup.match(/role="radio"/g)).toHaveLength(3);
    expect(markup.match(/aria-checked="true"/g)).toHaveLength(1);
    expect(markup).toContain("w-full");
    expect(markup).toContain("flex-1");
    expect(markup).not.toContain("aria-pressed");
  });
});
