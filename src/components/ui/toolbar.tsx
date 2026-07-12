"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { ArrowDown, ArrowUp, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Layout primitive for toolbars / table headers.
 *
 * Use this in place of ad-hoc `flex items-center gap-2.5 border-b
 * border-border/30 px-5 py-3` rows above tables/grids. Variants control
 * spacing — `inset` for inside-`.panel` rows, `bare` for top-of-page rows.
 */
export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  variant?: "inset" | "bare";
}

export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  { left, center, right, variant = "inset", className, children, ...rest },
  ref,
) {
  const containerClass =
    variant === "inset"
      ? "flex flex-wrap items-center gap-2.5 border-b border-border/30 px-5 py-3 sm:px-6"
      : "flex flex-wrap items-center gap-2.5";

  return (
    <div ref={ref} className={cn(containerClass, className)} {...rest}>
      {left && <div className="flex items-center gap-2">{left}</div>}
      {children}
      {center && <div className="flex flex-1 items-center justify-center gap-2">{center}</div>}
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  );
});

/* ── Search ───────────────────────────────────────────────────────────── */

export interface ToolbarSearchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "size"> {
  value: string;
  onValueChange: (value: string) => void;
  /** Render the input collapsed behind a search-icon toggle. */
  collapsible?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: "sm" | "md";
  containerClassName?: string;
}

export function ToolbarSearch({
  value,
  onValueChange,
  collapsible = false,
  open,
  onOpenChange,
  placeholder,
  size = "md",
  className,
  containerClassName,
  onKeyDown,
  ...rest
}: ToolbarSearchProps) {
  const isOpen = collapsible ? Boolean(open) : true;

  if (collapsible && !isOpen) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange?.(true)}
        className="tap-safe rounded-lg p-2 text-muted-foreground/60 motion-base hover:bg-muted/70 hover:text-foreground"
        aria-label={placeholder ?? "Search"}
      >
        <Search className="size-4" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-11 items-center gap-1.5 rounded-lg border border-transparent dark:border-hair bg-muted/30 motion-base sm:min-h-0",
        size === "sm" ? "px-3 py-1.5" : "px-3 py-2",
        containerClassName,
      )}
    >
      <Search className="size-3.5 shrink-0 text-muted-foreground/60" />
      <input
        autoFocus={collapsible}
        type="text"
        className={cn(
          "min-w-0 bg-transparent outline-none placeholder:text-muted-foreground",
          size === "sm" ? "w-28 text-sm sm:w-40" : "w-full text-sm",
          className,
        )}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (collapsible && e.key === "Escape") {
            onValueChange("");
            onOpenChange?.(false);
          }
        }}
        {...rest}
      />
      {(value || collapsible) && (
        <button
          type="button"
          onClick={() => {
            onValueChange("");
            if (collapsible) onOpenChange?.(false);
          }}
          className="tap-safe rounded-sm p-0.5 text-muted-foreground/60 motion-base hover:text-foreground"
          aria-label="Clear"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}

/* ── Sort dropdown ────────────────────────────────────────────────────── */

export interface ToolbarSortOption<TKey extends string = string> {
  key: TKey;
  label: ReactNode;
}

export interface ToolbarSortDropdownProps<TKey extends string = string> {
  options: ReadonlyArray<ToolbarSortOption<TKey>>;
  activeKey: TKey;
  activeDir: "asc" | "desc";
  onChange: (key: TKey) => void;
  fallbackLabel?: ReactNode;
  align?: "start" | "end" | "center";
  className?: string;
}

export function ToolbarSortDropdown<TKey extends string = string>({
  options,
  activeKey,
  activeDir,
  onChange,
  fallbackLabel,
  align = "end",
  className,
}: ToolbarSortDropdownProps<TKey>) {
  const active = options.find((o) => o.key === activeKey);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex min-h-11 items-center gap-1.5 rounded-lg border border-transparent bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground/80 motion-base hover:bg-muted/70 sm:min-h-0 sm:rounded-md",
          className,
        )}
      >
        {activeDir === "desc" ? (
          <ArrowDown className="size-3 text-muted-foreground/60" />
        ) : (
          <ArrowUp className="size-3 text-muted-foreground/60" />
        )}
        {active?.label ?? fallbackLabel}
        <ChevronDown className="size-3 text-muted-foreground/50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} sideOffset={4}>
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={cn(activeKey === opt.key && "font-semibold text-primary")}
          >
            <span className="flex-1">{opt.label}</span>
            {activeKey === opt.key &&
              (activeDir === "desc" ? (
                <ArrowDown className="size-3 text-primary" />
              ) : (
                <ArrowUp className="size-3 text-primary" />
              ))}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── Filter button ────────────────────────────────────────────────────── */

export interface FilterButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  count?: number;
  active?: boolean;
  iconLeft?: ReactNode;
}

export const FilterButton = forwardRef<HTMLButtonElement, FilterButtonProps>(
  function FilterButton({
    count,
    active,
    iconLeft = <SlidersHorizontal aria-hidden className="size-3.5" />,
    className,
    children,
    "aria-haspopup": ariaHasPopup = "dialog",
    ...rest
  }, ref) {
    const showCount = typeof count === "number" && count > 0;
    return (
      <button
        ref={ref}
        type="button"
        aria-haspopup={ariaHasPopup}
        className={cn(
          "flex min-h-11 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium motion-base sm:min-h-0 sm:rounded-md",
          active
            ? "border-transparent bg-primary/15 text-primary hover:bg-primary/20"
            : "border-transparent bg-muted/50 text-foreground/80 hover:bg-muted/70",
          className,
        )}
        {...rest}
      >
        {iconLeft}
        {children}
        {showCount && (
          <span
            className={cn(
              "ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-micro tabular-nums",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-primary/15 text-primary",
            )}
          >
            {count}
          </span>
        )}
      </button>
    );
  },
);
