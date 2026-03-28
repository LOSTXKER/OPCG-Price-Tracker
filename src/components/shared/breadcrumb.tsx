import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[]
  className?: string
}) {
  return (
    <nav
      className={cn("flex flex-wrap items-center gap-1 text-xs text-muted-foreground", className)}
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
                className="rounded px-1 py-0.5 transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
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
