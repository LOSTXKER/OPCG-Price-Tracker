/**
 * Module-level shared cache for client data that many components read but
 * that should be fetched at most once per tab (settings, public config,
 * fee tables, rank ladder...).
 *
 * Replaces the hand-rolled `_cache/_promise/_listeners` triple that was
 * copy-pasted across hooks. Designed to plug into `useSyncExternalStore`:
 *
 *   const resource = createSharedResource(() => apiGet<T>("/api/..."))
 *   const value = useSyncExternalStore(resource.subscribe, resource.get, () => null)
 *   useEffect(() => resource.ensure(), [])
 *
 * The fetcher's rejections resolve to `null` (cache cleared, listeners
 * notified) — fetchers that want a fallback value should catch internally.
 */
export type SharedResource<T> = {
  /** Current cached value (null = not loaded / failed). */
  get: () => T | null;
  /** Kick off a fetch if nothing is cached or in flight. */
  ensure: () => void;
  /** Force-fetch, reusing an in-flight request when present. */
  load: () => Promise<T | null>;
  /** Drop the cache so the next `ensure()`/`load()` refetches. */
  invalidate: () => void;
  /** `invalidate()` + `load()`. */
  refetch: () => Promise<T | null>;
  subscribe: (listener: () => void) => () => void;
};

export function createSharedResource<T>(
  fetcher: () => Promise<T | null>,
): SharedResource<T> {
  let cache: T | null = null;
  let inflight: Promise<T | null> | null = null;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((fn) => fn());

  const load = (): Promise<T | null> => {
    if (inflight) return inflight;
    inflight = fetcher()
      .catch(() => null)
      .then((value) => {
        cache = value;
        inflight = null;
        notify();
        return value;
      });
    return inflight;
  };

  return {
    get: () => cache,
    ensure: () => {
      if (!cache && !inflight) void load();
    },
    load,
    invalidate: () => {
      cache = null;
      inflight = null;
    },
    refetch: () => {
      cache = null;
      inflight = null;
      return load();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
