import type { User } from "@supabase/supabase-js";

import { prisma } from "@/lib/db";

/** Ensures a Prisma User exists for the signed-in Supabase user (email sign-up, etc.). */
export async function syncAppUser(authUser: User) {
  const email = authUser.email;
  if (!email) {
    throw new Error("Authenticated user has no email");
  }

  return prisma.user.upsert({
    where: { supabaseId: authUser.id },
    update: {},
    create: {
      supabaseId: authUser.id,
      email,
      displayName:
        (authUser.user_metadata?.full_name as string | undefined) ||
        (authUser.user_metadata?.name as string | undefined),
      avatarUrl: authUser.user_metadata?.avatar_url as string | undefined,
    },
  });
}
