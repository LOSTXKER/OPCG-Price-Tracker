"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ApiError, apiPost, apiTry } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import { useAuthState } from "@/hooks/use-auth-state";
import { invalidateSettings } from "@/hooks/use-settings";
import { stripGamePrefix } from "@/lib/game/constants";

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
    const routePath = stripGamePrefix(pathname);

    apiPost("/api/honey/missions", { action: "track-by-path", path: routePath }).catch(
      async (e) => {
        if (e instanceof ApiError && e.status === 401) {
          invalidateSettings();
          const supabase = createClient();
          await supabase.auth.signOut();
          return;
        }
        if (e instanceof ApiError && (e.status === 403 || e.status === 404)) return;
        console.error("[honey] mission track failed:", e);
      },
    );

    const setsMatch = SETS_RE.exec(routePath);
    if (setsMatch) {
      void apiTry(
        apiPost("/api/honey/raffle-missions", {
          action: "track",
          missionId: "explore_sets",
          dedupKey: setsMatch[1],
        }),
      );
    }

    const cardsMatch = CARDS_RE.exec(routePath);
    if (cardsMatch) {
      void apiTry(
        apiPost("/api/honey/raffle-missions", {
          action: "track",
          missionId: "check_cards",
          dedupKey: cardsMatch[1],
        }),
      );
    }

    if (routePath === "/trending") {
      const today = new Date().toISOString().slice(0, 10);
      void apiTry(
        apiPost("/api/honey/raffle-missions", {
          action: "track",
          missionId: "visit_trending",
          dedupKey: today,
        }),
      );
    }
  }, [pathname, authed]);

  return null;
}
