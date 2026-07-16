import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, expectTypeOf, it } from "vitest"

import { getAutomaticPortfolioId } from "@/components/cards/card-add-to-portfolio"
import type { PortfolioMutationResult } from "@/lib/types/portfolio"

import {
  PortfolioCreateForm,
  shouldAcceptPortfolioDialogOpenChange,
  type PortfolioCreateCopy,
  type PortfolioCreateHandler,
} from "./portfolio-create-dialog"

const copy: PortfolioCreateCopy = {
  nameLabel: "Portfolio name",
  namePlaceholder: "My collection",
  visibilityLabel: "Who can see this portfolio?",
  publicLabel: "Public",
  publicDescription: "Others can see it",
  privateLabel: "Private",
  privateDescription: "Only you can see it",
  submitLabel: "Create portfolio",
  submittingLabel: "Creating...",
  cancelLabel: "Cancel",
  genericError: "Could not create portfolio",
  nameRequiredError: "Enter a portfolio name",
  visibilityRequiredError: "Choose public or private",
}

describe("portfolio creation and quick-add selection", () => {
  it("requires an explicit visibility choice and starts with no default", () => {
    const markup = renderToStaticMarkup(
      <PortfolioCreateForm
        copy={copy}
        onCreate={async (_name: string, _isPublic: boolean) => ({
          ok: true as const,
          status: 201,
          error: null,
          data: { id: 1 },
        })}
        onCancel={() => undefined}
      />,
    )

    expect(markup).toContain('role="radiogroup"')
    expect(markup.match(/aria-checked="false"/g)).toHaveLength(2)
    expect(markup).not.toContain('aria-checked="true"')
    expect(markup).toContain("Who can see this portfolio?")
    expect(markup).toContain("Public")
    expect(markup).toContain("Private")
    const submitTag = markup.match(/<button type="submit"[^>]*>/)?.[0]
    expect(submitTag).toBeDefined()
    expect(submitTag).not.toMatch(/\sdisabled(?:=|\s|>)/)
    expect(markup).toContain("h-11")
  })

  it("auto-selects only when exactly one portfolio exists", () => {
    expect(getAutomaticPortfolioId([])).toBeNull()
    expect(getAutomaticPortfolioId([{ id: 7 }])).toBe(7)
    expect(getAutomaticPortfolioId([{ id: 7 }, { id: 9 }])).toBeNull()
  })

  it("blocks user dismissal while a portfolio mutation is pending", () => {
    expect(shouldAcceptPortfolioDialogOpenChange(false, true)).toBe(false)
    expect(shouldAcceptPortfolioDialogOpenChange(false, false)).toBe(true)
    expect(shouldAcceptPortfolioDialogOpenChange(true, true)).toBe(true)
  })

  it("uses the canonical discriminated mutation result", () => {
    type HandlerResult = Awaited<ReturnType<PortfolioCreateHandler<{ id: number }>>>

    expectTypeOf<HandlerResult>().toEqualTypeOf<
      PortfolioMutationResult<{ id: number }>
    >()
  })
})
