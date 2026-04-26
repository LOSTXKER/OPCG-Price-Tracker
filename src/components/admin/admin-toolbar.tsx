"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ── Search ── */

interface AdminSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export function AdminSearch({
  value,
  onChange,
  placeholder = "ค้นหา...",
  className,
  debounceMs = 400,
}: AdminSearchProps) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  function handleChange(v: string) {
    setLocal(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), debounceMs);
  }

  function handleClear() {
    setLocal("");
    onChange("");
  }

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
      <Input
        type="text"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 pl-9 pr-8"
      />
      {local && (
        <button
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground/60 transition-colors hover:text-foreground"
          aria-label="ล้างการค้นหา"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/* ── Filter Indicator ── */

interface AdminFilterCountProps {
  activeCount: number;
  onClear: () => void;
}

export function AdminFilterCount({
  activeCount,
  onClear,
}: AdminFilterCountProps) {
  if (activeCount === 0) return null;

  return (
    <button
      onClick={onClear}
      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
    >
      <SlidersHorizontal className="size-3" />
      ตัวกรอง {activeCount} รายการ
      <X className="size-3" />
    </button>
  );
}

/* ── Toolbar Container ── */

interface AdminToolbarProps {
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function AdminToolbar({
  children,
  actions,
  className,
}: AdminToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        className,
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
      {actions && (
        <div className="flex items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

/* ── Filter Select (wrapper for consistent styling) ── */

const ALL_SENTINEL = "__all__";

interface AdminFilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  className?: string;
}

export function AdminFilterSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
}: AdminFilterSelectProps) {
  const isActive = value !== "";
  const displayLabel = isActive
    ? options.find((o) => o.value === value)?.label ?? value
    : placeholder;

  return (
    <Select
      value={value || ALL_SENTINEL}
      onValueChange={(v) => onChange(v === ALL_SENTINEL ? "" : (v ?? ""))}
    >
      <SelectTrigger
        size="sm"
        className={cn(
          "h-9",
          isActive
            ? "border-primary/30 text-foreground"
            : "text-muted-foreground",
          className,
        )}
      >
        <span data-slot="select-value" className="flex flex-1 items-center gap-1.5 text-left line-clamp-1">
          {displayLabel}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_SENTINEL}>{placeholder}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
