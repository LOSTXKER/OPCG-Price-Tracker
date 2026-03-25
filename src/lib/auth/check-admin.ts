import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

/**
 * For use in API routes — returns true/false instead of redirecting.
 */
export async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return false;

  const appUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { isAdmin: true },
  });

  return appUser?.isAdmin === true;
}
