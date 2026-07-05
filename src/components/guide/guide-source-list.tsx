import Link from "next/link"
import { ArrowRight, ExternalLink } from "lucide-react"

import { Surface } from "@/components/ui/surface"

export type GuideSource = {
  label: string
  desc: string
  url: string
  /** internal link (Next <Link> + ArrowRight) vs external (<a target=_blank> + ExternalLink). */
  internal?: boolean
}

/**
 * The "แหล่งอ้างอิง / Sources" reference list shared by the guide subpages — a
 * divided outline Surface of label+desc rows with a trailing link icon. Pages
 * keep owning their own source data (labels/URLs hardcoded, desc via t()).
 */
export function GuideSourceList({ heading, sources }: { heading: string; sources: GuideSource[] }) {
  const rowClass = "flex items-center gap-3 px-4 py-3 motion-base hover:bg-muted/70"
  return (
    <section className="space-y-3">
      <h2 className="text-h2">{heading}</h2>
      <Surface variant="outline" className="divide-y divide-[var(--p-hair)] text-sm">
        {sources.map((src) => {
          const inner = (
            <>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{src.label}</p>
                <p className="text-meta">{src.desc}</p>
              </div>
              {src.internal ? (
                <ArrowRight className="size-4 shrink-0 text-muted-foreground/40" />
              ) : (
                <ExternalLink className="size-4 shrink-0 text-muted-foreground/40" />
              )}
            </>
          )
          return src.internal ? (
            <Link key={src.url} href={src.url} className={rowClass}>
              {inner}
            </Link>
          ) : (
            <a key={src.url} href={src.url} target="_blank" rel="noopener noreferrer" className={rowClass}>
              {inner}
            </a>
          )
        })}
      </Surface>
    </section>
  )
}
