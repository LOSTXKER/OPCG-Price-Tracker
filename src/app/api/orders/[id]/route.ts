import { apiHandler } from "@/lib/api/api-handler";
import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { triggerAchievementCheck } from "@/lib/honey";
import { createLog } from "@/lib/logger";
import { guardMarketplaceApi } from "@/lib/marketplace/feature-flag";
import { notify } from "@/lib/notify/dispatch";
import { UpdateOrderSchema } from "@/lib/orders/schemas";
import { NextRequest, NextResponse } from "next/server";
import type { OrderStatus } from "@/generated/prisma/client";
import {
  encodeOrderMessageEvent,
  formatOrderMessageContent,
  type OrderMessageEvent,
} from "@/lib/orders/message-events";

const log = createLog("api:orders");

type Params = { params: Promise<{ id: string }> };

const VALID_TRANSITIONS: Record<string, { next: OrderStatus; by: "buyer" | "seller"; systemEvent: OrderMessageEvent }[]> = {
  AWAITING_PAYMENT: [
    { next: "PAID", by: "buyer", systemEvent: { kind: "buyer_marked_paid" } },
    { next: "CANCELLED", by: "buyer", systemEvent: { kind: "buyer_cancelled" } },
    { next: "CANCELLED", by: "seller", systemEvent: { kind: "seller_cancelled" } },
  ],
  PAID: [
    { next: "SHIPPED", by: "seller", systemEvent: { kind: "shipped" } },
    { next: "DISPUTED", by: "buyer", systemEvent: { kind: "disputed" } },
    { next: "CANCELLED", by: "seller", systemEvent: { kind: "seller_cancelled" } },
  ],
  SHIPPED: [
    { next: "DELIVERED", by: "buyer", systemEvent: { kind: "delivered" } },
    { next: "DISPUTED", by: "buyer", systemEvent: { kind: "disputed" } },
  ],
  DELIVERED: [
    { next: "COMPLETED", by: "buyer", systemEvent: { kind: "completed" } },
    { next: "COMPLETED", by: "seller", systemEvent: { kind: "completed" } },
    { next: "DISPUTED", by: "buyer", systemEvent: { kind: "disputed" } },
  ],
};

export const GET = apiHandler(async (_request: NextRequest, props: Params) => {
  const blocked = await guardMarketplaceApi();
  if (blocked) return blocked;

  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const dbUser = auth.user;

  const { id } = await props.params;
  const orderId = parseInt(id, 10);
  if (isNaN(orderId)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      listing: {
        select: {
          id: true,
          priceJpy: true,
          priceThb: true,
          condition: true,
          status: true,
          card: {
            select: {
              cardCode: true,
              nameJp: true,
              nameEn: true,
              imageUrl: true,
              rarity: true,
            },
          },
        },
      },
      buyer: { select: { id: true, displayName: true, avatarUrl: true } },
      seller: { select: { id: true, displayName: true, avatarUrl: true } },
      offer: { select: { id: true, priceThb: true, note: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.buyerId !== dbUser.id && order.sellerId !== dbUser.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  return NextResponse.json({ order });
});

export const PATCH = apiHandler(async (request: NextRequest, props: Params) => {
  const blocked = await guardMarketplaceApi();
  if (blocked) return blocked;

  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const dbUser = auth.user;

  const { id } = await props.params;
  const orderId = parseInt(id, 10);
  if (isNaN(orderId)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  const parsed = await parseJsonBody(request, UpdateOrderSchema);
  if (!parsed.ok) return parsed.response;
  const { status: newStatus, trackingNumber, shippingMethod, cancelReason } = parsed.body;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      buyerId: true,
      sellerId: true,
      listingId: true,
      priceThb: true,
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const isBuyer = order.buyerId === dbUser.id;
  const isSeller = order.sellerId === dbUser.id;
  if (!isBuyer && !isSeller) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const role = isBuyer ? "buyer" : "seller";
  const transitions = VALID_TRANSITIONS[order.status] || [];
  const transition = transitions.find(
    (t) => t.next === newStatus && t.by === role
  );
  if (!transition) {
    return NextResponse.json(
      {
        error: `Cannot transition from ${order.status} to ${newStatus} as ${role}`,
      },
      { status: 400 }
    );
  }

  const receiverId = isBuyer ? order.sellerId : order.buyerId;

  const timestampField: Record<string, string> = {
    PAID: "paidAt",
    SHIPPED: "shippedAt",
    DELIVERED: "deliveredAt",
    COMPLETED: "completedAt",
    CANCELLED: "cancelledAt",
  };

  const updateData: Record<string, unknown> = {
    status: newStatus,
  };
  const field = timestampField[newStatus];
  if (field) {
    updateData[field] = new Date();
  }
  if (newStatus === "SHIPPED") {
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (shippingMethod) updateData.shippingMethod = shippingMethod;
  }
  if (newStatus === "CANCELLED" && cancelReason) {
    updateData.cancelReason = cancelReason;
  }

  const systemEvent: OrderMessageEvent =
    newStatus === "SHIPPED"
      ? {
          kind: "shipped",
          shippingMethod: shippingMethod || undefined,
          trackingNumber: trackingNumber || undefined,
        }
      : transition.systemEvent;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: updateData,
    });

    await tx.message.create({
      data: {
        listingId: order.listingId,
        senderId: dbUser.id,
        receiverId,
        content: encodeOrderMessageEvent(systemEvent),
        type: "ORDER_UPDATE",
        orderId: order.id,
      },
    });

    if (newStatus === "CANCELLED") {
      await tx.listing.update({
        where: { id: order.listingId },
        data: { status: "ACTIVE" },
      });
    } else if (newStatus === "COMPLETED") {
      await tx.listing.update({
        where: { id: order.listingId },
        data: { status: "SOLD" },
      });
    }

    return updated;
  });

  if (newStatus === "COMPLETED") {
    // Buyer's order_buy_count uses Order rows where status=COMPLETED.
    triggerAchievementCheck(order.buyerId);
  }

  // In-app + email/LINE ping the counterparty about the status change.
  // Best-effort — we don't await on the order PATCH happy path.
  const notificationMessage = formatOrderMessageContent(
    encodeOrderMessageEvent(systemEvent),
    "EN",
  );
  notify({
    userId: receiverId,
    kind: "ORDER_STATUS",
    type: `ORDER_${newStatus}`,
    title: `Order #${order.id} updated`,
    message: notificationMessage,
    data: { orderId: order.id, status: newStatus, listingId: order.listingId },
    dedupKey: `order-status:${order.id}:${newStatus}`,
  }).catch((err) => log.error("notify failed", err));

  return NextResponse.json({ order: result });
});
