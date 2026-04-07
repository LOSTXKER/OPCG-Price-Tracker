import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

type AuditEntry = {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  details?: unknown;
};

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        userId: entry.userId ?? null,
        details: entry.details ? (entry.details as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch {
    // Best-effort logging — don't let audit failures break operations
  }
}
