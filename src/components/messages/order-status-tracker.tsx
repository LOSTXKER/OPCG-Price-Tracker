"use client";

import { cn } from "@/lib/utils";
import { t, type TranslationKey } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import {
  CreditCard,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import type { OrderStatusType } from "./types";

const STEPS: {
  key: OrderStatusType;
  labelKey: TranslationKey;
  shortLabelKey: TranslationKey;
  icon: React.ElementType;
}[] = [
  { key: "AWAITING_PAYMENT", labelKey: "msgOrderStatusAwaitingPayment", shortLabelKey: "msgOrderStatusAwaitingPaymentShort", icon: CreditCard },
  { key: "PAID", labelKey: "msgOrderStatusPaid", shortLabelKey: "msgOrderStatusPaidShort", icon: CreditCard },
  { key: "SHIPPED", labelKey: "msgOrderStatusShipped", shortLabelKey: "msgOrderStatusShippedShort", icon: Truck },
  { key: "DELIVERED", labelKey: "msgOrderStatusDelivered", shortLabelKey: "msgOrderStatusDeliveredShort", icon: Package },
  { key: "COMPLETED", labelKey: "msgOrderStatusCompleted", shortLabelKey: "msgOrderStatusCompletedShort", icon: CheckCircle2 },
];

const STATUS_INDEX: Record<string, number> = {
  AWAITING_PAYMENT: 0,
  PAID: 1,
  SHIPPED: 2,
  DELIVERED: 3,
  COMPLETED: 4,
};

export function OrderStatusTracker({
  status,
  trackingNumber,
  shippingMethod,
}: {
  status: string;
  trackingNumber?: string | null;
  shippingMethod?: string | null;
}) {
  const lang = useUIStore((s) => s.language);

  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
        <XCircle className="size-5 text-destructive" />
        <span className="text-sm font-medium text-destructive">{t(lang, "msgOrderCancelled")}</span>
      </div>
    );
  }
  if (status === "DISPUTED") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
        <AlertTriangle className="size-5 text-amber-500" />
        <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
          {t(lang, "msgOrderDisputed")}
        </span>
      </div>
    );
  }

  const currentIdx = STATUS_INDEX[status] ?? 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === currentIdx;
          const isPast = i < currentIdx;
          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border-2 transition-colors",
                    isPast && "border-emerald-500 bg-emerald-500 text-white",
                    isActive && "border-primary bg-primary text-primary-foreground",
                    !isPast && !isActive && "border-muted-foreground/30 text-muted-foreground/50"
                  )}
                >
                  <Icon className="size-3.5" />
                </div>
                <span
                  className={cn(
                    "text-xs leading-tight text-center",
                    isActive ? "font-semibold text-foreground" : "text-muted-foreground"
                  )}
                >
                  <span className="hidden sm:inline">{t(lang, step.labelKey)}</span>
                  <span className="sm:hidden">{t(lang, step.shortLabelKey)}</span>
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-0.5 h-0.5 flex-1 rounded-full",
                    isPast ? "bg-emerald-500" : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      {trackingNumber && (
        <p className="mt-2 text-meta">
          {shippingMethod && <span className="font-medium">{shippingMethod}: </span>}
          <span className="font-mono">{trackingNumber}</span>
        </p>
      )}
    </div>
  );
}
