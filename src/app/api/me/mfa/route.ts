import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/api-handler";
import { createClient } from "@/lib/supabase/server";

export const GET = apiHandler(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const factors = (data.totp ?? []).map((f) => ({
    id: f.id,
    friendlyName: f.friendly_name,
    status: f.status,
    createdAt: f.created_at,
  }));

  return NextResponse.json({ factors });
});

export const DELETE = apiHandler(async (req: NextRequest) => {
  const { factorId } = (await req.json()) as { factorId: string };
  if (!factorId) return NextResponse.json({ error: "factorId required" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
});
