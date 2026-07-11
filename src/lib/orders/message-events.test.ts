import { describe, expect, it } from "vitest";

import {
  encodeOrderMessageEvent,
  formatOrderMessageContent,
} from "./message-events";

describe("order message events", () => {
  it("stores language-neutral events and renders them for each viewer", () => {
    const content = encodeOrderMessageEvent({ kind: "buyer_marked_paid" });

    expect(content).not.toContain("ชำระ");
    expect(formatOrderMessageContent(content, "TH")).toBe("ผู้ซื้อแจ้งว่าชำระเงินแล้ว");
    expect(formatOrderMessageContent(content, "EN")).toBe("Buyer reported payment");
    expect(formatOrderMessageContent(content, "JP")).toBe("購入者が支払いを連絡しました");
  });

  it("localizes price parameters and preserves unknown messages", () => {
    const content = encodeOrderMessageEvent({ kind: "order_created", priceThb: 1290 });

    expect(formatOrderMessageContent(content, "EN")).toContain("฿1,290");
    expect(formatOrderMessageContent("hello", "TH")).toBe("hello");
  });

  it("keeps legacy Thai order updates readable in other languages", () => {
    expect(
      formatOrderMessageContent("ผู้ขายยกเลิกคำสั่งซื้อ", "EN"),
    ).toBe("Seller cancelled the order");
    expect(
      formatOrderMessageContent("ส่งของแล้ว (Kerry: TH123456)", "EN"),
    ).toBe("Seller reported the order as shipped · Kerry: TH123456");
    expect(
      formatOrderMessageContent("เสนอราคากลับ ฿1,500 - พร้อมส่ง", "EN"),
    ).toBe("Seller countered at ฿1,500 — พร้อมส่ง");
  });
});
