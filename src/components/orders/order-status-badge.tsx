import { cn } from "@/lib/utils";

export const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  AWAITING_PAYMENT: {
    label: "รอชำระเงิน",
    className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  },
  PAID: {
    label: "ชำระแล้ว",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  },
  SHIPPED: {
    label: "จัดส่งแล้ว",
    className: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  },
  DELIVERED: {
    label: "ส่งถึงแล้ว",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  COMPLETED: {
    label: "สำเร็จ",
    className: "bg-green-500/15 text-green-700 dark:text-green-400",
  },
  CANCELLED: {
    label: "ยกเลิก",
    className: "bg-red-500/15 text-red-700 dark:text-red-400",
  },
  DISPUTED: {
    label: "มีปัญหา",
    className: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
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
        "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
