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

    const portfolios = await prisma.portfolio.findMany({
      where: { userId: dbUser.id },
      orderBy: { updatedAt: "desc" },
      include: {
        items: {
          orderBy: { addedAt: "desc" },
          include: { card: { include: cardInclude } },
        },
      },
    });

    return NextResponse.json({ portfolios });
  } catch (error) {
    console.error("GET /api/portfolio:", error);
    return NextResponse.json({ error: "Failed to load portfolios" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const name =
      typeof body === "object" &&
      body !== null &&
      "name" in body &&
      typeof (body as { name: unknown }).name === "string"
        ? (body as { name: string }).name.trim()
        : "";

    if (!name || name.length > 120) {
      return NextResponse.json(
        { error: "name is required and must be at most 120 characters" },
        { status: 400 }
      );
    }

    const portfolio = await prisma.portfolio.create({
      data: {
        userId: dbUser.id,
        name,
      },
      include: {
        items: {
          include: { card: { include: cardInclude } },
        },
      },
    });

    return NextResponse.json({ portfolio }, { status: 201 });
  } catch (error) {
    console.error("POST /api/portfolio:", error);
    return NextResponse.json({ error: "Failed to create portfolio" }, { status: 500 });
  }
}
