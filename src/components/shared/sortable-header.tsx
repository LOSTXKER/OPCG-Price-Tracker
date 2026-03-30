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
}: SortableHeaderProps<TCol>) {
  const isActive = activeCol === column;
  const Icon = isActive ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  if (as === "button") {
    return (
      <button
        type="button"
        onClick={() => onClick(column)}
        className={cn("inline-flex items-center gap-1 text-xs font-medium", className)}
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
      className={cn(
        "group cursor-pointer select-none py-2.5 pr-3 font-medium transition-colors hover:text-foreground",
        align === "right" && "text-right",
        isActive && "text-foreground",
        className
      )}
      onClick={() => onClick(column)}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1",
          align === "right" && "flex-row-reverse"
        )}
      >
        {label}
        <Icon
          className={cn(
            "size-3 transition-opacity",
            isActive ? "text-primary" : "opacity-0 group-hover:opacity-40"
          )}
        />
      </span>
    </th>
  );
}
