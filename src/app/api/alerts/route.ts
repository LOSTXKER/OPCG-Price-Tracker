import { requireAuthUser } from "@/lib/auth";
import { cardInclude } from "@/lib/api/query-fragments";
import { parseJsonBody } from "@/lib/api/request-body";
import { apiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";
import { CreateAlertSchema, UpdateAlertSchema } from "@/lib/alerts/schemas";
import { createAlert, updateAlert } from "@/lib/alerts/service";
import { NextRequest, NextResponse } from "next/server";

export const GET = apiHandler(async () => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const alerts = await prisma.priceAlert.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
    include: { card: { include: cardInclude } },
  });

  return NextResponse.json({ alerts });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, CreateAlertSchema);
  if (!parsed.ok) return parsed.response;

  const result = await createAlert(auth.user, parsed.body);
  if (!result.ok) return result.response;
  return NextResponse.json({ alert: result.alert }, { status: 201 });
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const idParam = request.nextUrl.searchParams.get("id");
  const id = idParam ? Number(idParam) : NaN;
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json(
      { error: "Query id is required and must be a positive integer" },
      { status: 400 },
    );
  }

  const parsed = await parseJsonBody(request, UpdateAlertSchema);
  if (!parsed.ok) return parsed.response;

  const result = await updateAlert(auth.user, id, parsed.body);
  if (!result.ok) return result.response;
  return NextResponse.json({ alert: result.alert });
});

export const DELETE = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const idParam = request.nextUrl.searchParams.get("id");
  const id = idParam ? Number(idParam) : NaN;
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Query id is required and must be a positive integer" }, { status: 400 });
  }

  const alert = await prisma.priceAlert.findFirst({
    where: { id, userId: auth.user.id },
  });

  if (!alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  await prisma.priceAlert.delete({ where: { id } });

  return NextResponse.json({ ok: true });
});
