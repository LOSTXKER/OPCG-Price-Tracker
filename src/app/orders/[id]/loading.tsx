export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2 animate-pulse rounded bg-muted" />
        <div className="h-4 w-36 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-9 w-64 max-w-full animate-pulse rounded-lg bg-muted" />
      <div className="panel min-h-[200px] animate-pulse bg-muted" />
    </div>
  );
}
