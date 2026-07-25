import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("@base-ui/react/dialog", async () => {
  const React = await import("react")

  return {
    Dialog: {
      Root: ({ children }: { children?: React.ReactNode }) =>
        React.createElement("div", null, children),
      Trigger: ({ children }: { children?: React.ReactNode }) =>
        React.createElement("button", null, children),
      Portal: ({ children }: { children?: React.ReactNode }) =>
        React.createElement(React.Fragment, null, children),
      Close: ({ children }: { children?: React.ReactNode }) =>
        React.createElement("button", null, children),
      Backdrop: ({
        className,
        forceRender,
      }: {
        className?: string
        forceRender?: boolean
      }) =>
        React.createElement("div", {
          className,
          "data-force-render": String(Boolean(forceRender)),
        }),
      Popup: ({
        children,
        className,
      }: {
        children?: React.ReactNode
        className?: string
      }) => React.createElement("div", { className }, children),
      Title: ({ children }: { children?: React.ReactNode }) =>
        React.createElement("h2", null, children),
      Description: ({ children }: { children?: React.ReactNode }) =>
        React.createElement("p", null, children),
    },
  }
})

import { FilterModal } from "./filter-modal"

const noop = () => undefined

describe("FilterModal nested backdrop", () => {
  it("keeps the default backdrop contract for ordinary filters", () => {
    const markup = renderToStaticMarkup(
      <FilterModal open onOpenChange={noop}>
        Filters
      </FilterModal>,
    )

    expect(markup).toContain('data-force-render="false"')
    expect(markup).not.toContain("md:backdrop-blur-sm")
  })

  it("force-renders and blurs the backdrop when nested blur is requested", () => {
    const markup = renderToStaticMarkup(
      <FilterModal open onOpenChange={noop} blurBackdrop>
        Filters
      </FilterModal>,
    )

    expect(markup).toContain('data-force-render="true"')
    expect(markup).toContain("md:bg-black/20")
    expect(markup).toContain("md:backdrop-blur-sm")
  })
})
