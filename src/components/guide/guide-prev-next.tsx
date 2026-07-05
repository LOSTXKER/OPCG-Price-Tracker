import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"

type NavLink = { href: string; label: string }

/**
 * The prev/next page navigation footer shared by the guide subpages. Either side
 * is optional (an empty `<span>` spacer keeps the other side aligned). prev =
 * muted + ArrowLeft; next = primary CTA + ArrowRight, both with hover motion.
 */
export function GuidePrevNext({ prev, next }: { prev?: NavLink; next?: NavLink }) {
  return (
    <div className="flex items-center justify-between border-t border-border pt-6">
      {prev ? (
        <Link
          href={prev.href}
          className="group inline-flex items-center gap-2 text-sm text-muted-foreground motion-base hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          {prev.label}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={next.href}
          className="group inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          {next.label}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : (
        <span />
      )}
    </div>
  )
}
