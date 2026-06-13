import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder rows for the Yuyutei match table. */
export function SkeletonRows({ count = 5, showStatus = true }: { count?: number; showStatus?: boolean }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="border-b border-border/10">
          <td className="px-3 py-4"><Skeleton className="size-3.5 rounded" /></td>
          {showStatus && <td className="px-3 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>}
          <td className="px-3 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-16 aspect-[63/88] rounded shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </td>
          <td className="px-1 py-4" />
          <td className="px-3 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-16 aspect-[63/88] rounded shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </td>
          <td className="px-3 py-4"><Skeleton className="ml-auto h-4 w-14" /></td>
          <td className="px-3 py-4"><Skeleton className="h-5 w-16" /></td>
          <td className="px-3 py-4">
            <div className="space-y-1">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </td>
          <td className="px-3 py-4"><Skeleton className="mx-auto h-6 w-20" /></td>
        </tr>
      ))}
    </>
  );
}
