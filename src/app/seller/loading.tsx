import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

export default function SellerLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Surface key={i} variant="panel" padding="md">
            <Skeleton className="mb-2 h-3 w-20" />
            <Skeleton className="h-7 w-24" />
          </Surface>
        ))}
      </div>
      <Surface variant="panel" padding="md">
        <Skeleton className="mb-3 h-5 w-32" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </Surface>
    </div>
  );
}
