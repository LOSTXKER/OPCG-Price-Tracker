"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * `false` during SSR / the hydration render, `true` afterwards.
 * Replaces the `const [mounted, setMounted] = useState(false)` +
 * `useEffect(() => setMounted(true), [])` pattern (which the
 * react-hooks v6 `set-state-in-effect` rule rejects) with the
 * `useSyncExternalStore` idiom — no extra render cascade.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
