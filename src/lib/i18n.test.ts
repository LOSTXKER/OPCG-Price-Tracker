import { describe, expect, it } from "vitest";

import { getHtmlLang, t } from "@/lib/i18n";

describe("getHtmlLang", () => {
  it.each([
    ["TH", "th"],
    ["EN", "en"],
    ["JP", "ja"],
  ] as const)("maps %s to %s", (language, expected) => {
    expect(getHtmlLang(language)).toBe(expected);
  });
});

describe("marketplace truth copy", () => {
  it.each([
    {
      language: "TH",
      createOrder: "สร้างคำสั่งซื้อ",
      manualPayment: "Meecard ไม่รับชำระเงินอัตโนมัติ กรุณาคุยกับผู้ขายและชำระตามวิธีที่ตกลงกัน",
      paidStatus: "ผู้ซื้อแจ้งชำระ",
      salesHistory: "ขายสำเร็จ 3+ ครั้ง",
      conditionHint: "เลือกได้ 1 สภาพ",
    },
    {
      language: "EN",
      createOrder: "Create order",
      manualPayment: "Meecard does not process payment automatically. Chat with the seller and pay using the method you agree on.",
      paidStatus: "Buyer marked paid",
      salesHistory: "3+ completed sales",
      conditionHint: "Choose one condition",
    },
    {
      language: "JP",
      createOrder: "注文を作成",
      manualPayment: "Meecardでは支払いを自動処理しません。出品者とチャットし、合意した方法で支払ってください。",
      paidStatus: "購入者が支払済みと連絡",
      salesHistory: "取引完了3件以上",
      conditionHint: "状態は1つ選択できます",
    },
  ] as const)("describes the real order flow in $language", (copy) => {
    expect(t(copy.language, "mktActionsBuyNow")).toBe(copy.createOrder);
    expect(t(copy.language, "buyOrderAwaitingPrompt")).toBe(copy.manualPayment);
    expect(t(copy.language, "orderStatusPaidExt")).toBe(copy.paidStatus);
    expect(t(copy.language, "sellerVerified")).toBe(copy.salesHistory);
    expect(t(copy.language, "mktFilterConditionHint")).toBe(copy.conditionHint);
  });
});
