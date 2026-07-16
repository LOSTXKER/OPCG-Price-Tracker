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
  /** Use a bounded control on toolbar surfaces where the soft fill would blend in. */
  appearance?: "soft" | "outline";
  /** Keep the mobile trigger width stable while labels change. */
  stableMobileWidth?: boolean;
  /** Optional row sizing for the dropdown options at a specific call site. */
  itemClassName?: string;
  className?: string;
}

export function ToolbarSortDropdown<TKey extends string = string>({
  options,
  activeKey,
  activeDir,
  onChange,
  fallbackLabel,
  align = "end",
  appearance = "soft",
  stableMobileWidth = false,
  itemClassName,
  className,
}: ToolbarSortDropdownProps<TKey>) {
  const active = options.find((o) => o.key === activeKey);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "group/toolbar-action inline-flex h-11 min-w-11 items-center justify-center rounded-md bg-transparent p-0 text-xs font-medium outline-none md:h-auto md:min-w-0",
          "focus-visible:ring-2 focus-visible:ring-ring/40",
          stableMobileWidth && "w-40 sm:w-auto",
          className,
        )}
      >
        <span
          className={cn(
            "pointer-events-none flex h-9 w-full min-w-0 items-center justify-between gap-1.5 overflow-hidden rounded-md border px-3 py-1.5 motion-base md:h-auto",
            appearance === "outline"
              ? "border-border bg-background text-foreground group-hover/toolbar-action:bg-muted/70"
              : "border-transparent bg-muted/50 text-foreground/80 group-hover/toolbar-action:bg-muted/70",
          )}
        >
          {activeDir === "desc" ? (
            <ArrowDown
              className={cn(
                "size-3 shrink-0",
                appearance === "outline" ? "text-muted-foreground" : "text-muted-foreground/60",
              )}
            />
          ) : (
            <ArrowUp
              className={cn(
                "size-3 shrink-0",
                appearance === "outline" ? "text-muted-foreground" : "text-muted-foreground/60",
              )}
            />
          )}
          <span className="min-w-0 flex-1 truncate text-left">
            {active?.label ?? fallbackLabel}
          </span>
          <ChevronDown
            className={cn(
              "size-3 shrink-0",
              appearance === "outline" ? "text-muted-foreground" : "text-muted-foreground/50",
            )}
          />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} sideOffset={4}>
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={cn(
              itemClassName,
              activeKey === opt.key && "font-semibold text-primary",
            )}
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
  /** Use a bounded control on toolbar surfaces where the soft fill would blend in. */
  appearance?: "soft" | "outline";
  /** Paint a square 36px frame inside the canonical 44px hit target. */
  iconOnly?: boolean;
}

export const FilterButton = forwardRef<HTMLButtonElement, FilterButtonProps>(
  function FilterButton({
    count,
    active,
    iconLeft = <SlidersHorizontal aria-hidden className="size-3.5" />,
    appearance = "soft",
    iconOnly = false,
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
          "group/toolbar-action inline-flex h-11 min-w-11 items-center justify-center rounded-md bg-transparent p-0 text-xs font-medium outline-none md:h-auto md:min-w-0",
          "focus-visible:ring-2 focus-visible:ring-ring/40",
          className,
        )}
        {...rest}
      >
        <span
          className={cn(
            "pointer-events-none relative inline-flex h-9 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-3 py-1.5 motion-base md:h-auto",
            active
              ? cn(
                  "bg-primary/15 text-primary group-hover/toolbar-action:bg-primary/20",
                  appearance === "outline" ? "border-primary/30" : "border-transparent",
                )
              : appearance === "outline"
                ? "border-border bg-background text-foreground group-hover/toolbar-action:bg-muted/70"
                : "border-transparent bg-muted/50 text-foreground/80 group-hover/toolbar-action:bg-muted/70",
            iconOnly && "size-9 px-0 sm:w-auto sm:px-3",
          )}
        >
          {iconLeft}
          {children}
          {showCount && (
            <span
              className={cn(
                "ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-micro tabular-nums",
                iconOnly && "absolute -right-1 -top-1 ml-0 sm:static sm:ml-0.5",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/15 text-primary",
              )}
            >
              {count}
            </span>
          )}
        </span>
      </button>
    );
  },
);
