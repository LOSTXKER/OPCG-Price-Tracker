import { createClient } from "@/lib/supabase/server";
import { isAuthBypassed } from "@/lib/env";
import { syncAppUser } from "./sync-app-user";

/**
 * Resolves the current Supabase session to an app-level User (upsert).
 * Returns null when no valid session exists.
 */
export async function getAuthUser() {
  if (isAuthBypassed()) {
    const { prisma } = await import("@/lib/db");
    return prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return syncAppUser(user);
}

export type AuthUser = NonNullable<Awaited<ReturnType<typeof getAuthUser>>>;
