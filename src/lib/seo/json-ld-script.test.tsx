import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { JsonLd } from "./json-ld-script";

describe("JsonLd", () => {
  it("renders structured data without allowing a closing script injection", () => {
    const markup = renderToStaticMarkup(
      <JsonLd data={{ "@type": "Thing", name: "</script><script>alert(1)</script>" }} />,
    );

    expect(markup).toContain('type="application/ld+json"');
    expect(markup).toContain("\\u003c/script>\\u003cscript>alert(1)\\u003c/script>");
    expect(markup).not.toContain("</script><script>");
  });
});
