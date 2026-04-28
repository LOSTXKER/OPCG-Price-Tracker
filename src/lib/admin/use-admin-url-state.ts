"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Primitive = string | number | boolean;
type StateValue = Primitive | null | undefined;
type StateRecord = Record<string, StateValue>;

export interface UseAdminUrlStateOptions<T extends StateRecord> {
  /** Default values for every supported key. Keys not in this object are ignored. */
  defaults: T;
  /**
   * Optional list of keys to omit from the URL even when they are non-default.
   * Useful for transient state that you don't want to persist on refresh.
   */
  exclude?: ReadonlyArray<keyof T>;
  /** Push instead of replace (creates browser history entries). Defaults to false. */
  push?: boolean;
  /** Skip scroll restoration on URL update. Defaults to true. */
  noScroll?: boolean;
}

export interface UseAdminUrlStateResult<T extends StateRecord> {
  state: T;
  /** Replace the entire state object. */
  setState: (next: T | ((prev: T) => T)) => void;
  /** Patch a subset of keys (others are preserved). */
  patch: (partial: Partial<T>) => void;
  /** Reset every key back to its default. */
  reset: () => void;
}

/**
 * Sync a plain object with the URL's `?search=…` query string.
 *
 * - The URL is the source of truth on first render (so refresh / back-button works).
 * - Subsequent updates push changes back via `router.replace` (or `.push`).
 * - Keys whose value equals the default are omitted from the URL to keep it clean.
 *
 * Booleans are encoded as `"true"` / absent (false is treated as default).
 * Numbers go through Number(); NaN falls back to the default.
 */
export function useAdminUrlState<T extends StateRecord>(
  options: UseAdminUrlStateOptions<T>,
): UseAdminUrlStateResult<T> {
  const { defaults, exclude, push = false, noScroll = true } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const defaultsRef = useRef(defaults);
  defaultsRef.current = defaults;
  const excludeKeys = useMemo(
    () => new Set<keyof T>(exclude ?? []),
    [exclude],
  );

  const parseFromSearch = useCallback(
    (sp: URLSearchParams): T => {
      const next = { ...defaultsRef.current };
      for (const key of Object.keys(defaultsRef.current) as (keyof T)[]) {
        if (excludeKeys.has(key)) continue;
        const raw = sp.get(String(key));
        if (raw === null) continue;
        const def = defaultsRef.current[key];
        if (typeof def === "number") {
          const n = Number(raw);
          (next[key] as unknown) = Number.isFinite(n) ? n : def;
        } else if (typeof def === "boolean") {
          (next[key] as unknown) = raw === "true" || raw === "1";
        } else {
          (next[key] as unknown) = raw;
        }
      }
      return next;
    },
    [excludeKeys],
  );

  const [state, setStateInternal] = useState<T>(() => parseFromSearch(searchParams));

  // Keep state in sync if the URL changes externally (e.g. nav from another page).
  const lastWrittenRef = useRef<string>(searchParams.toString());
  useEffect(() => {
    const current = searchParams.toString();
    if (current === lastWrittenRef.current) return;
    lastWrittenRef.current = current;
    setStateInternal(parseFromSearch(searchParams));
  }, [searchParams, parseFromSearch]);

  // Push state → URL whenever state changes.
  useEffect(() => {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(state)) {
      if (excludeKeys.has(key as keyof T)) continue;
      const def = defaultsRef.current[key as keyof T];
      if (value === undefined || value === null) continue;
      if (value === def) continue;
      if (typeof value === "boolean") {
        if (value) sp.set(key, "true");
        continue;
      }
      sp.set(key, String(value));
    }
    const next = sp.toString();
    if (next === lastWrittenRef.current) return;
    lastWrittenRef.current = next;
    const target = next ? `${pathname}?${next}` : pathname;
    if (push) router.push(target, { scroll: !noScroll });
    else router.replace(target, { scroll: !noScroll });
  }, [state, pathname, router, push, noScroll, excludeKeys]);

  const setState = useCallback((next: T | ((prev: T) => T)) => {
    setStateInternal(next);
  }, []);

  const patch = useCallback((partial: Partial<T>) => {
    setStateInternal((prev) => ({ ...prev, ...partial }));
  }, []);

  const reset = useCallback(() => {
    setStateInternal({ ...defaultsRef.current });
  }, []);

  return { state, setState, patch, reset };
}
