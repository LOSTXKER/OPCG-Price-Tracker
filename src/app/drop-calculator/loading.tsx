import { Skeleton } from "@/components/ui/skeleton";

export function DropCalculatorWizardSkeleton() {
  return (
    <div
      data-testid="drop-wizard-loading"
      className="px-0.5"
    >
      <div className="flex items-center gap-3 sm:hidden">
        <div className="grid flex-1 grid-cols-3 gap-1.5">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-1 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-4 w-10" />
      </div>
      <div className="hidden grid-cols-3 sm:grid">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="relative flex min-w-0 items-center justify-center gap-2"
          >
            {index < 2 && (
              <span aria-hidden className="absolute left-1/2 top-3 h-px w-full bg-hair" />
            )}
            <Skeleton className="relative z-10 size-6 shrink-0 rounded-full" />
            <Skeleton className="relative z-10 h-3.5 w-24 bg-background" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DropCalculatorWorkspaceSkeleton() {
  return (
    <div data-testid="drop-workspace-loading" className="lg:flex lg:gap-8">
      <aside className="hidden w-52 shrink-0 space-y-5 lg:block">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-5 w-24" />
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-full rounded-md" />
          ))}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-5 space-y-3 lg:hidden">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-3 gap-x-2.5 gap-y-4 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }, (_, index) => (
            <div key={index} className="min-w-0 space-y-2">
              <Skeleton className="aspect-[63/88] w-full rounded-lg" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3.5 w-2/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="space-y-5 pt-3 sm:space-y-6 sm:pt-5">
      <div className="border-b border-hair pb-5 sm:pb-6">
        <div className="mb-4 sm:mb-5">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="mt-2 hidden h-4 w-72 max-w-full sm:block" />
        </div>
        <DropCalculatorWizardSkeleton />
      </div>
      <DropCalculatorWorkspaceSkeleton />
    </div>
  );
}
