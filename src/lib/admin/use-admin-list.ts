"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminFetch } from "./admin-fetch";

export interface UseAdminListOptions<T, P> {
  /**
   * Returns the URL (with query string) to fetch.
   * Receives the current params object from the caller.
   */
  url: (params: P) => string;
  /** Initial param object — fetched on mount and whenever it changes (via shallow equality of `key`). */
  params: P;
  /** Stable serialization of `params` for memoization. Defaults to `JSON.stringify(params)`. */
  key?: string;
  /** If false, skip fetching (useful when waiting for a prerequisite). Defaults to true. */
  enabled?: boolean;
  /** Initial data so the first render isn't empty (e.g. SSR-prefetched). */
  initialData?: T;
  /** If true, don't clear the existing data while the next fetch is in flight. Defaults to true. */
  keepPreviousData?: boolean;
  /** Show a sonner toast on fetch error. Defaults to false (consumer handles it). */
  toastOnError?: boolean | string;
}

export interface UseAdminListResult<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | undefined>>;
}

/**
 * Generic admin list-fetching hook.
 *
 * Handles:
 * - loading / error state
 * - request cancellation when params change
 * - keep-previous-data on refetch (so the table doesn't flash empty)
 *
 * Only the params (or `key`) drive refetching; the `url` callback is
 * captured by ref so callers can pass an inline arrow function.
 */
export function useAdminList<T, P>({
  url,
  params,
  key,
  enabled = true,
  initialData,
  keepPreviousData = true,
  toastOnError,
}: UseAdminListOptions<T, P>): UseAdminListResult<T> {
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  const urlRef = useRef(url);
  urlRef.current = url;
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const abortRef = useRef<AbortController | null>(null);
  const serializedKey = key ?? JSON.stringify(params);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);
    if (!keepPreviousData) setData(undefined);

    try {
      const target = urlRef.current(paramsRef.current);
      const result = await adminFetch<T>(target, { signal: ac.signal, toastOnError });
      if (!ac.signal.aborted) setData(result);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const message = err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ";
      if (!ac.signal.aborted) setError(message);
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [keepPreviousData, toastOnError]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void fetchData();
    return () => {
      abortRef.current?.abort();
    };
  }, [serializedKey, enabled, fetchData]);

  return { data, loading, error, refetch: fetchData, setData };
}
