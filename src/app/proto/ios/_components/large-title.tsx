/**
 * iOS Large Title — the expanded page-identity header that lives in-flow at
 * the top of scrollable content. `IosShell` shows a compact version of the
 * same title in the frosted nav bar once the user scrolls past this point
 * (see `ios-shell.tsx`'s pathname → title lookup).
 */
export function LargeTitle({
  title,
  subtitle,
  trailing,
}: {
  title: string
  subtitle?: string
  trailing?: React.ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-3 px-4 pb-3 pt-2 sm:px-6">
      <div className="min-w-0">
        <h1 className="text-large-title truncate">{title}</h1>
        {subtitle && <p className="mt-1 text-body-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {trailing && <div className="flex shrink-0 items-center gap-1.5 pb-1">{trailing}</div>}
    </div>
  )
}
