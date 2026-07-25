import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import OrdersLoading from "@/app/orders/loading"

import { OrdersListSkeleton } from "./orders-list-skeleton"

describe("OrdersListSkeleton", () => {
  it("matches OrderCard's row anatomy instead of a generic 64px bar", () => {
    const markup = renderToStaticMarkup(<OrdersListSkeleton count={2} />)

    expect(markup).toContain('role="status"')
    expect(markup.match(/data-slot="order-card-skeleton"/g)).toHaveLength(2)
    expect(markup.match(/h-\[78px\] w-14/g)).toHaveLength(2)
    expect(markup.match(/border-t border-hair pt-3/g)).toHaveLength(2)
    expect(markup).not.toContain("h-16")
  })

  it("is reused by the route fallback after the touch-safe status rail", () => {
    const markup = renderToStaticMarkup(<OrdersLoading />)

    expect(markup).toContain("h-11")
    expect(markup).toContain("sm:h-10")
    expect(markup).toContain('data-slot="orders-list-skeleton"')
    expect(markup.match(/data-slot="order-card-skeleton"/g)).toHaveLength(5)
  })
})
