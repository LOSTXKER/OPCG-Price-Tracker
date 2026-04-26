import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/api-handler";
import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";

const log = createLog("api:me:addresses");

export const GET = apiHandler(async () => {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const addresses = await prisma.shippingAddress.findMany({
      where: { userId: auth.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    log.error("GET /api/me/addresses", error);
    return NextResponse.json({ error: "Failed to load addresses" }, { status: 500 });
  }
});

export const POST = apiHandler(async (request: NextRequest) => {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const parsed = await parseJsonBody<{
      label?: string;
      fullName: string;
      phone?: string;
      addressLine: string;
      district?: string;
      province: string;
      postalCode: string;
      country?: string;
      isDefault?: boolean;
    }>(request);
    if (!parsed.ok) return parsed.response;
    const { body } = parsed;

    if (!body.fullName?.trim() || !body.addressLine?.trim() || !body.province?.trim() || !body.postalCode?.trim()) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    if (body.isDefault) {
      await prisma.shippingAddress.updateMany({
        where: { userId: auth.user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.shippingAddress.create({
      data: {
        userId: auth.user.id,
        label: body.label?.trim() || null,
        fullName: body.fullName.trim(),
        phone: body.phone?.trim() || null,
        addressLine: body.addressLine.trim(),
        district: body.district?.trim() || null,
        province: body.province.trim(),
        postalCode: body.postalCode.trim(),
        country: body.country?.trim() || "TH",
        isDefault: body.isDefault ?? false,
      },
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    log.error("POST /api/me/addresses", error);
    return NextResponse.json({ error: "Failed to create address" }, { status: 500 });
  }
});
