import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
}

type BreadcrumbProps =
  | { items: BreadcrumbItem[]; pathname?: never; labelMap?: never; className?: string }
  | { items?: never; pathname: string; labelMap: Record<string, string>; className?: string }

function buildItemsFromPathname(pathname: string, labelMap: Record<string, string>): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length <= 1) return []

  return [
    { label: "Home", href: "/" },
    ...segments.slice(1).map((seg, i) => {
      const href = "/" + segments.slice(0, i + 2).join("/")
      const label = labelMap[seg] ?? seg
      const isLast = i === segments.length - 2
      return { label, href: isLast ? undefined : href }
    }),
  ]
}

export function Breadcrumb(props: BreadcrumbProps) {
  const items = props.items ?? buildItemsFromPathname(props.pathname!, props.labelMap!)
  if (items.length === 0) return null

  return (
    <nav
      className={cn("mb-4 flex flex-wrap items-center gap-1 text-meta", props.className)}
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
                className="rounded px-1 py-0.5 motion-base hover:text-primary focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
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
  )
}
