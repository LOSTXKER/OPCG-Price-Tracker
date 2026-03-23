"use client";

import { Command as Cmdk } from "cmdk";
import { SearchIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "opcg-recent-searches";
const MAX_RECENT = 8;

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function writeRecent(items: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_RECENT)));
  } catch {
    /* ignore */
  }
}

export type SearchBarProps = {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  /** Hydrate from URL / SSR (e.g. browse page). */
  initialQuery?: string;
  /** When set, called instead of default `/cards?search=` navigation (preserve filters). */
  onCommitSearch?: (query: string) => void;
};

export function SearchBar({
  placeholder = "ค้นหาการ์ด...",
  onSearch,
  className,
  initialQuery = "",
  onCommitSearch,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      onSearch?.(query.trim());
    }, 300);
    return () => window.clearTimeout(t);
  }, [query, onSearch]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const pushRecent = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecent((prev) => {
      const next = [
        trimmed,
        ...prev.filter((x) => x.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, MAX_RECENT);
      writeRecent(next);
      return next;
    });
  }, []);

  const commit = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      pushRecent(trimmed);
      setQuery(trimmed);
      setOpen(false);
      if (onCommitSearch) {
        onCommitSearch(trimmed);
      } else {
        router.push(`/cards?search=${encodeURIComponent(trimmed)}`);
      }
    },
    [onCommitSearch, pushRecent, router]
  );

  const filteredRecent = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return recent;
    return recent.filter((r) => r.toLowerCase().includes(t));
  }, [recent, query]);

  const showList = open && (filteredRecent.length > 0 || query.trim().length > 0);

  return (
    <div ref={containerRef} className={cn("relative w-full min-w-0", className)}>
      <Command
        shouldFilter={false}
        className="overflow-visible rounded-lg border-0 bg-transparent p-0 shadow-none"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            commit(query);
          }}
        >
          <InputGroup className="h-9 rounded-lg bg-background pr-1">
            <InputGroupAddon align="inline-start" className="pl-2.5">
              <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
            </InputGroupAddon>
            <Cmdk.Input
              data-slot="input-group-control"
              value={query}
              onValueChange={setQuery}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              className={cn(
                "placeholder:text-muted-foreground flex-1 bg-transparent py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
              )}
              aria-expanded={showList}
              aria-controls="search-bar-suggestions"
              aria-autocomplete="list"
            />
            {query ? (
              <InputGroupAddon align="inline-end" className="pr-1">
                <InputGroupButton
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="ล้างการค้นหา"
                  onClick={() => {
                    setQuery("");
                    setOpen(true);
                  }}
                >
                  <XIcon className="size-3.5" />
                </InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>
        </form>

        {showList ? (
          <div
            id="search-bar-suggestions"
            className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10"
          >
            <CommandList className="max-h-64">
              <CommandEmpty className="py-3 text-sm text-muted-foreground">
                ไม่มีรายการล่าสุดที่ตรงกับคำค้น
              </CommandEmpty>
              {filteredRecent.length > 0 ? (
                <CommandGroup heading="ค้นหาล่าสุด">
                  {filteredRecent.map((item) => (
                    <CommandItem
                      key={item}
                      value={item}
                      onSelect={() => commit(item)}
                      className="cursor-pointer"
                    >
                      {item}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
            </CommandList>
          </div>
        ) : null}
      </Command>
    </div>
  );
}
