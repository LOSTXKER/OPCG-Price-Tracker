"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  ChevronDown,
  ChevronUp,
  Inbox,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ── Types ── */

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  sortFn?: (a: T, b: T) => number;
  pin?: "left";
  render: (row: T) => React.ReactNode;
}

export type SortDirection = "asc" | "desc" | null;
export type SortState = { key: string; direction: SortDirection };

interface AdminDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  loadingRows?: number;
  emptyIcon?: React.ReactNode;
  emptyMessage?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  renderExpandedRow?: (row: T) => React.ReactNode;
  isRowExpanded?: (row: T) => boolean;
  stickyHeader?: boolean;
  selectable?: boolean;
  selectedKeys?: Set<string | number>;
  onSelectionChange?: (keys: Set<string | number>) => void;
  sortState?: SortState;
  onSortChange?: (sort: SortState) => void;
  compact?: boolean;
}

/* ── Main Component ── */

export function AdminDataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  loadingRows = 5,
  emptyIcon,
  emptyMessage = "ไม่พบข้อมูล",
  emptyDescription,
  onRowClick,
  renderExpandedRow,
  isRowExpanded,
  stickyHeader = false,
  selectable = false,
  selectedKeys,
  onSelectionChange,
  sortState,
  onSortChange,
  compact = false,
}: AdminDataTableProps<T>) {
  const [internalSort, setInternalSort] = useState<SortState>({
    key: "",
    direction: null,
  });

  const activeSort = sortState ?? internalSort;
  const setActiveSort = onSortChange ?? setInternalSort;

  const handleSort = useCallback(
    (key: string) => {
      setActiveSort({
        key,
        direction:
          activeSort.key === key
            ? activeSort.direction === "asc"
              ? "desc"
              : activeSort.direction === "desc"
                ? null
                : "asc"
            : "asc",
      });
    },
    [activeSort, setActiveSort],
  );

  const sortedData = useMemo(() => {
    if (!activeSort.key || !activeSort.direction) return data;
    const col = columns.find((c) => c.key === activeSort.key);
    if (!col?.sortFn) return data;
    const dir = activeSort.direction === "asc" ? 1 : -1;
    return [...data].sort((a, b) => col.sortFn!(a, b) * dir);
  }, [data, activeSort, columns]);

  const allKeys = useMemo(
    () => new Set(data.map((row) => rowKey(row))),
    [data, rowKey],
  );
  const allSelected =
    selectable &&
    selectedKeys &&
    allKeys.size > 0 &&
    [...allKeys].every((k) => selectedKeys.has(k));
  const someSelected =
    selectable &&
    selectedKeys &&
    selectedKeys.size > 0 &&
    !allSelected;

  const toggleAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(allKeys));
    }
  }, [allSelected, allKeys, onSelectionChange]);

  const toggleRow = useCallback(
    (key: string | number) => {
      if (!onSelectionChange || !selectedKeys) return;
      const next = new Set(selectedKeys);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      onSelectionChange(next);
    },
    [selectedKeys, onSelectionChange],
  );

  const py = compact ? "py-2" : "py-3";

  return (
    <div className="overflow-x-auto rounded-xl border border-border/50 bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr
            className={cn(
              "border-b border-border/50 bg-muted/30",
              stickyHeader && "sticky top-0 z-10 bg-muted/80 backdrop-blur-sm",
            )}
          >
            {selectable && (
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = !!someSelected;
                  }}
                  onChange={toggleAll}
                  className="accent-primary size-3.5 cursor-pointer rounded"
                  aria-label="เลือกทั้งหมด"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground/70",
                  col.sortable && "cursor-pointer select-none hover:text-foreground",
                  col.pin === "left" && "sticky left-0 z-[5] bg-muted/30",
                  stickyHeader && col.pin === "left" && "z-[11]",
                  col.headerClassName,
                )}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span className="inline-flex text-muted-foreground/40">
                      {activeSort.key === col.key ? (
                        activeSort.direction === "asc" ? (
                          <ArrowUp className="size-3.5 text-foreground" />
                        ) : activeSort.direction === "desc" ? (
                          <ArrowDown className="size-3.5 text-foreground" />
                        ) : (
                          <ArrowUpDown className="size-3" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3" />
                      )}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: loadingRows }).map((_, i) => (
              <tr key={i} className="border-b border-border/10">
                {selectable && (
                  <td className="px-3 py-3">
                    <Skeleton className="size-3.5 rounded" />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4", py)}>
                    <Skeleton className="h-4 w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          ) : sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-4 py-20 text-center"
              >
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  {emptyIcon ?? (
                    <div className="flex size-12 items-center justify-center rounded-xl bg-muted/50">
                      <Inbox className="size-6 text-muted-foreground/50" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{emptyMessage}</p>
                    {emptyDescription && (
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        {emptyDescription}
                      </p>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            sortedData.map((row) => {
              const key = rowKey(row);
              const isSelected = selectedKeys?.has(key) ?? false;
              return (
                <DataTableRow
                  key={key}
                  row={row}
                  rowId={key}
                  columns={columns}
                  onRowClick={onRowClick}
                  renderExpandedRow={renderExpandedRow}
                  isExpanded={isRowExpanded?.(row) ?? false}
                  selectable={selectable}
                  isSelected={isSelected}
                  onToggle={toggleRow}
                  compact={compact}
                />
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ── Row ── */

function DataTableRow<T>({
  row,
  rowId,
  columns,
  onRowClick,
  renderExpandedRow,
  isExpanded,
  selectable,
  isSelected,
  onToggle,
  compact,
}: {
  row: T;
  rowId: string | number;
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  renderExpandedRow?: (row: T) => React.ReactNode;
  isExpanded: boolean;
  selectable: boolean;
  isSelected: boolean;
  onToggle: (key: string | number) => void;
  compact: boolean;
}) {
  const py = compact ? "py-2" : "py-3";
  return (
    <>
      <tr
        className={cn(
          "border-b border-border/10 transition-colors",
          onRowClick && "cursor-pointer",
          isSelected
            ? "bg-primary/[0.06]"
            : "hover:bg-muted/30",
        )}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
      >
        {selectable && (
          <td className="px-3" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggle(rowId)}
              className="accent-primary size-3.5 cursor-pointer rounded"
            />
          </td>
        )}
        {columns.map((col) => (
          <td
            key={col.key}
            className={cn(
              "px-4",
              py,
              col.pin === "left" && "sticky left-0 bg-card",
              isSelected && col.pin === "left" && "bg-primary/[0.06]",
              col.className,
            )}
          >
            {col.render(row)}
          </td>
        ))}
      </tr>
      {isExpanded && renderExpandedRow && (
        <tr className="border-b border-border/10 bg-muted/5">
          <td
            colSpan={columns.length + (selectable ? 1 : 0)}
            className="px-4 py-4"
          >
            {renderExpandedRow(row)}
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Loader placeholder ── */

export function AdminTableLoader({ columns }: { columns: number }) {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
