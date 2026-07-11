import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { buildMobilePageRange } from "@/lib/utils/pagination";

import { Pagination } from "./pagination";

describe("Pagination", () => {
  it("renders accessible labels, current page, and an optional summary", () => {
    const markup = renderToStaticMarkup(
      <Pagination
        page={5}
        totalPages={10}
        onPageChange={() => undefined}
        summary={<p>81-100 / 200</p>}
      />,
    );

    expect(markup).toContain('aria-label="หน้า 5 / 10"');
    expect(markup).toContain('aria-label="ก่อนหน้า"');
    expect(markup).toContain('aria-label="ถัดไป"');
    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain("81-100 / 200");
    expect(markup).toContain("size-11");
  });

  it("uses a compact mobile range around the current page", () => {
    expect(buildMobilePageRange(5, 10)).toEqual([1, "...", 5, "...", 10]);
    expect(buildMobilePageRange(1, 10)).toEqual([1, "...", 10]);
    expect(buildMobilePageRange(10, 10)).toEqual([1, "...", 10]);
  });
});
