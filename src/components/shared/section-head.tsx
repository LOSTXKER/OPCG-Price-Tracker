import { type ReactNode } from "react"

/** Shared section heading for every data section — one consistent rhythm (title
 *  left, optional action right) so a page reads as one calm document. Promoted
 *  out of card-detail as the first shared piece of the warm primitive kit; both
 *  card-detail and the homepage render through this. */
export function SectionHead({
  title,
  action,
  description,
}: {
  title: string
  action?: ReactNode
  description?: string
}) {
  const heading = (
    <div className="flex items-end justify-between gap-3">
      <h2 className="text-h3">{title}</h2>
      {action}
    </div>
  )

  if (!description) {
    return <div className="mb-4">{heading}</div>
  }

  return (
    <div className="mb-4">
      {heading}
      <p className="mt-1.5 max-w-3xl text-body-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  )
}
