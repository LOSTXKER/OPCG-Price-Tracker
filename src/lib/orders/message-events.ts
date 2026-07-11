import { getLocale, t, type Language } from "@/lib/i18n";

const ORDER_EVENT_PREFIX = "meecard:order-event:";

export type OrderMessageEvent =
  | { kind: "order_created"; priceThb: number }
  | { kind: "offer_accepted"; priceThb: number }
  | { kind: "offer_rejected" }
  | { kind: "offer_cancelled" }
  | { kind: "counter_offer"; priceThb: number; note?: string }
  | { kind: "buyer_marked_paid" }
  | { kind: "buyer_cancelled" }
  | { kind: "seller_cancelled" }
  | { kind: "shipped"; shippingMethod?: string; trackingNumber?: string }
  | { kind: "disputed" }
  | { kind: "delivered" }
  | { kind: "completed" };

export function encodeOrderMessageEvent(event: OrderMessageEvent): string {
  return `${ORDER_EVENT_PREFIX}${JSON.stringify(event)}`;
}

function parsePrice(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function parseOrderMessageEvent(content: string): OrderMessageEvent | null {
  if (!content.startsWith(ORDER_EVENT_PREFIX)) return null;
  try {
    const value = JSON.parse(content.slice(ORDER_EVENT_PREFIX.length)) as Record<string, unknown>;
    switch (value.kind) {
      case "order_created":
      case "offer_accepted":
      case "counter_offer": {
        const priceThb = parsePrice(value.priceThb);
        if (priceThb === null) return null;
        return value.kind === "counter_offer"
          ? {
              kind: "counter_offer",
              priceThb,
              note: typeof value.note === "string" ? value.note : undefined,
            }
          : { kind: value.kind, priceThb };
      }
      case "offer_rejected":
      case "offer_cancelled":
      case "buyer_marked_paid":
      case "buyer_cancelled":
      case "seller_cancelled":
      case "disputed":
      case "delivered":
      case "completed":
        return { kind: value.kind };
      case "shipped":
        return {
          kind: "shipped",
          shippingMethod:
            typeof value.shippingMethod === "string" ? value.shippingMethod : undefined,
          trackingNumber:
            typeof value.trackingNumber === "string" ? value.trackingNumber : undefined,
        };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

function legacyOrderMessageEvent(content: string): OrderMessageEvent | null {
  const priceMatch = content.match(/฿([\d,]+)/);
  const priceThb = priceMatch ? Number(priceMatch[1]!.replaceAll(",", "")) : null;
  if (
    priceThb !== null &&
    (content.startsWith("สร้างคำสั่งซื้อ") || content.startsWith("ซื้อตามราคา"))
  ) {
    return { kind: "order_created", priceThb };
  }
  if (priceThb !== null && content.startsWith("ยอมรับข้อเสนอ")) {
    return { kind: "offer_accepted", priceThb };
  }
  if (content === "ปฏิเสธข้อเสนอ") return { kind: "offer_rejected" };
  if (content === "ยกเลิกข้อเสนอ") return { kind: "offer_cancelled" };
  if (priceThb !== null && content.startsWith("เสนอราคากลับ")) {
    const note = content.includes(" - ") ? content.split(" - ").slice(1).join(" - ") : undefined;
    return { kind: "counter_offer", priceThb, note };
  }
  if (content === "ผู้ซื้อแจ้งว่าชำระตามที่ตกลงแล้ว" || content === "แจ้งชำระเงินแล้ว") {
    return { kind: "buyer_marked_paid" };
  }
  if (content === "ยกเลิกคำสั่งซื้อ") return { kind: "buyer_cancelled" };
  if (content === "ผู้ขายยกเลิกคำสั่งซื้อ") return { kind: "seller_cancelled" };
  if (content.startsWith("ส่งของแล้ว")) {
    const tracking = content.match(/^ส่งของแล้ว \(([^:()]+): ([^)]+)\)$/);
    return {
      kind: "shipped",
      shippingMethod: tracking?.[1]?.trim(),
      trackingNumber: tracking?.[2]?.trim(),
    };
  }
  if (content === "แจ้งปัญหา") return { kind: "disputed" };
  if (content === "ได้รับสินค้าแล้ว") return { kind: "delivered" };
  if (content === "ยืนยันเสร็จสิ้น") return { kind: "completed" };
  return null;
}

function formatPrice(priceThb: number, lang: Language): string {
  return new Intl.NumberFormat(getLocale(lang), {
    maximumFractionDigits: 0,
  }).format(priceThb);
}

function formatEvent(event: OrderMessageEvent, lang: Language): string {
  switch (event.kind) {
    case "order_created":
      return t(lang, "orderEventCreated").replace(
        "{price}",
        formatPrice(event.priceThb, lang),
      );
    case "offer_accepted":
      return t(lang, "orderEventOfferAccepted").replace(
        "{price}",
        formatPrice(event.priceThb, lang),
      );
    case "offer_rejected":
      return t(lang, "orderEventOfferRejected");
    case "offer_cancelled":
      return t(lang, "orderEventOfferCancelled");
    case "counter_offer": {
      const base = t(lang, "orderEventCounterOffer").replace(
        "{price}",
        formatPrice(event.priceThb, lang),
      );
      return event.note ? `${base} — ${event.note}` : base;
    }
    case "buyer_marked_paid":
      return t(lang, "orderEventBuyerMarkedPaid");
    case "buyer_cancelled":
      return t(lang, "orderEventBuyerCancelled");
    case "seller_cancelled":
      return t(lang, "orderEventSellerCancelled");
    case "shipped": {
      const base = t(lang, "orderEventShipped");
      if (!event.trackingNumber) return base;
      return `${base} · ${t(lang, "orderEventTracking")
        .replace("{method}", event.shippingMethod || t(lang, "sellOrderTrackingNumber"))
        .replace("{tracking}", event.trackingNumber)}`;
    }
    case "disputed":
      return t(lang, "orderEventDisputed");
    case "delivered":
      return t(lang, "orderEventDelivered");
    case "completed":
      return t(lang, "orderEventCompleted");
  }
}

/** Render new event envelopes and known legacy Thai messages in the viewer's locale. */
export function formatOrderMessageContent(content: string, lang: Language): string {
  const event = parseOrderMessageEvent(content) ?? legacyOrderMessageEvent(content);
  return event ? formatEvent(event, lang) : content;
}
