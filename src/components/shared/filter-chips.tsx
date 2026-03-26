"use client";

import { ChevronDownIcon } from "lucide-react";
import { useMemo } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type FilterDefinition = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

export type FilterChipsProps = {
  filters: FilterDefinition[];
  selected: Record<string, string[]>;
  onChange: (key: string, values: string[]) => void;
  className?: string;
};

export function FilterChips({
  filters,
  selected,
  onChange,
  className,
}: FilterChipsProps) {
  const hasAny = useMemo(
    () =>
      filters.some((f) => (selected[f.key]?.length ?? 0) > 0),
    [filters, selected]
  );

  const clearAll = () => {
    for (const f of filters) {
      if ((selected[f.key]?.length ?? 0) > 0) {
        onChange(f.key, []);
      }
    }
  };

  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center gap-2 overflow-x-auto pb-1",
        "[scrollbar-width:thin]",
        className
      )}
    >
      {filters.map((filter) => {
        const values = selected[filter.key] ?? [];
        const active = values.length > 0;

        return (
          <DropdownMenu key={filter.key}>
            <DropdownMenuTrigger
              type="button"
              className={cn(
                buttonVariants({
                  variant: active ? "default" : "outline",
                  size: "sm",
                }),
                "h-8 shrink-0 gap-1 rounded-full px-3 font-normal",
                !active && "border-border bg-card"
              )}
            >
              {filter.label}
              {active ? (
                <span className="bg-primary-foreground/20 ml-0.5 rounded-full px-1.5 py-0 text-xs tabular-nums">
                  {values.length}
                </span>
              ) : null}
              <ChevronDownIcon className="size-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{filter.label}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filter.options.map((opt) => {
                  const checked = values.includes(opt.value);
                  return (
                    <DropdownMenuCheckboxItem
                      key={opt.value}
                      checked={checked}
                      onCheckedChange={(next) => {
                        if (next) {
                          onChange(filter.key, [...values, opt.value]);
                        } else {
                          onChange(
                            filter.key,
                            values.filter((v) => v !== opt.value)
                          );
                        }
                      }}
                    >
                      {opt.label}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}

      {hasAny ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-8 shrink-0 px-2"
          onClick={clearAll}
        >
          ล้างทั้งหมด
        </Button>
      ) : null}
    </div>
  );
}
