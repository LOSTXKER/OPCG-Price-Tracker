"use client";

import { useCallback, useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (event: StorageEvent) => {
    if (event.storageArea === window.localStorage) callback();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

/**
 * Persistent state backed by localStorage. Falls back gracefully when
 * `window` is unavailable (SSR) or storage is full / blocked.
 *
 * Uses `useSyncExternalStore` so the value stays consistent with the
 * underlying storage and matches across tabs.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const getSnapshot = () => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const value: T = (() => {
    if (raw == null) return initialValue;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return initialValue;
    }
  })();

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      if (typeof window === "undefined") return;
      let resolved: T;
      try {
        const current = window.localStorage.getItem(key);
        const parsedCurrent =
          current == null ? initialValue : (JSON.parse(current) as T);
        resolved =
          typeof next === "function"
            ? (next as (prev: T) => T)(parsedCurrent)
            : next;
      } catch {
        resolved = typeof next === "function" ? (next as (prev: T) => T)(initialValue) : next;
      }
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
        // Manually dispatch a storage event so same-tab listeners (this hook)
        // re-read the value, since browsers only fire 'storage' for other tabs.
        window.dispatchEvent(
          new StorageEvent("storage", {
            key,
            newValue: JSON.stringify(resolved),
            storageArea: window.localStorage,
          })
        );
      } catch {
      }
    },
    [key, initialValue]
  );

  return [value, setValue] as const;
}
