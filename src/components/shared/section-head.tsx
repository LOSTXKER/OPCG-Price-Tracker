import { type ReactNode } from "react"

/** Shared section heading for every data section — one consistent rhythm (title
 *  left, optional action right) so a page reads as one calm document. Promoted
 *  out of card-detail as the first shared piece of the warm primitive kit; both
 *  card-detail and the homepage render through this. */
export function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <h2 className="text-h3">{title}</h2>
      {action}
    </div>
  )
}
