export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="h-4 w-14 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2 animate-pulse rounded bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-8 w-48 max-w-full animate-pulse rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel h-[200px] animate-pulse bg-muted" />
        <div className="panel h-[200px] animate-pulse bg-muted" />
      </div>
    </div>
  );
}
