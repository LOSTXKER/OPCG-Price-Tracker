"use client";

import { useEffect, useState } from "react";

/**
 * `true` once the page is scrolled past `threshold` px — the single source for
 * the "transparent at top, frosted once scrolled" chrome pattern shared by the
 * desktop header, mobile header, and market ticker (CHROME-11).
 *
 * Starts `false` on the server AND the client's first render, then corrects in
 * an effect on mount — so it's safe under hydration and scroll restoration
 * (back/forward nav that mounts already-scrolled) without a `useHydrated` gate.
 */
export function useScrolled(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}
