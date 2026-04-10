import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
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

export async function GET(_request: NextRequest, props: Params) {
  try {
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
  } catch (error) {
    log.error("GET /api/orders/[id]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, props: Params) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;
    const dbUser = auth.user;

    const { id } = await props.params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const parsed = await parseJsonBody<{
      status: OrderStatus;
      trackingNumber?: string;
      shippingMethod?: string;
      cancelReason?: string;
    }>(request);
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

    return NextResponse.json({ order: result });
  } catch (error) {
    log.error("PATCH /api/orders/[id]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
