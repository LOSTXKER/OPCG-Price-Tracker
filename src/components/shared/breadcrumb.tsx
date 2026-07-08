import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { BackButton } from "./back-button"

export interface BreadcrumbItem {
  label: string
  href?: string
}

type BreadcrumbProps =
  | { items: BreadcrumbItem[]; pathname?: never; labelMap?: never; className?: string; hideMobileBack?: boolean }
  | { items?: never; pathname: string; labelMap: Record<string, string>; className?: string; hideMobileBack?: boolean }

function buildItemsFromPathname(pathname: string, labelMap: Record<string, string>): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length <= 1) return []

  return [
    // Localized via labelMap.home when the caller provides it (pathname mode);
    // falls back to "Home" only if omitted.
    { label: labelMap.home ?? "Home", href: "/" },
    ...segments.slice(1).map((seg, i) => {
      const href = "/" + segments.slice(0, i + 2).join("/")
      const label = labelMap[seg] ?? seg
      const isLast = i === segments.length - 2
      return { label, href: isLast ? undefined : href }
    }),
  ]
}

/**
 * Desktop (`md+`): the full "Home > Section > Current" trail, unchanged.
 *
 * Mobile (`<md`): no trail — a breadcrumb is desktop secondary navigation
 * (iOS has none; NN/g flags it as wasted vertical space on phones, and the
 * bottom-nav already communicates the active section). Instead, DEEP child
 * pages (3+ levels, e.g. portfolio detail / set detail / blog post) get a
 * single iOS-style "< Parent" back link — the same affordance the settings
 * sub-pages already use. Top-level pages (Home > X) render nothing on mobile.
 *
 * SEO is unaffected: rich results read the BreadcrumbList JSON-LD injected
 * separately (lib/seo/json-ld), not this visual markup.
 */
export function Breadcrumb(props: BreadcrumbProps) {
  const items = props.items ?? buildItemsFromPathname(props.pathname!, props.labelMap!)
  if (items.length === 0) return null

  const parent = items.length >= 3 ? items[items.length - 2] : null

  // Single wrapper (not a fragment) so parents using `space-y-*` still see
  // ONE child — a fragment's hidden sibling would still trigger `* + *`
  // margins on the visible one.
  return (
    <div className="min-w-0">
      {!props.hideMobileBack && parent?.href && (
        // Shared prominent honey back button (BackButton). -ml-1 optically aligns
        // the circle with the content edge. Pages that render their OWN inline
        // back button (beside the title) pass `hideMobileBack` to avoid a second.
        <BackButton
          href={parent.href}
          label={parent.label}
          className={cn("mb-4 -ml-1 md:hidden", props.className)}
        />
      )}

      <nav
        className={cn("mb-4 hidden flex-wrap items-center gap-1 text-meta md:flex", props.className)}
        aria-label="Breadcrumb"
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <span key={i} className="inline-flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3 text-muted-foreground/40" />}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="rounded-sm px-1 py-0.5 motion-base hover:text-primary focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={cn("px-1 py-0.5", isLast && "font-medium text-foreground")}>
                  {item.label}
                </span>
              )}
            </span>
          )
        })}
      </nav>
    </div>
  )
}
