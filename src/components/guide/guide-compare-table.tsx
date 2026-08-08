import type { ReactNode } from "react";

import { Surface } from "@/components/ui/surface";

export type GuideCompareColumn = {
  /** Key used to look the cell up in each row's `cells` map. */
  key: string;
  label: string;
};

export type GuideCompareRow = {
  id: string;
  /** Left-hand row header — the thing being compared across columns. */
  header: string;
  cells: Record<string, ReactNode>;
};

/**
 * The side-by-side comparison used across the guide pages, lifted out of the
 * hand-rolled JP/EN table on `/guide/versions` so every page gets the same
 * shape for free.
 *
 * Follows the AGENTS.md breakpoint rule: the real `<table>` renders from `sm`
 * up, and below that it degrades to a stacked list — never a horizontally
 * scrolling table, which is a UX regression on phones. Guide pages sit in a
 * `reading` (max-w-2xl) container, so keep this to ~4 value columns; past that
 * the cells get too narrow to read and the content wants a different shape.
 */
export function GuideCompareTable({
  columns,
  rows,
  rowHeaderLabel,
  caption,
}: {
  columns: GuideCompareColumn[];
  rows: GuideCompareRow[];
  /** Top-left cell — names what the row headers are, e.g. "หัวข้อ". */
  rowHeaderLabel: string;
  /** Optional note under the table (source, caveat, "ณ วันที่..."). */
  caption?: ReactNode;
}) {
  if (rows.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Dense table from sm up (AGENTS.md: sm = data layout boundary). */}
      <Surface variant="outline" className="hidden overflow-hidden sm:block">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-hair">
              <th className="w-40 px-4 py-3 text-left text-eyebrow">{rowHeaderLabel}</th>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-left text-eyebrow">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hair">
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row" className="px-4 py-3 text-left text-h5 font-medium">
                  {row.header}
                </th>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-3 text-body-sm leading-relaxed text-muted-foreground"
                  >
                    {row.cells[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Surface>

      {/* Stacked fallback below sm — one block per row, label-prefixed. */}
      <Surface variant="outline" className="divide-y divide-hair overflow-hidden sm:hidden">
        {rows.map((row) => (
          <div key={row.id} className="space-y-2 px-5 py-4">
            <h3 className="text-h5">{row.header}</h3>
            {columns.map((column) => (
              <p key={column.key} className="text-body-sm leading-relaxed text-muted-foreground">
                <span className="text-foreground">{column.label}</span> — {row.cells[column.key]}
              </p>
            ))}
          </div>
        ))}
      </Surface>

      {caption && <p className="text-meta">{caption}</p>}
    </div>
  );
}
