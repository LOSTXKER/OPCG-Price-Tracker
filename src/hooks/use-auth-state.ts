"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isAuthBypassed } from "@/lib/env";

/**
 * Lightweight client-side auth check.
 * Returns `null` while loading, `true`/`false` once resolved.
 * Subscribes to auth state changes so login/logout in the same tab updates.
 */
export function useAuthState(): {
  authed: boolean | null;
  error: string | null;
  retry: () => void;
} {
  const bypass = isAuthBypassed();
  const [authed, setAuthed] = useState<boolean | null>(bypass ? true : null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    if (bypass) return;
    setAuthed(null);
    setError(null);
    setAttempt((value) => value + 1);
  }, [bypass]);

  useEffect(() => {
    if (bypass) return;

    const supabase = createClient();
    let cancelled = false;

    void supabase.auth.getUser().then(({ data, error: authError }) => {
      if (cancelled) return;
      if (authError) {
        setError(authError.message);
        setAuthed(null);
        return;
      }
      setError(null);
      setAuthed(!!data.user);
    }).catch((reason: unknown) => {
      if (cancelled) return;
      setError(reason instanceof Error ? reason.message : "Authentication failed");
      setAuthed(null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setError(null);
        setAuthed(!!session?.user);
      },
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [attempt, bypass]);

  return { authed, error, retry };
}
