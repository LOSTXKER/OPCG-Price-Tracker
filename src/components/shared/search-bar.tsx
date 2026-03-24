"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SearchIcon, XIcon } from "lucide-react";

import {
  SearchResultsDropdown,
  type SearchResult,
} from "@/components/shared/search-results-dropdown";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "opcg-recent-searches";
const MAX_RECENT = 6;

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is string => typeof x === "string")
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function writeRecent(items: string[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items.slice(0, MAX_RECENT))
    );
  } catch {
    /* ignore */
  }
}

export type SearchBarProps = {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  initialQuery?: string;
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
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setRecent(readRecent()), []);
  useEffect(() => setQuery(initialQuery), [initialQuery]);

  useEffect(() => {
    const t = window.setTimeout(() => onSearch?.(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query, onSearch]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) { setResults([]); return; }
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/cards?search=${encodeURIComponent(trimmed)}&limit=8`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => { setResults(data.cards ?? []); setActiveIdx(-1); })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [query]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const pushRecent = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecent((prev) => {
      const next = [trimmed, ...prev.filter((x) => x.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT);
      writeRecent(next);
      return next;
    });
  }, []);

  const commit = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    pushRecent(trimmed);
    setQuery(trimmed);
    setOpen(false);
    if (onCommitSearch) onCommitSearch(trimmed);
    else router.push(`/cards?search=${encodeURIComponent(trimmed)}`);
  }, [onCommitSearch, pushRecent, router]);

  const goToCard = useCallback((code: string) => {
    setOpen(false);
    router.push(`/cards/${code}`);
  }, [router]);

  const filteredRecent = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return recent;
    return recent.filter((r) => r.toLowerCase().includes(t));
  }, [recent, query]);

  const allItems = useMemo(() => {
    const items: { type: "result" | "recent"; key: string }[] = [];
    for (const r of results) items.push({ type: "result", key: r.baseCode ?? r.cardCode });
    if (results.length === 0) for (const r of filteredRecent) items.push({ type: "recent", key: r });
    return items;
  }, [results, filteredRecent]);

  const showList = open && (results.length > 0 || filteredRecent.length > 0 || loading);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, allItems.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Enter") {
      if (activeIdx >= 0 && activeIdx < allItems.length) {
        e.preventDefault();
        const item = allItems[activeIdx];
        if (item.type === "result") goToCard(item.key);
        else commit(item.key);
      }
    } else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full min-w-0", className)}>
      <form onSubmit={(e) => { e.preventDefault(); commit(query); }}>
        <div className="relative flex h-12 items-center rounded-xl border border-border bg-muted/50 transition-all focus-within:border-primary/30 focus-within:bg-background focus-within:shadow-sm">
          <SearchIcon className="ml-4 size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            aria-expanded={showList}
            aria-autocomplete="list"
          />
          {query ? (
            <button
              type="button"
              className="mr-2 flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
              aria-label="ล้างการค้นหา"
              onClick={() => { setQuery(""); setOpen(true); setResults([]); }}
            >
              <XIcon className="size-3.5" />
            </button>
          ) : (
            <kbd className="mr-3 hidden rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
              /
            </kbd>
          )}
        </div>
      </form>

      {showList && (
        <SearchResultsDropdown
          results={results}
          filteredRecent={filteredRecent}
          loading={loading}
          activeIdx={activeIdx}
          onSelectCard={goToCard}
          onSelectRecent={commit}
        />
      )}
    </div>
  );
}
