"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Renders its children in the server HTML and in the first client render (so
 * hydration matches exactly), then drops them once the interactive island has
 * taken over.
 *
 * Used for the server-rendered search results: crawlers and no-JS visitors get
 * the list, while JS visitors never see it duplicated under the live results.
 */
export function UntilHydrated({ children }: { children: ReactNode }) {
  const hydrated = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (hydrated) return null;
  return <>{children}</>;
}
