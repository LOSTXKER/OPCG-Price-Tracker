import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { clientEnv, serverEnv } from "@/lib/env";

const BUCKET = "listing-photos";
const MAX_SIZE = 5 * 1024 * 1024;

function getSupabaseAdmin() {
  const { SUPABASE_SERVICE_ROLE_KEY } = serverEnv();
  const { NEXT_PUBLIC_SUPABASE_URL } = clientEnv();
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  }
  return createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

let bucketChecked = false;

async function ensureBucket(
  supabase: ReturnType<typeof getSupabaseAdmin>
) {
  if (bucketChecked) return;
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_SIZE,
    });
  }
  bucketChecked = true;
}

export const POST = apiHandler(async (req: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);

  const ext = file.name.split(".").pop() || "png";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${auth.user.id}/${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (error) {
    console.error("[listing-upload] Supabase upload error:", error.message);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return NextResponse.json({ url: publicUrlData.publicUrl });
});
