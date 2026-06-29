"use client";

import { ArrowDownUp, type LucideIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type FilterChip<TValue extends string = string> = {
  value: TValue;
  label: string;
};

export type SortOption<TValue extends string = string> = {
  value: TValue;
  label: string;
};

/**
 * Shared toolbar shell used by Listings / Collection / Reviews tabs. We keep
 * one consistent visual so the three tabs feel like siblings — left side is
 * a horizontally-scrollable filter chip rail, right side is a sort dropdown.
 *
 * Filter chips render in their natural row on desktop and become snap-scroll
 * on mobile so we never wrap awkwardly. Sort lives in a dropdown to keep the
 * toolbar height fixed regardless of how many sort options each tab has.
 */
export function TabToolbar<F extends string, S extends string>({
  filters,
  activeFilter,
  onFilter,
  sortOptions,
  activeSort,
  onSort,
  lang,
  trailing,
  filterIcon,
}: {
  filters?: FilterChip<F>[];
  activeFilter?: F;
  onFilter?: (value: F) => void;
  sortOptions?: SortOption<S>[];
  activeSort?: S;
  onSort?: (value: S) => void;
  lang: Language;
  trailing?: React.ReactNode;
  filterIcon?: LucideIcon;
}) {
  const hasFilters = !!filters && filters.length > 0;
  const hasSort = !!sortOptions && sortOptions.length > 0;
  if (!hasFilters && !hasSort && !trailing) return null;

  const Icon = filterIcon;
  const activeSortLabel = sortOptions?.find((s) => s.value === activeSort)?.label;

  return (
    <div className="flex items-center gap-2">
      {hasFilters && (
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-px scrollbar-none">
          {filters!.map((f) => {
            const active = f.value === activeFilter;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => onFilter?.(f.value)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-[var(--p-hair)] bg-card/40 text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {Icon && <Icon className="mr-1 inline-block size-3" />}
                {f.label}
              </button>
            );
          })}
        </div>
      )}
      {!hasFilters && <div className="flex-1" />}

      {trailing}

      {hasSort && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-transparent dark:border-[var(--p-hair)] bg-card/40 px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-border hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <ArrowDownUp className="size-3" />
            <span className="max-w-[8rem] truncate">
              {activeSortLabel ?? t(lang, "toolbarSort")}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[10rem]">
            {sortOptions!.map((s) => (
              <DropdownMenuItem
                key={s.value}
                onClick={() => onSort?.(s.value)}
                className={cn(
                  s.value === activeSort && "font-semibold text-primary",
                )}
              >
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
