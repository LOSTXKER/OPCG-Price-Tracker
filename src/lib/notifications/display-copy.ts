import type { Currency } from "@/lib/i18n";
import { formatJpyAmount } from "@/lib/utils/currency";

type NotificationDisplaySource = {
  type: string;
  title: string;
  message: string;
  data?: unknown;
};

const JPY_AMOUNT = /¥\s?(\d[\d,]*(?:\.\d+)?)/u;

function dataAmount(data: unknown, key: "price" | "targetPrice"): number | null {
  if (data == null || typeof data !== "object") return null;
  const value = (data as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function replaceJpyAmount(
  copy: string,
  rawJpy: number | null,
  currency: Currency,
): string {
  const match = copy.match(JPY_AMOUNT);
  if (!match) return copy;

  const parsed = Number(match[1].replaceAll(",", ""));
  const jpy = rawJpy ?? (Number.isFinite(parsed) ? parsed : null);
  if (jpy == null) return copy;

  return copy.replace(match[0], formatJpyAmount(jpy, currency));
}

/**
 * PRICE_ALERT rows are stored in canonical JPY so server-side delivery can
 * compare and deduplicate consistently. The browser owns the user's display
 * preference, so convert the visible notification copy at render time.
 */
export function formatNotificationDisplayCopy(
  notification: NotificationDisplaySource,
  currency: Currency,
): { title: string; message: string } {
  if (notification.type !== "PRICE_ALERT") {
    return {
      title: notification.title,
      message: notification.message,
    };
  }

  return {
    title: replaceJpyAmount(
      notification.title,
      dataAmount(notification.data, "price"),
      currency,
    ),
    message: replaceJpyAmount(
      notification.message,
      dataAmount(notification.data, "targetPrice"),
      currency,
    ),
  };
}
