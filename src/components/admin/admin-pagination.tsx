"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
  compact?: boolean;
  className?: string;
}

export function AdminPagination({
  page,
  totalPages,
  onPageChange,
  total,
  perPage,
  onPerPageChange,
  perPageOptions = [20, 50, 100],
  compact = false,
  className,
}: AdminPaginationProps) {
  if (totalPages <= 1 && !onPerPageChange) return null;

  const rangeStart = total != null && perPage ? (page - 1) * perPage + 1 : null;
  const rangeEnd =
    total != null && perPage ? Math.min(page * perPage, total) : null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3",
        compact ? "justify-end" : "justify-between",
        className,
      )}
    >
      {/* Left: range info + per-page */}
      {!compact && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {total != null && rangeStart != null && rangeEnd != null ? (
            <span>
              {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} จาก{" "}
              {total.toLocaleString()} รายการ
            </span>
          ) : total != null ? (
            <span>ทั้งหมด {total.toLocaleString()} รายการ</span>
          ) : null}
          {onPerPageChange && perPage && (
            <select
              value={perPage}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              className="h-8 rounded-md border border-border/50 bg-transparent px-2 text-xs"
              aria-label="จำนวนต่อหน้า"
            >
              {perPageOptions.map((n) => (
                <option key={n} value={n}>
                  {n} / หน้า
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Right: page controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {totalPages > 3 && (
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={page <= 1}
              onClick={() => onPageChange(1)}
              aria-label="หน้าแรก"
            >
              <ChevronsLeft className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="ก่อนหน้า"
          >
            <ChevronLeft className="size-4" />
          </Button>

          {generatePageNumbers(page, totalPages).map((p, i) =>
            p === "..." ? (
              <span
                key={`dots-${i}`}
                className="px-1 text-xs text-muted-foreground/50"
              >
                ...
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "default" : "ghost"}
                size="icon-xs"
                onClick={() => onPageChange(p as number)}
                className={cn(
                  "min-w-[28px] font-mono text-xs",
                  p === page && "pointer-events-none",
                )}
              >
                {p}
              </Button>
            ),
          )}

          <Button
            variant="ghost"
            size="icon-xs"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="ถัดไป"
          >
            <ChevronRight className="size-4" />
          </Button>
          {totalPages > 3 && (
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={page >= totalPages}
              onClick={() => onPageChange(totalPages)}
              aria-label="หน้าสุดท้าย"
            >
              <ChevronsRight className="size-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function generatePageNumbers(
  current: number,
  total: number,
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");

  pages.push(total);
  return pages;
}
