"use client";

import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Column<T> {
  key: string;
  header: string;
  className?: string;
  headerClassName?: string;
  render: (row: T) => React.ReactNode;
}

interface AdminDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  emptyIcon?: React.ReactNode;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  renderExpandedRow?: (row: T) => React.ReactNode;
  isRowExpanded?: (row: T) => boolean;
}

export function AdminDataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyIcon,
  emptyMessage = "No data found",
  onRowClick,
  renderExpandedRow,
  isRowExpanded,
}: AdminDataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 bg-muted/30">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-2.5 text-left text-xs font-medium text-muted-foreground ${col.headerClassName ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border/20">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton className="h-4 w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  {emptyIcon}
                  <p className="text-sm">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const key = rowKey(row);
              return (
                <TableRow
                  key={key}
                  row={row}
                  columns={columns}
                  onRowClick={onRowClick}
                  renderExpandedRow={renderExpandedRow}
                  isExpanded={isRowExpanded?.(row) ?? false}
                />
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function TableRow<T>({
  row,
  columns,
  onRowClick,
  renderExpandedRow,
  isExpanded,
}: {
  row: T;
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  renderExpandedRow?: (row: T) => React.ReactNode;
  isExpanded: boolean;
}) {
  return (
    <>
      <tr
        className={`border-b border-border/20 transition-colors hover:bg-muted/20 ${onRowClick ? "cursor-pointer" : ""}`}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
      >
        {columns.map((col) => (
          <td key={col.key} className={`px-4 py-3 ${col.className ?? ""}`}>
            {col.render(row)}
          </td>
        ))}
      </tr>
      {isExpanded && renderExpandedRow && (
        <tr className="border-b border-border/20 bg-muted/10">
          <td colSpan={columns.length} className="px-4 py-3">
            {renderExpandedRow(row)}
          </td>
        </tr>
      )}
    </>
  );
}

export function AdminTableLoader({ columns }: { columns: number }) {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
