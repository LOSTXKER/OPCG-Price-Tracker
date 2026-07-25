import { Skeleton } from "@/components/ui/skeleton";
import { OrdersListSkeleton } from "@/components/orders/orders-list-skeleton";

export default function OrdersLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-8 w-48" />

      <div className="no-sb flex h-11 max-w-full gap-0.5 overflow-hidden rounded-xl bg-muted/50 sm:h-10 sm:p-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-20 shrink-0 rounded-lg sm:h-8 sm:rounded-md" />
        ))}
      </div>

      <OrdersListSkeleton />
    </div>
  );
}
