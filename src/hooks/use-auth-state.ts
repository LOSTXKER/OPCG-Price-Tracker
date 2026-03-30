"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Lightweight client-side auth check.
 * Returns `null` while loading, `true`/`false` once resolved.
 * Subscribes to auth state changes so login/logout in the same tab updates.
 */
export function useAuthState(): { authed: boolean | null } {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthed(!!session?.user);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  return { authed };
}
