"use client";

import { t, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

export const ORDER_STATUS_CONFIG: Record<
  string,
  { labelKey: TranslationKey; className: string }
> = {
  AWAITING_PAYMENT: {
    labelKey: "orderStatusAwaitingPayment",
    className: "status-warning",
  },
  PAID: {
    labelKey: "orderStatusPaidExt",
    className: "status-info",
  },
  SHIPPED: {
    labelKey: "orderStatusShippedExt",
    className: "status-info",
  },
  DELIVERED: {
    labelKey: "orderStatusDelivered",
    className: "status-success",
  },
  COMPLETED: {
    labelKey: "orderStatusCompleted",
    className: "status-success",
  },
  CANCELLED: {
    labelKey: "orderStatusCancelled",
    className: "status-danger",
  },
  DISPUTED: {
    labelKey: "orderStatusDisputed",
    className: "status-warning",
  },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const lang = useUIStore((s) => s.language);
  const config = ORDER_STATUS_CONFIG[status] ?? {
    labelKey: null,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-micro",
        config.className
      )}
    >
      {config.labelKey ? t(lang, config.labelKey) : status}
    </span>
  );
}
