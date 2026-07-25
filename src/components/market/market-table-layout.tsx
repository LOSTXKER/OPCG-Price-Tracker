import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export type MarketTableLayoutColumn = {
  key: string
  col: string
  cell: string
  align?: "left" | "right"
}

export function marketTableCellClass(column: MarketTableLayoutColumn) {
  return cn(
    "py-3 align-middle",
    column.key === "star"
      ? "pl-3 pr-0"
      : column.key === "rank"
        ? "px-1"
        : "pr-3 pl-2",
    column.cell,
    column.align === "right" && "text-right",
  )
}

export function marketTableHeaderClass(column: MarketTableLayoutColumn) {
  return cn(
    "whitespace-nowrap py-2.5 font-medium",
    column.key === "star"
      ? "pl-3 pr-0"
      : column.key === "rank"
        ? "px-1"
        : "pr-3 pl-2",
    column.cell,
    column.align === "right" && "text-right",
  )
}

/** Shared desktop geometry for market-style data tables. Consumers own rows. */
export function MarketTableLayout({
  columns,
  header,
  children,
  surface = "card",
  bodyClassName,
  footer,
}: {
  columns: readonly MarketTableLayoutColumn[]
  header: ReactNode
  children: ReactNode
  surface?: "card" | "canvas"
  bodyClassName?: string
  footer?: ReactNode
}) {
  return (
    <div className="hidden overflow-x-auto sm:block">
      <table className="w-full table-fixed text-left text-sm">
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} className={column.col || undefined} />
          ))}
        </colgroup>
        <thead
          className={cn(
            "sticky top-0 z-10",
            surface === "canvas" ? "bg-background" : "bg-card",
          )}
        >
          <tr className="border-b border-hair text-eyebrow text-muted-foreground">
            {header}
          </tr>
        </thead>
        <tbody className={bodyClassName}>{children}</tbody>
      </table>
      {footer}
    </div>
  )
}
