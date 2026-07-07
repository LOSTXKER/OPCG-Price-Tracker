import { cn } from "@/lib/utils";

export const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  AWAITING_PAYMENT: {
    label: "รอชำระเงิน",
    className: "status-warning",
  },
  PAID: {
    label: "ชำระแล้ว",
    className: "status-info",
  },
  SHIPPED: {
    label: "จัดส่งแล้ว",
    className: "status-info",
  },
  DELIVERED: {
    label: "ส่งถึงแล้ว",
    className: "status-success",
  },
  COMPLETED: {
    label: "สำเร็จ",
    className: "status-success",
  },
  CANCELLED: {
    label: "ยกเลิก",
    className: "status-danger",
  },
  DISPUTED: {
    label: "มีปัญหา",
    className: "status-warning",
  },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const config = ORDER_STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-micro",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
