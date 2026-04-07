import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";

const log = createLog("api:me:addresses:id");

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;
    const { id } = await params;

    const existing = await prisma.shippingAddress.findFirst({
      where: { id, userId: auth.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    const parsed = await parseJsonBody<{
      label?: string;
      fullName?: string;
      phone?: string;
      addressLine?: string;
      district?: string;
      province?: string;
      postalCode?: string;
      country?: string;
      isDefault?: boolean;
    }>(request);
    if (!parsed.ok) return parsed.response;
    const { body } = parsed;

    if (body.isDefault) {
      await prisma.shippingAddress.updateMany({
        where: { userId: auth.user.id, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const data: Record<string, unknown> = {};
    if (body.label !== undefined) data.label = body.label?.trim() || null;
    if (body.fullName !== undefined) data.fullName = body.fullName.trim();
    if (body.phone !== undefined) data.phone = body.phone?.trim() || null;
    if (body.addressLine !== undefined) data.addressLine = body.addressLine.trim();
    if (body.district !== undefined) data.district = body.district?.trim() || null;
    if (body.province !== undefined) data.province = body.province.trim();
    if (body.postalCode !== undefined) data.postalCode = body.postalCode.trim();
    if (body.country !== undefined) data.country = body.country?.trim() || "TH";
    if (body.isDefault !== undefined) data.isDefault = body.isDefault;

    const updated = await prisma.shippingAddress.update({
      where: { id },
      data,
    });

    return NextResponse.json({ address: updated });
  } catch (error) {
    log.error("PATCH /api/me/addresses/[id]", error);
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;
    const { id } = await params;

    const existing = await prisma.shippingAddress.findFirst({
      where: { id, userId: auth.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    await prisma.shippingAddress.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error("DELETE /api/me/addresses/[id]", error);
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
  }
}
