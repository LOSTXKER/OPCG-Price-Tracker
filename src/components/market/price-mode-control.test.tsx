import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it } from "vitest"

import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"

import {
  GradeControl,
  PriceModeControl,
} from "./price-mode-control"

const noop = () => undefined

beforeEach(() => {
  useUIStore.setState({ language: "TH" })
})

describe("GradeControl", () => {
  it("renders every grade as a horizontal radiogroup instead of a dropdown", () => {
    const markup = renderToStaticMarkup(
      <GradeControl value="psa_9" onChange={noop} />,
    )

    expect(markup.match(/role="radio"/g)).toHaveLength(5)
    expect(markup).toContain("data-grade-control")
    expect(markup).toContain('role="radiogroup"')
    expect(markup).not.toContain('role="combobox"')
    expect(markup).not.toContain('role="listbox"')
    expect(markup).toContain("Raw")
    expect(markup).toContain("PSA 10")
    expect(markup).toContain("PSA 9")
    expect(markup).toContain("PSA 8")
    expect(markup).toContain("BGS 9.5")
    expect(markup).not.toContain("est.")
    expect(markup).not.toContain(t("TH", "sampleEstimate"))
    expect(markup).toContain(t("TH", "chooseGrade"))
    expect(markup).toMatch(
      /role="radio" aria-checked="true" aria-label="PSA 9"/,
    )
  })

  it("keeps every active option label grade-only", () => {
    const raw = renderToStaticMarkup(
      <GradeControl value="raw" onChange={noop} />,
    )
    const psa10 = renderToStaticMarkup(
      <GradeControl value="psa_10" onChange={noop} />,
    )

    expect(raw).toMatch(
      /role="radio" aria-checked="true" aria-label="Raw"/,
    )
    expect(psa10).toMatch(
      /role="radio" aria-checked="true" aria-label="PSA 10"/,
    )
  })

  it("keeps the old Raw/PSA 10 adapter source-compatible", () => {
    const markup = renderToStaticMarkup(
      <PriceModeControl value="psa10" onChange={noop} />,
    )

    expect(markup.match(/role="radio"/g)).toHaveLength(2)
    expect(markup).toMatch(
      /role="radio" aria-checked="true" aria-label="PSA 10"/,
    )
    expect(markup).not.toContain("PSA 9")
    expect(markup).not.toContain("est.")
  })
})
