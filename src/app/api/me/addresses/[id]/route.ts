import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/api-handler";
import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { UpdateAddressSchema } from "@/lib/me/schemas";

export const PATCH = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const existing = await prisma.shippingAddress.findFirst({
    where: { id, userId: auth.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  const parsed = await parseJsonBody(request, UpdateAddressSchema);
  if (!parsed.ok) return parsed.response;
  const { body } = parsed;

  if (body.isDefault) {
    await prisma.shippingAddress.updateMany({
      where: { userId: auth.user.id, id: { not: id } },
      data: { isDefault: false },
    });
  }

  const data: Record<string, unknown> = {};
  if (body.label !== undefined) data.label = body.label || null;
  if (body.fullName !== undefined) data.fullName = body.fullName;
  if (body.phone !== undefined) data.phone = body.phone || null;
  if (body.addressLine !== undefined) data.addressLine = body.addressLine;
  if (body.district !== undefined) data.district = body.district || null;
  if (body.province !== undefined) data.province = body.province;
  if (body.postalCode !== undefined) data.postalCode = body.postalCode;
  if (body.country !== undefined) data.country = body.country || "TH";
  if (body.isDefault !== undefined) data.isDefault = body.isDefault;

  const updated = await prisma.shippingAddress.update({
    where: { id },
    data,
  });

  return NextResponse.json({ address: updated });
});

export const DELETE = apiHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
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
});
