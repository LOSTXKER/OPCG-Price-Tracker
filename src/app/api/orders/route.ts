import { apiHandler } from "@/lib/api/api-handler";
import { requireAuthUser } from "@/lib/auth";
import { parseJsonBody, parsePageLimit } from "@/lib/api/request-body";
import { CreateOrderSchema } from "@/lib/orders/schemas";
import { createBuyNowOrder, listOrders } from "@/lib/orders/service";
import { NextRequest, NextResponse } from "next/server";

export const GET = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const sp = request.nextUrl.searchParams;
  const role = sp.get("role");
  if (role !== "buyer" && role !== "seller") {
    return NextResponse.json(
      { error: "role must be 'buyer' or 'seller'" },
      { status: 400 }
    );
  }

  const { page, limit, skip } = parsePageLimit(sp);
  const result = await listOrders({
    userId: auth.user.id,
    role,
    status: sp.get("status"),
    page,
    limit,
    skip,
  });

  return NextResponse.json(result);
});

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, CreateOrderSchema);
  if (!parsed.ok) return parsed.response;

  const result = await createBuyNowOrder(auth.user.id, parsed.body.listingId);
  if (!result.ok) return result.response;
  return NextResponse.json({ order: result.order }, { status: 201 });
});
