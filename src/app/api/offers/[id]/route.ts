import { apiHandler } from "@/lib/api/api-handler";
import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
import { guardMarketplaceApi } from "@/lib/marketplace/feature-flag";
import { notify } from "@/lib/notify/dispatch";
import { UpdateOfferSchema } from "@/lib/offers/schemas";
import { NextRequest, NextResponse } from "next/server";
import { encodeOrderMessageEvent } from "@/lib/orders/message-events";

const log = createLog("api:offers");

function pingOffer(
  receiverId: string,
  type: "OFFER_ACCEPTED" | "OFFER_REJECTED" | "OFFER_CANCELLED" | "OFFER_COUNTER",
  title: string,
  message: string,
  offerId: number,
  extra?: Record<string, unknown>,
) {
  notify({
    userId: receiverId,
    kind: "OFFER",
    type,
    title,
    message,
    data: { offerId, ...(extra ?? {}) },
    dedupKey: `offer-event:${offerId}:${type}`,
  }).catch((err) => log.error("notify failed", err));
}

type Params = { params: Promise<{ id: string }> };

export const PATCH = apiHandler(async (request: NextRequest, props: Params) => {
  const blocked = await guardMarketplaceApi();
  if (blocked) return blocked;

  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const dbUser = auth.user;

  const { id } = await props.params;
  const offerId = parseInt(id, 10);
  if (isNaN(offerId)) {
    return NextResponse.json({ error: "Invalid offer ID" }, { status: 400 });
  }

  const parsed = await parseJsonBody(request, UpdateOfferSchema);
  if (!parsed.ok) return parsed.response;
  const { action, counterPrice, counterNote } = parsed.body;

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      listing: { select: { id: true, userId: true, priceJpy: true, priceThb: true } },
    },
  });
  if (!offer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }
  if (offer.status !== "PENDING") {
    return NextResponse.json(
      { error: "Offer is no longer pending" },
      { status: 400 }
    );
  }

  const isBuyer = offer.buyerId === dbUser.id;
  const isSeller = offer.sellerId === dbUser.id;
  if (!isBuyer && !isSeller) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  switch (action) {
      case "accept": {
        if (!isSeller) {
          return NextResponse.json(
            { error: "Only seller can accept" },
            { status: 403 }
          );
        }

        const result = await prisma.$transaction(async (tx) => {
          const updated = await tx.offer.update({
            where: { id: offerId },
            data: { status: "ACCEPTED" },
          });

          const order = await tx.order.create({
            data: {
              listingId: offer.listingId,
              offerId: offer.id,
              buyerId: offer.buyerId,
              sellerId: offer.sellerId,
              priceThb: offer.priceThb,
            },
          });

          await tx.listing.update({
            where: { id: offer.listingId },
            data: { status: "RESERVED" },
          });

          await tx.message.create({
            data: {
              listingId: offer.listingId,
              senderId: dbUser.id,
              receiverId: offer.buyerId,
              content: encodeOrderMessageEvent({
                kind: "offer_accepted",
                priceThb: offer.priceThb,
              }),
              type: "ORDER_UPDATE",
              offerId: offer.id,
              orderId: order.id,
            },
          });

          return { updated, order };
        });

        pingOffer(
          offer.buyerId,
          "OFFER_ACCEPTED",
          "Offer accepted",
          `Your ฿${offer.priceThb.toLocaleString()} offer was accepted — please pay to confirm.`,
          offer.id,
          { orderId: result.order.id, listingId: offer.listingId },
        );

        return NextResponse.json({
          offer: result.updated,
          order: result.order,
        });
      }

      case "reject": {
        if (!isSeller) {
          return NextResponse.json(
            { error: "Only seller can reject" },
            { status: 403 }
          );
        }

        const updated = await prisma.$transaction(async (tx) => {
          const rejected = await tx.offer.update({
            where: { id: offerId },
            data: { status: "REJECTED" },
          });

          await tx.message.create({
            data: {
              listingId: offer.listingId,
              senderId: dbUser.id,
              receiverId: offer.buyerId,
              content: encodeOrderMessageEvent({ kind: "offer_rejected" }),
              type: "SYSTEM",
              offerId: offer.id,
            },
          });

          return rejected;
        });

        pingOffer(
          offer.buyerId,
          "OFFER_REJECTED",
          "Offer rejected",
          `Your ฿${offer.priceThb.toLocaleString()} offer was declined.`,
          offer.id,
          { listingId: offer.listingId },
        );

        return NextResponse.json({ offer: updated });
      }

      case "cancel": {
        if (!isBuyer) {
          return NextResponse.json(
            { error: "Only buyer can cancel their offer" },
            { status: 403 }
          );
        }

        const updated = await prisma.$transaction(async (tx) => {
          const cancelled = await tx.offer.update({
            where: { id: offerId },
            data: { status: "CANCELLED" },
          });

          await tx.message.create({
            data: {
              listingId: offer.listingId,
              senderId: dbUser.id,
              receiverId: offer.sellerId,
              content: encodeOrderMessageEvent({ kind: "offer_cancelled" }),
              type: "SYSTEM",
              offerId: offer.id,
            },
          });

          return cancelled;
        });

        pingOffer(
          offer.sellerId,
          "OFFER_CANCELLED",
          "Offer cancelled",
          `Buyer cancelled their ฿${offer.priceThb.toLocaleString()} offer.`,
          offer.id,
          { listingId: offer.listingId },
        );

        return NextResponse.json({ offer: updated });
      }

      case "counter": {
        if (!isSeller) {
          return NextResponse.json(
            { error: "Only seller can counter-offer" },
            { status: 403 }
          );
        }
        if (!counterPrice || counterPrice <= 0) {
          return NextResponse.json(
            { error: "counterPrice is required and must be positive" },
            { status: 400 }
          );
        }

        const result = await prisma.$transaction(async (tx) => {
          await tx.offer.update({
            where: { id: offerId },
            data: { status: "COUNTERED" },
          });

          const counter = await tx.offer.create({
            data: {
              listingId: offer.listingId,
              buyerId: offer.sellerId,
              sellerId: offer.buyerId,
              priceThb: counterPrice,
              note: counterNote?.trim() || null,
              parentId: offerId,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });

          await tx.message.create({
            data: {
              listingId: offer.listingId,
              senderId: dbUser.id,
              receiverId: offer.buyerId,
              content: encodeOrderMessageEvent({
                kind: "counter_offer",
                priceThb: counterPrice,
                note: counterNote?.trim() || undefined,
              }),
              type: "OFFER",
              offerId: counter.id,
            },
          });

          return counter;
        });

        pingOffer(
          offer.buyerId,
          "OFFER_COUNTER",
          "Counter-offer received",
          `Seller countered with ฿${counterPrice.toLocaleString()}${counterNote ? ` — ${counterNote.trim()}` : ""}.`,
          result.id,
          { listingId: offer.listingId, parentOfferId: offer.id },
        );

        return NextResponse.json({ offer: result });
      }

    default:
      return NextResponse.json(
        { error: "Invalid action. Use: accept, reject, cancel, counter" },
        { status: 400 }
      );
  }
});
