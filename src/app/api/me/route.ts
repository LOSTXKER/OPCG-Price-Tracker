import { ListingStatus } from "@/generated/prisma/client";
import { syncAppUser } from "@/lib/auth/sync-app-user";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const cardInclude = {
  set: { select: { code: true, name: true, nameEn: true } },
} as const;

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await syncAppUser(user);

    const listings = await prisma.listing.findMany({
      where: { userId: dbUser.id, status: ListingStatus.ACTIVE },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        card: { include: cardInclude },
      },
    });

    return NextResponse.json({ user: dbUser, listings });
  } catch (error) {
    console.error("GET /api/me:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await syncAppUser(user);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const displayName =
      typeof body === "object" &&
      body !== null &&
      "displayName" in body &&
      typeof (body as { displayName: unknown }).displayName === "string"
        ? (body as { displayName: string }).displayName.trim().slice(0, 120)
        : "";

    if (!displayName) {
      return NextResponse.json({ error: "displayName is required" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: dbUser.id },
      data: { displayName },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("PATCH /api/me:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
