import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuthUser } from "@/lib/api/auth";
import { prisma } from "@/lib/db";
import { clientEnv, serverEnv } from "@/lib/env";
import { createLog } from "@/lib/logger";

const log = createLog("api:me:avatar");
const BUCKET = "avatars";
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

function getSupabaseAdmin() {
  const { SUPABASE_SERVICE_ROLE_KEY } = serverEnv();
  const { NEXT_PUBLIC_SUPABASE_URL } = clientEnv();
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  }
  return createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function ensureBucket(supabase: ReturnType<typeof getSupabaseAdmin>) {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_SIZE,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;
    const dbUser = auth.user;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    await ensureBucket(supabase);

    const ext = file.name.split(".").pop() || "png";
    const safeName = `${dbUser.id}-${Date.now()}.${ext}`;
    const path = `users/${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

    const updated = await prisma.user.update({
      where: { id: dbUser.id },
      data: { avatarUrl: publicUrlData.publicUrl },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    log.error("POST /api/me/avatar", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
