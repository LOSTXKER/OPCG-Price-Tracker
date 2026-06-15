"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"

/**
 * Real grading-company mark, mirroring SourceLogo. Drop the OFFICIAL logo files
 * into /public/grades/ (psa.png · bgs.png · cgc.png) and they appear here — no
 * code change. Until a file exists, we show the company ABBREVIATION as a clean
 * text wordmark (so a chip still reads "PSA 10"). The logo is rendered hidden and
 * only swapped in on successful load, so a missing file NEVER flashes a broken
 * image — the text just stays.
 *
 * NOTE: these are trademarked brand marks — use the companies' official assets
 * (nominative use to label their grade), don't recreate the artwork.
 */
const GRADE_LOGO: Record<string, string> = {
  psa: "/grades/psa.png",
  bgs: "/grades/bgs.png",
  cgc: "/grades/cgc.png",
}

export function GradeLogo({
  family,
  size = 16,
  className,
}: {
  /** grade family / company key, e.g. "psa" | "bgs" | "cgc" */
  family: string
  size?: number
  className?: string
}) {
  const src = GRADE_LOGO[family.toLowerCase()]
  const [loaded, setLoaded] = useState(false)

  return (
    <span className={cn("inline-flex shrink-0 items-center", className)}>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element -- onLoad swap-in; next/image can't probe a maybe-missing file without a hard error
        <img
          src={src}
          alt={family.toUpperCase()}
          width={size}
          height={size}
          onLoad={() => setLoaded(true)}
          className={cn("rounded-[3px] object-contain", !loaded && "hidden")}
        />
      )}
      {!loaded && (
        <span className="text-[11px] font-extrabold uppercase leading-none tracking-tight">{family.toUpperCase()}</span>
      )}
    </span>
  )
}
