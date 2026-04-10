import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

/**
 * Resolves the Supabase session to an admin app user.
 * Returns the user if admin, null otherwise.
 * Shared logic for both page guards (requireAdmin) and API guards (checkIsAdmin).
 */
export async function getAdminUser() {
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === "true") {
    return { id: "dev-bypass", isAdmin: true as const };
  }

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const appUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true, isAdmin: true },
  });

  if (!appUser?.isAdmin) return null;
  return appUser;
}
