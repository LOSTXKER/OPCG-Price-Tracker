import { NextRequest, NextResponse } from "next/server";
import { adminApiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { ADMIN_CONFIG_KEYS, invalidateAdminConfigCache } from "@/lib/admin/config";

export const GET = adminApiHandler(async (_req: NextRequest, _admin) => {
  const configs = await prisma.systemConfig.findMany({
    where: { key: { in: [...ADMIN_CONFIG_KEYS] } },
  });

  const configMap: Record<string, string> = {};
  for (const c of configs) configMap[c.key] = c.value;

  return NextResponse.json({ config: configMap });
});

export const PUT = adminApiHandler(async (request: NextRequest, admin) => {
  const body = await request.json() as Record<string, string>;

  const updates = Object.entries(body).filter(
    ([key]) => (ADMIN_CONFIG_KEYS as readonly string[]).includes(key)
  );

  if (updates.length === 0) {
    return NextResponse.json({ error: "No valid config keys" }, { status: 400 });
  }

  await Promise.all(
    updates.map(([key, value]) =>
      prisma.systemConfig.upsert({
        where: { key },
        update: { value: String(value), updatedBy: admin.id },
        create: { key, value: String(value), updatedBy: admin.id },
      })
    )
  );

  invalidateAdminConfigCache();

  await logAudit({
    action: "UPDATE_CONFIG",
    entity: "SystemConfig",
    userId: admin.id,
    details: body,
  });

  return NextResponse.json({ ok: true });
});
