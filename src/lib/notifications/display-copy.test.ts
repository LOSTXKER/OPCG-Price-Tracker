import { describe, expect, it } from "vitest";

import type { Currency } from "@/lib/i18n";
import { formatJpyAmount } from "@/lib/utils/currency";
import { formatNotificationDisplayCopy } from "./display-copy";

const PRICE_ALERT = {
  type: "PRICE_ALERT",
  title: "📉 Kuzan dropped to ¥980",
  message: "Target was ¥1,200.",
  data: {
    price: 980,
    targetPrice: 1_200,
  },
};

describe("formatNotificationDisplayCopy", () => {
  it.each<Currency>(["THB", "JPY", "USD"])(
    "formats in-app price alerts in the user's %s preference",
    (currency) => {
      expect(formatNotificationDisplayCopy(PRICE_ALERT, currency)).toEqual({
        title: `📉 Kuzan dropped to ${formatJpyAmount(980, currency)}`,
        message: `Target was ${formatJpyAmount(1_200, currency)}.`,
      });
    },
  );

  it("converts legacy price alerts that predate the raw numeric payload", () => {
    expect(
      formatNotificationDisplayCopy(
        {
          type: "PRICE_ALERT",
          title: "📈 Nami rose to ¥4,100",
          message: "Target was ¥3,500.",
        },
        "THB",
      ),
    ).toEqual({
      title: `📈 Nami rose to ${formatJpyAmount(4_100, "THB")}`,
      message: `Target was ${formatJpyAmount(3_500, "THB")}.`,
    });
  });

  it("does not reinterpret transaction notifications", () => {
    const source = {
      type: "ORDER_PAID",
      title: "Order paid",
      message: "Buyer paid ฿1,200.",
    };

    expect(formatNotificationDisplayCopy(source, "USD")).toEqual({
      title: source.title,
      message: source.message,
    });
  });
});
