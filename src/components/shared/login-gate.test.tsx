import Link from "next/link"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { Button } from "@/components/ui/button"

import { AuthPreviewGate } from "./login-gate"

vi.mock("next/navigation", () => ({
  usePathname: () => "/portfolio",
}))

describe("AuthPreviewGate", () => {
  it("removes interactive preview controls from keyboard and accessibility navigation", () => {
    const markup = renderToStaticMarkup(
      <AuthPreviewGate
        preview={
          <Button render={<Link href="/portfolio/1" />}>
            Open preview portfolio
          </Button>
        }
      />,
    )

    expect(markup).toContain("pointer-events-none select-none")
    expect(markup).toContain('aria-hidden="true"')
    expect(markup).toContain('inert=""')
    expect(markup).toContain('/login?redirect=%2Fportfolio')
  })
})
