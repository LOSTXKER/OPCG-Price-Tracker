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

const log = createLog("api:orders");

type Params = { params: Promise<{ id: string }> };

const VALID_TRANSITIONS: Record<string, { next: OrderStatus; by: "buyer" | "seller"; systemMsg: string }[]> = {
  AWAITING_PAYMENT: [
    { next: "PAID", by: "buyer", systemMsg: "แจ้งชำระเงินแล้ว" },
    { next: "CANCELLED", by: "buyer", systemMsg: "ยกเลิกคำสั่งซื้อ" },
    { next: "CANCELLED", by: "seller", systemMsg: "ผู้ขายยกเลิกคำสั่งซื้อ" },
  ],
  PAID: [
    { next: "SHIPPED", by: "seller", systemMsg: "ส่งของแล้ว" },
    { next: "DISPUTED", by: "buyer", systemMsg: "แจ้งปัญหา" },
    { next: "CANCELLED", by: "seller", systemMsg: "ผู้ขายยกเลิกคำสั่งซื้อ" },
  ],
  SHIPPED: [
    { next: "DELIVERED", by: "buyer", systemMsg: "ได้รับสินค้าแล้ว" },
    { next: "DISPUTED", by: "buyer", systemMsg: "แจ้งปัญหา" },
  ],
  DELIVERED: [
    { next: "COMPLETED", by: "buyer", systemMsg: "ยืนยันเสร็จสิ้น" },
    { next: "COMPLETED", by: "seller", systemMsg: "ยืนยันเสร็จสิ้น" },
    { next: "DISPUTED", by: "buyer", systemMsg: "แจ้งปัญหา" },
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

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: updateData,
    });

    let msg = transition.systemMsg;
    if (newStatus === "SHIPPED" && trackingNumber) {
      msg += ` (${shippingMethod || "tracking"}: ${trackingNumber})`;
    }

    await tx.message.create({
      data: {
        listingId: order.listingId,
        senderId: dbUser.id,
        receiverId,
        content: msg,
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
  notify({
    userId: receiverId,
    kind: "ORDER_STATUS",
    type: `ORDER_${newStatus}`,
    title: `Order #${order.id}: ${transition.systemMsg}`,
    message:
      newStatus === "SHIPPED" && trackingNumber
        ? `${transition.systemMsg} (${shippingMethod || "tracking"}: ${trackingNumber})`
        : transition.systemMsg,
    data: { orderId: order.id, status: newStatus, listingId: order.listingId },
    dedupKey: `order-status:${order.id}:${newStatus}`,
  }).catch((err) => log.error("notify failed", err));

  return NextResponse.json({ order: result });
});
