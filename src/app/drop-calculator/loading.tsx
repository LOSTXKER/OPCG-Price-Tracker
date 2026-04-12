export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <div className="h-4 w-14 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2 animate-pulse rounded bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-8 w-44 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel space-y-3 p-4">
          <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-32 w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="panel h-[200px] animate-pulse bg-muted" />
      </div>
    </div>
  );
}
