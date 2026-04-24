"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthState } from "@/hooks/use-auth-state";
import { invalidateSettings } from "@/hooks/use-settings";

const SETS_RE = /^\/sets\/([^/]+)/;
const CARDS_RE = /^\/cards\/([^/]+)/;

/**
 * Invisible component placed in the root layout.
 * On each client-side navigation it sends the current pathname to the
 * daily missions API and the monthly raffle missions API.
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
    }).then(async (r) => {
      if (r.status === 401) {
        invalidateSettings();
        const supabase = createClient();
        await supabase.auth.signOut();
      }
    }).catch((e) => console.error("[honey] mission track failed:", e));

    const setsMatch = SETS_RE.exec(pathname);
    if (setsMatch) {
      fetch("/api/honey/raffle-missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "track", missionId: "explore_sets", dedupKey: setsMatch[1] }),
      }).catch((e) => console.error("[honey] raffle mission track failed:", e));
    }

    const cardsMatch = CARDS_RE.exec(pathname);
    if (cardsMatch) {
      fetch("/api/honey/raffle-missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "track", missionId: "check_cards", dedupKey: cardsMatch[1] }),
      }).catch((e) => console.error("[honey] raffle mission track failed:", e));
    }

    if (pathname === "/trending") {
      const today = new Date().toISOString().slice(0, 10);
      fetch("/api/honey/raffle-missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "track", missionId: "visit_trending", dedupKey: today }),
      }).catch((e) => console.error("[honey] raffle mission track failed:", e));
    }
  }, [pathname, authed]);

  return null;
}
