"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuthState } from "@/hooks/use-auth-state";

/**
 * Invisible component placed in the root layout.
 * On each client-side navigation it sends the current pathname to the
 * missions API, which maps it to a daily-mission task (if any) and
 * records progress. The server handles deduplication so this is safe
 * to call on every navigation.
 */
export function MissionTracker() {
  const pathname = usePathname();
  const { authed } = useAuthState();

  useEffect(() => {
    if (authed !== true) return;

    fetch("/api/honey/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "track-by-path", path: pathname }),
    }).catch((e) => console.error("[honey] mission track failed:", e));
  }, [pathname, authed]);

  return null;
}
