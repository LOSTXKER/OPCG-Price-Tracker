import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Generic page-level skeleton: breadcrumb-ish header strip + title + a few
 * panel placeholders. Use this in `loading.tsx` files instead of stacking
 * raw `animate-pulse` divs (which differs visually from `<Skeleton />`'s
 * shimmer + radius).
 */
export function PageSkeleton({
  className,
  panels = 2,
  panelHeight = 200,
  showHeader = true,
}: {
  className?: string;
  panels?: number;
  panelHeight?: number;
  showHeader?: boolean;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {showHeader && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-48 max-w-full" />
        </>
      )}
      <div
        className={cn(
          "grid gap-4",
          panels >= 2 && "md:grid-cols-2",
          panels >= 3 && "lg:grid-cols-3",
        )}
      >
        {Array.from({ length: panels }).map((_, i) => (
          <Skeleton
            key={i}
            className="panel"
            style={{ height: `${panelHeight}px` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for a typical list/table loading state — header row + N body
 * rows of identical shape.
 */
export function TableSkeleton({
  rows = 8,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("panel divide-y divide-[var(--p-hair)]", className)}>
      <div className="grid items-center gap-3 p-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 w-20" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid items-center gap-3 p-3"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className="h-4 w-full max-w-[160px]" />
          ))}
        </div>
      ))}
    </div>
  );
}
