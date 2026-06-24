import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

export default function GuideLoading() {
  return (
    <div className="space-y-8">
      <Surface variant="panel" className="p-8 text-center">
        <Skeleton className="mx-auto h-8 w-56" />
        <Skeleton className="mx-auto mt-3 h-4 w-80" />
      </Surface>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Surface key={i} variant="panel" className="p-5 space-y-3">
            <Skeleton className="size-10 rounded-lg" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </Surface>
        ))}
      </div>
    </div>
  );
}
