import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { sendEmail } from "@/lib/email";
import { sendLineMessage } from "@/lib/line";
import { createLog } from "@/lib/logger";
import {
  NotificationDataSchema,
  type NotificationData,
} from "@/lib/notifications/schemas";
import {
  DEFAULT_NOTIFICATION_PREFS,
  type NotificationPrefsUpdate,
} from "@/lib/users/notification-prefs";

const log = createLog("notify");

/**
 * Notification kinds — coarse-grained channels that map to user
 * preference fields on the User table:
 *
 *   PRICE_ALERT  → notifyPrice{Email,Web,Line}
 *   ORDER_STATUS → notifyMarket{Email,Web,Line}
 *   MESSAGE      → notifyMarket{Email,Web,Line}
 *   OFFER        → notifyMarket{Email,Web,Line}
 *   HONEY        → notifyHoney{Email,Web,Line}
 *   DIGEST       → notifyDigest{Email,Web,Line}
 *
 * The `type` string on `Notification` is more granular (e.g. "ORDER_PAID",
 * "OFFER_COUNTER") and is used for filtering / deep-linking in the bell.
 */
export type NotifyKind = "PRICE_ALERT" | "ORDER_STATUS" | "MESSAGE" | "OFFER" | "HONEY" | "DIGEST";

export type NotifyDispatchInput = {
  userId: string;
  kind: NotifyKind;
  type: string;
  title: string;
  message: string;
  /** Extra payload merged into Notification.data and passed to render hooks. */
  data?: NotificationData;
  /** Optional override channels — if omitted, user prefs decide. */
  channels?: ReadonlyArray<"WEB" | "EMAIL" | "LINE">;
  /** Optional pre-rendered email body. If absent we fall back to a generic template. */
  email?: { subject: string; html: string; text?: string };
  /** Optional pre-rendered LINE text. If absent we fall back to `${title}\n\n${message}`. */
  lineText?: string;
  /**
   * If true and a notification with the same `(userId, type, dedupKey)`
   * was created within the last 24h, suppress this one. Useful for
   * coalescing duplicate price alerts or order status pings.
   */
  dedupKey?: string;
};

const KIND_PREF_FIELDS: Record<NotifyKind, { email: string; web: string; line: string }> = {
  PRICE_ALERT: { email: "notifyPriceEmail", web: "notifyPriceWeb", line: "notifyPriceLine" },
  ORDER_STATUS: { email: "notifyMarketEmail", web: "notifyMarketWeb", line: "notifyMarketLine" },
  MESSAGE: { email: "notifyMarketEmail", web: "notifyMarketWeb", line: "notifyMarketLine" },
  OFFER: { email: "notifyMarketEmail", web: "notifyMarketWeb", line: "notifyMarketLine" },
  HONEY: { email: "notifyHoneyEmail", web: "notifyHoneyWeb", line: "notifyHoneyLine" },
  DIGEST: { email: "notifyDigestEmail", web: "notifyDigestWeb", line: "notifyDigestLine" },
};

type UserNotifyPrefs = {
  email: string;
  lineUserId: string | null;
} & Required<NotificationPrefsUpdate>;

/**
 * Single entry point for cross-channel notifications.
 *
 * Reads the user's notification preferences once, then fans out to each
 * channel that the kind+pref combination allows. Each channel is
 * best-effort: a LINE failure does not prevent the in-app row from
 * being created. All errors are logged with `createLog("notify")`.
 *
 * Returns a record of which channels actually delivered (best-effort
 * — `email: true` only means the Resend API accepted the request).
 */
export async function notify(input: NotifyDispatchInput): Promise<{
  web: boolean;
  email: boolean;
  line: boolean;
}> {
  const result = { web: false, email: false, line: false };

  const row = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      email: true,
      lineUserId: true,
      notificationPrefs: true,
    },
  });

  if (!row) {
    log.warn("notify called for missing user", { userId: input.userId });
    return result;
  }

  // The satellite row is auto-created on first settings write — fall
  // back to the column defaults so a user who has never opened settings
  // still gets the default channels.
  const prefs = row.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFS;
  const user: UserNotifyPrefs = {
    email: row.email,
    lineUserId: row.lineUserId,
    ...prefs,
  };

  const fields = KIND_PREF_FIELDS[input.kind];
  const allowedChannels = input.channels ?? ["WEB", "EMAIL", "LINE"];

  const wantWeb =
    allowedChannels.includes("WEB") && (user as Record<string, unknown>)[fields.web] === true;
  const wantEmail =
    allowedChannels.includes("EMAIL") &&
    user.emailAlerts &&
    (user as Record<string, unknown>)[fields.email] === true;
  const wantLine =
    allowedChannels.includes("LINE") &&
    user.lineAlerts &&
    !!user.lineUserId &&
    (user as Record<string, unknown>)[fields.line] === true;

  if (input.dedupKey && wantWeb) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dup = await prisma.notification.findFirst({
      where: {
        userId: input.userId,
        type: input.type,
        createdAt: { gte: since },
        data: { path: ["dedupKey"], equals: input.dedupKey },
      },
      select: { id: true },
    });
    if (dup) {
      return result;
    }
  }

  if (wantWeb) {
    try {
      const merged: NotificationData = { ...(input.data ?? {}) };
      if (input.dedupKey) merged.dedupKey = input.dedupKey;
      const parsed = NotificationDataSchema.safeParse(merged);
      if (!parsed.success) {
        log.warn("in-app notification data rejected", {
          type: input.type,
          issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
        });
      } else {
        await prisma.notification.create({
          data: {
            userId: input.userId,
            type: input.type,
            title: input.title,
            message: input.message,
            data: parsed.data as Prisma.InputJsonValue,
          },
        });
        result.web = true;
      }
    } catch (err) {
      log.error("in-app notification failed", err);
    }
  }

  if (wantEmail) {
    try {
      const subject = input.email?.subject ?? input.title;
      const html =
        input.email?.html ??
        `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
           <h2 style="color:#73533E;">${escape(input.title)}</h2>
           <p>${escape(input.message)}</p>
         </div>`;
      const sent = await sendEmail({ to: user.email, subject, html, text: input.email?.text });
      result.email = !!sent;
    } catch (err) {
      log.error("email notification failed", err);
    }
  }

  if (wantLine && user.lineUserId) {
    try {
      const text = input.lineText ?? `${input.title}\n\n${input.message}`;
      result.line = await sendLineMessage(user.lineUserId, text);
    } catch (err) {
      log.error("line notification failed", err);
    }
  }

  return result;
}

/**
 * Fan-out helper for notifying many users at once (e.g. weekly digest,
 * price-alert hits in the same cron pass). Currently a thin loop —
 * keeps the call site simple and lets us swap in a queue later.
 */
export async function notifyBulk(inputs: NotifyDispatchInput[]): Promise<void> {
  await Promise.all(inputs.map((i) => notify(i).catch((err) => log.error("notifyBulk failed", err))));
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
