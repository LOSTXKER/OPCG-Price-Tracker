"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  buildMobilePageRange,
  buildPageRange,
} from "@/lib/utils/pagination";
import { useUIStore } from "@/stores/ui-store";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isPending?: boolean;
  /** Optional localized range / page summary rendered before the controls. */
  summary?: ReactNode;
  className?: string;
}

/** Canonical controlled pagination for user-facing card lists. */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  isPending = false,
  summary,
  className,
}: PaginationProps) {
  const lang = useUIStore((state) => state.language);

  if (totalPages <= 1) return null;

  const previousLabel = t(lang, "previous");
  const nextLabel = t(lang, "next");
  const pageLabel = t(lang, "pageOf");

  return (
    <nav
      aria-label={`${pageLabel} ${page} / ${totalPages}`}
      aria-busy={isPending || undefined}
      className={cn(
        "flex flex-wrap items-center gap-2",
        summary ? "justify-between" : "justify-end",
        className,
      )}
    >
      {summary}
      <div className="flex flex-1 items-center justify-center gap-1 sm:flex-none sm:justify-end">
        <PageButton
          ariaLabel={previousLabel}
          disabled={page <= 1 || isPending}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft aria-hidden className="size-4" />
        </PageButton>

        <div className="contents sm:hidden">
          <PageNumbers
            current={page}
            pages={buildMobilePageRange(page, totalPages)}
            isPending={isPending}
            pageLabel={pageLabel}
            onChange={onPageChange}
          />
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          <PageNumbers
            current={page}
            pages={buildPageRange(page, totalPages)}
            isPending={isPending}
            pageLabel={pageLabel}
            onChange={onPageChange}
          />
        </div>

        <PageButton
          ariaLabel={nextLabel}
          disabled={page >= totalPages || isPending}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          <ChevronRight aria-hidden className="size-4" />
        </PageButton>
      </div>
    </nav>
  );
}

function PageNumbers({
  current,
  pages,
  isPending,
  pageLabel,
  onChange,
}: {
  current: number;
  pages: ReadonlyArray<number | "...">;
  isPending: boolean;
  pageLabel: string;
  onChange: (page: number) => void;
}) {
  return pages.map((item, index) =>
    item === "..." ? (
      <span
        key={`ellipsis-${index}`}
        aria-hidden
        className="flex size-5 items-center justify-center text-meta sm:size-9"
      >
        ...
      </span>
    ) : (
      <PageButton
        key={item}
        ariaLabel={`${pageLabel} ${item}`}
        current={current === item}
        disabled={isPending}
        onClick={() => onChange(item)}
      >
        {item}
      </PageButton>
    ),
  );
}

function PageButton({
  children,
  ariaLabel,
  current = false,
  disabled,
  onClick,
}: {
  children: ReactNode;
  ariaLabel: string;
  current?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-current={current ? "page" : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "ease-chrome flex size-11 shrink-0 items-center justify-center rounded-md text-xs font-medium tabular-nums sm:size-9",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        "disabled:pointer-events-none disabled:opacity-40",
        current
          ? "bg-primary/15 font-semibold text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
