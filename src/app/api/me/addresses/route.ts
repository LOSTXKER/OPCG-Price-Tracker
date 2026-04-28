import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/api-handler";
import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { CreateAddressSchema } from "@/lib/me/schemas";

export const GET = apiHandler(async () => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const addresses = await prisma.shippingAddress.findMany({
    where: { userId: auth.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ addresses });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, CreateAddressSchema);
  if (!parsed.ok) return parsed.response;
  const { body } = parsed;

  if (body.isDefault) {
    await prisma.shippingAddress.updateMany({
      where: { userId: auth.user.id },
      data: { isDefault: false },
    });
  }

  const address = await prisma.shippingAddress.create({
    data: {
      userId: auth.user.id,
      label: body.label || null,
      fullName: body.fullName,
      phone: body.phone || null,
      addressLine: body.addressLine,
      district: body.district || null,
      province: body.province,
      postalCode: body.postalCode,
      country: body.country || "TH",
      isDefault: body.isDefault ?? false,
    },
  });

  return NextResponse.json({ address }, { status: 201 });
});
