import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

type PushNotificationParams = {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
};

export async function pushNotification(params: PushNotificationParams): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data ? (params.data as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch {
    // Best-effort — don't let notification failures break operations
  }
}

export async function pushNotificationBulk(
  notifications: PushNotificationParams[]
): Promise<void> {
  try {
    await prisma.notification.createMany({
      data: notifications.map((n) => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data ? (n.data as Prisma.InputJsonValue) : undefined,
      })),
    });
  } catch {
    // Best-effort
  }
}
