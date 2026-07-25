import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CardDetailPrice } from "./card-detail-price";
import { buildGradeData, type GradeKey } from "./grades";

describe("CardDetailPrice grade selector", () => {
  it("uses a roving single-choice radiogroup", () => {
    const gradeData = buildGradeData({
      rawAnchorJpy: 1_000,
      rawAnchorThb: null,
      psa10AskUsd: 120,
      psa10SoldUsd: 110,
      rawLastSoldUsd: null,
      rawDelta30d: 4,
    });
    const values: Record<GradeKey, number | null> = {
      raw: 1_000,
      psa_10: 120,
      psa_9: 60,
      psa_8: 38,
      bgs_95: 138,
    };

    const markup = renderToStaticMarkup(
      <CardDetailPrice
        hydrated={false}
        lang="TH"
        currency="THB"
        edition="JP"
        onEditionChange={() => undefined}
        range="1M"
        activeIndex={null}
        gradeActiveRef={createRef<HTMLButtonElement>()}
        gradeData={gradeData}
        gradeDisplayValues={values}
        selectedGrade="raw"
        onGradeChange={() => undefined}
        activeValue={1_000}
        shownDelta={null}
        shownDate={null}
        windowLabel="1M"
        priceLow={null}
        priceHigh={null}
        pricePos={0}
        provenance={null}
      />,
    );

    expect(markup).toContain('role="radiogroup"');
    expect(markup.match(/role="radio"/g)).toHaveLength(5);
    expect(markup.match(/aria-checked="true"/g)).toHaveLength(1);
    expect(markup.match(/tabindex="0"/g)).toHaveLength(1);
    expect(markup.match(/tabindex="-1"/g)).toHaveLength(4);
    expect(markup.match(/data-grade-key=/g)).toHaveLength(5);
  });
});
