"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Inbox,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
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
  /**
   * Render a custom list-row layout for the `<sm` (mobile) breakpoint.
   * When provided, the `<table>` is hidden on mobile and this callback is
   * used to render each row as a list item instead — see [AGENTS.md] for the
   * "no horizontal scroll on phones" rule.
   * If omitted, the default mobile fallback uses the table columns rendered
   * stacked into a label/value grid per row.
   */
  renderMobileRow?: (row: T, index: number) => React.ReactNode;
  /** Disable the built-in mobile list fallback (forces horizontal scroll). */
  disableMobileFallback?: boolean;
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
  renderMobileRow,
  disableMobileFallback = false,
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
  const showMobileFallback = !disableMobileFallback;
  const mobileTableHidden = showMobileFallback ? "hidden sm:table" : "table";
  const sortableColumns = columns.filter((column) => column.sortable);

  return (
    <Surface
      variant="outline"
      className={cn(
        showMobileFallback ? "sm:overflow-x-auto" : "overflow-x-auto",
      )}
    >
      <table className={cn("w-full text-sm", mobileTableHidden)}>
        <thead>
          <tr
            className={cn(
              "border-b border-hair bg-muted/30",
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
                  className="accent-primary size-3.5 cursor-pointer rounded-sm"
                  aria-label="เลือกทั้งหมด"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                aria-sort={
                  col.sortable
                    ? activeSort.key === col.key
                      ? activeSort.direction === "asc"
                        ? "ascending"
                        : activeSort.direction === "desc"
                          ? "descending"
                          : "none"
                      : "none"
                    : undefined
                }
                className={cn(
                  "px-4 py-2.5 text-left text-eyebrow text-muted-foreground/70",
                  col.pin === "left" && "sticky left-0 z-[5] bg-muted/30",
                  stickyHeader && col.pin === "left" && "z-[11]",
                  col.headerClassName,
                )}
              >
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => handleSort(col.key)}
                    className="inline-flex min-h-11 items-center gap-1 select-none rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-0"
                  >
                    {col.header}
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
                  </button>
                ) : (
                  <span>{col.header}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: loadingRows }).map((_, i) => (
              <tr key={i} className="border-b border-hair">
                {selectable && (
                  <td className="px-3 py-3">
                    <Skeleton className="size-3.5 rounded-sm" />
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
                      <p className="mt-1 text-meta text-muted-foreground/70">
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
      {showMobileFallback && (
        <div className="sm:hidden">
          {sortableColumns.length > 0 && (
            <div
              aria-label="เรียงลำดับ"
              className="no-sb scroll-fade-x flex items-center gap-1 overflow-x-auto border-b border-hair bg-muted/20 px-3 py-2"
            >
              {sortableColumns.map((column) => {
                const active = activeSort.key === column.key && activeSort.direction != null;
                const Icon = active
                  ? activeSort.direction === "asc"
                    ? ArrowUp
                    : ArrowDown
                  : ArrowUpDown;
                return (
                  <button
                    key={column.key}
                    type="button"
                    aria-pressed={active}
                    aria-label={`เรียงตาม ${column.header}`}
                    onClick={() => handleSort(column.key)}
                    className={cn(
                      "flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-3 text-xs font-medium motion-base",
                      active
                        ? "bg-primary/15 text-primary"
                        : "bg-background text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {column.header}
                    <Icon aria-hidden className="size-3.5" />
                  </button>
                );
              })}
            </div>
          )}
          <div className="divide-y divide-hair">
          {loading ? (
            Array.from({ length: loadingRows }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : sortedData.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-12 text-muted-foreground">
              {emptyIcon ?? (
                <div className="flex size-12 items-center justify-center rounded-xl bg-muted/50">
                  <Inbox className="size-6 text-muted-foreground/50" />
                </div>
              )}
              <div className="text-center">
                <p className="text-sm font-medium">{emptyMessage}</p>
                {emptyDescription && (
                  <p className="mt-1 text-meta text-muted-foreground/70">
                    {emptyDescription}
                  </p>
                )}
              </div>
            </div>
          ) : (
            sortedData.map((row, idx) => {
              const key = rowKey(row);
              const isSelected = selectedKeys?.has(key) ?? false;
              if (renderMobileRow) {
                return (
                  <MobileRowWrapper
                    key={key}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    selectable={selectable}
                    isSelected={isSelected}
                    onToggle={() => toggleRow(key)}
                  >
                    {renderMobileRow(row, idx)}
                  </MobileRowWrapper>
                );
              }
              return (
                <MobileDefaultRow
                  key={key}
                  row={row}
                  columns={columns}
                  onRowClick={onRowClick}
                  selectable={selectable}
                  isSelected={isSelected}
                  onToggle={() => toggleRow(key)}
                  expanded={isRowExpanded?.(row) ?? false}
                  renderExpandedRow={renderExpandedRow}
                />
              );
            })
          )}
          </div>
        </div>
      )}
    </Surface>
  );
}

function MobileRowWrapper({
  children,
  onClick,
  selectable,
  isSelected,
  onToggle,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  selectable: boolean;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-colors",
        onClick &&
          "cursor-pointer active:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        isSelected && "bg-primary/[0.06]",
      )}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.target !== event.currentTarget) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {selectable && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="tap-safe accent-primary mt-1 size-5 cursor-pointer rounded-sm sm:size-3.5"
        />
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function MobileDefaultRow<T>({
  row,
  columns,
  onRowClick,
  selectable,
  isSelected,
  onToggle,
  expanded,
  renderExpandedRow,
}: {
  row: T;
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  selectable: boolean;
  isSelected: boolean;
  onToggle: () => void;
  expanded: boolean;
  renderExpandedRow?: (row: T) => React.ReactNode;
}) {
  const [primary, ...rest] = columns;
  return (
    <>
      <div
        role={onRowClick ? "button" : undefined}
        tabIndex={onRowClick ? 0 : undefined}
        className={cn(
          "flex items-start gap-3 px-4 py-3 transition-colors",
          onRowClick &&
            "cursor-pointer active:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          isSelected && "bg-primary/[0.06]",
        )}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
        onKeyDown={
          onRowClick
            ? (event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onRowClick(row);
                }
              }
            : undefined
        }
      >
        {selectable && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            onClick={(e) => e.stopPropagation()}
            className="tap-safe accent-primary mt-1 size-5 cursor-pointer rounded-sm sm:size-3.5"
          />
        )}
        <div className="min-w-0 flex-1 space-y-1.5">
          {primary && (
            <div className="text-sm font-medium">{primary.render(row)}</div>
          )}
          {rest.length > 0 && (
            <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-meta">
              {rest.map((col) => (
                <div key={col.key} className="contents">
                  <dt className="text-eyebrow text-muted-foreground/70">
                    {col.header}
                  </dt>
                  <dd className="min-w-0 text-foreground">{col.render(row)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
      {expanded && renderExpandedRow && (
        <div className="border-t border-hair bg-muted/10 px-4 py-3">
          {renderExpandedRow(row)}
        </div>
      )}
    </>
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
        role={onRowClick ? "button" : undefined}
        tabIndex={onRowClick ? 0 : undefined}
        className={cn(
          "border-b border-hair transition-colors",
          onRowClick &&
            "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          isSelected
            ? "bg-primary/[0.06]"
            : "hover:bg-muted/30",
        )}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
        onKeyDown={
          onRowClick
            ? (event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onRowClick(row);
                }
              }
            : undefined
        }
      >
        {selectable && (
          <td className="px-3" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggle(rowId)}
              className="accent-primary size-3.5 cursor-pointer rounded-sm"
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
        <tr className="border-b border-hair bg-muted/5">
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
