import { createClient } from "@/lib/supabase/server";
import { syncAppUser } from "@/lib/auth/sync-app-user";

/**
 * Resolves the current Supabase session to an app-level User (upsert).
 * Returns null when no valid session exists.
 */
export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return syncAppUser(user);
}
