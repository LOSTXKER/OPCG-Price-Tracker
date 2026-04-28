import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/api-handler";
import { createClient } from "@/lib/supabase/server";

export const GET = apiHandler(async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const providers = (user.identities ?? []).map((identity) => ({
    provider: identity.provider,
    createdAt: identity.created_at,
  }));

  return NextResponse.json({ providers });
});
