import { Skeleton } from "@/components/ui/skeleton"
import { Surface } from "@/components/ui/surface"
import { cn } from "@/lib/utils"

/** Loading rows that preserve OrderCard's header, 56×78 artwork and actions. */
export function OrdersListSkeleton({
  count = 5,
  label = "กำลังโหลดคำสั่งซื้อ",
  className,
}: {
  count?: number
  label?: string
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label={label}
      data-slot="orders-list-skeleton"
      className={cn("space-y-3", className)}
    >
      {Array.from({ length: count }).map((_, index) => (
        <Surface
          key={index}
          variant="panel"
          padding="none"
          data-slot="order-card-skeleton"
          className="p-4"
        >
          <div aria-hidden>
            <div className="mb-3 flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-32 max-w-[55%]" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            <div className="flex items-center gap-4">
              <Skeleton className="h-[78px] w-14 shrink-0 rounded-sm" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-40 max-w-full" />
                <Skeleton className="h-4 w-24 max-w-full" />
                <Skeleton className="h-3 w-28 max-w-full" />
              </div>
              <div className="w-20 shrink-0 space-y-1.5">
                <Skeleton className="ml-auto h-5 w-20" />
                <Skeleton className="ml-auto h-3 w-14" />
                <Skeleton className="ml-auto h-3 w-12" />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-end gap-2 border-t border-hair pt-3">
              <Skeleton className="h-9 w-20 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </div>
        </Surface>
      ))}
    </div>
  )
}
