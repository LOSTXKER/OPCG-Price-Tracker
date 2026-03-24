import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login?redirect=/admin");

  const appUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true, isAdmin: true },
  });

  if (!appUser?.isAdmin) redirect("/");

  return appUser;
}
