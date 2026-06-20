import { type ReactNode } from "react"

/** Shared heading for every below-the-fold data section — one consistent rhythm
 *  (title left, optional action right) so the lower page reads as a pro document. */
export function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <h2 className="text-h3">{title}</h2>
      {action}
    </div>
  )
}
