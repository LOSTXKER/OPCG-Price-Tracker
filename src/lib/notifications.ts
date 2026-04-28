import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
import {
  NotificationDataSchema,
  type NotificationData,
} from "@/lib/notifications/schemas";

const log = createLog("notifications");

type PushNotificationParams = {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: NotificationData;
};

/**
 * Validate and serialize the optional `data` payload for a Notification
 * row. Bad shapes are dropped (with a warning) instead of crashing the
 * caller — this is a fire-and-forget helper for non-critical UX.
 */
function serializeData(
  data: NotificationData | undefined,
): Prisma.InputJsonValue | undefined {
  if (!data) return undefined;
  const parsed = NotificationDataSchema.safeParse(data);
  if (!parsed.success) {
    log.warn("invalid Notification.data dropped", {
      issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
    });
    return undefined;
  }
  return parsed.data as Prisma.InputJsonValue;
}

export async function pushNotification(params: PushNotificationParams): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: serializeData(params.data),
      },
    });
  } catch (err) {
    log.error("pushNotification failed", err);
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
        data: serializeData(n.data),
      })),
    });
  } catch (err) {
    log.error("pushNotificationBulk failed", err);
  }
}
