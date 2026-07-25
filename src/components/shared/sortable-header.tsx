"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableHeaderProps<TCol extends string> {
  label: string;
  column: TCol;
  activeCol: TCol | null;
  dir: "asc" | "desc";
  onClick: (col: TCol) => void;
  align?: "left" | "right";
  className?: string;
  as?: "th" | "button";
  /** Allow long localized labels to use a second line in dense tables. */
  wrapLabel?: boolean;
}

export function SortableHeader<TCol extends string>({
  label,
  column,
  activeCol,
  dir,
  onClick,
  align = "left",
  className,
  as = "th",
  wrapLabel = false,
}: SortableHeaderProps<TCol>) {
  const isActive = activeCol === column;
  const Icon = isActive ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  if (as === "button") {
    return (
      <button
        type="button"
        aria-pressed={isActive}
        onClick={() => onClick(column)}
        className={cn("inline-flex min-h-11 items-center gap-1 text-xs font-medium sm:min-h-0", className)}
      >
        {label}
        <Icon
          className={cn(
            "size-3",
            isActive ? "text-foreground" : "opacity-30"
          )}
        />
      </button>
    );
  }

  return (
    <th
      aria-sort={isActive ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={cn(
        "select-none pr-3 font-medium",
        wrapLabel ? "whitespace-normal" : "whitespace-nowrap",
        align === "right" && "text-right",
        isActive && "text-foreground",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onClick(column)}
        className={cn(
          "group inline-flex min-h-11 items-center gap-1 py-2.5 motion-base hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-0",
          align === "right" && "flex-row-reverse",
          wrapLabel && "w-full min-w-0 whitespace-normal leading-tight",
        )}
      >
        {wrapLabel ? (
          <span className="min-w-0 whitespace-normal leading-tight">{label}</span>
        ) : (
          label
        )}
        <span className="inline-flex size-3 shrink-0 items-center justify-center">
          <Icon
            className={cn(
              "size-3 motion-base",
              isActive ? "text-primary" : "text-muted-foreground/50 group-hover:text-muted-foreground"
            )}
          />
        </span>
      </button>
    </th>
  );
}
