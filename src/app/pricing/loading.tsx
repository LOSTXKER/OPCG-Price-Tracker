export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <div className="h-4 w-14 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2 animate-pulse rounded bg-muted" />
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-9 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="panel flex h-[200px] flex-col gap-3 p-5">
            <div className="h-6 w-24 animate-pulse rounded bg-muted" />
            <div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />
            <div className="mt-auto space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
