import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { prisma } from "@/lib/db";
import { processReferralConversion } from "@/lib/honey/referral";
import { createLog } from "@/lib/logger";

const log = createLog("auth:sync");

/** Ensures a Prisma User exists for the signed-in Supabase user (email sign-up, etc.). */
export async function syncAppUser(authUser: User) {
  const email = authUser.email;
  if (!email) {
    throw new Error("Authenticated user has no email");
  }

  const existing = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true },
  });

  const user = await prisma.user.upsert({
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

  if (!existing) {
    const jar = await cookies();
    const refCode = jar.get("ref_code")?.value;
    if (refCode) {
      // Awaited and logged. We still don't surface failures to the
      // sign-up flow because the user account is already valid; but
      // failure to credit the referrer is now visible in `auth:sync`
      // logs instead of silently swallowed. The grant itself is
      // idempotent (see processReferralConversion), so repeat runs
      // on retry are safe.
      try {
        await processReferralConversion(user.id, refCode);
      } catch (err) {
        log.error("processReferralConversion failed", err);
      }
      jar.delete("ref_code");
    }
  }

  return user;
}
