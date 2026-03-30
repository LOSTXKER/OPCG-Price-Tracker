import { NextResponse } from "next/server";

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

type AuthUser = NonNullable<Awaited<ReturnType<typeof getAuthUser>>>;

/**
 * Requires an authenticated user. Returns the user on success,
 * or a 401 NextResponse on failure — matching the `parseJsonBody` convention.
 */
export async function requireAuthUser(): Promise<
  { ok: true; user: AuthUser } | { ok: false; response: NextResponse }
> {
  const dbUser = await getAuthUser();
  if (!dbUser) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, user: dbUser };
}
