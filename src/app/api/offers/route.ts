import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

const log = createLog("api:offers");

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;
    const dbUser = auth.user;

    const parsed = await parseJsonBody<{
      listingId: number;
      priceThb: number;
      note?: string;
      parentId?: number;
    }>(request);
    if (!parsed.ok) return parsed.response;
    const { listingId, priceThb, note, parentId } = parsed.body;

    if (!listingId || !priceThb || priceThb <= 0) {
      return NextResponse.json(
        { error: "listingId and positive priceThb are required" },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true, status: true },
    });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Listing is not active" },
        { status: 400 }
      );
    }
    if (listing.userId === dbUser.id) {
      return NextResponse.json(
        { error: "Cannot make an offer on your own listing" },
        { status: 400 }
      );
    }

    if (parentId) {
      const parentOffer = await prisma.offer.findUnique({
        where: { id: parentId },
        select: { status: true, listingId: true },
      });
      if (!parentOffer || parentOffer.listingId !== listingId) {
        return NextResponse.json(
          { error: "Invalid parent offer" },
          { status: 400 }
        );
      }
    }

    const offer = await prisma.$transaction(async (tx) => {
      const newOffer = await tx.offer.create({
        data: {
          listingId,
          buyerId: dbUser.id,
          sellerId: listing.userId,
          priceThb,
          note: note?.trim() || null,
          parentId: parentId || null,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.message.create({
        data: {
          listingId,
          senderId: dbUser.id,
          receiverId: listing.userId,
          content: `เสนอราคา ฿${priceThb.toLocaleString()}${note ? ` - ${note.trim()}` : ""}`,
          type: "OFFER",
          offerId: newOffer.id,
        },
      });

      return newOffer;
    });

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    log.error("POST /api/offers", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
