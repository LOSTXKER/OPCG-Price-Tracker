import Image from "next/image"

import { cn } from "@/lib/utils"

/**
 * Real grading-company mark, mirroring SourceLogo. Drop the OFFICIAL logo files
 * into /public/grades/ (psa.png · bgs.png · cgc.png) and they appear here — no
 * code change. Until a file exists, we show the company ABBREVIATION as a clean
 * text wordmark (so a chip still reads "PSA 10"). Keep this component quiet:
 * do not request brand files until they actually exist in /public/grades/.
 *
 * NOTE: these are trademarked brand marks — use the companies' official assets
 * (nominative use to label their grade), don't recreate the artwork.
 */
const GRADE_LOGO: Record<string, string> = {}

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

  return (
    <span className={cn("inline-flex shrink-0 items-center", className)}>
      {src && (
        <Image
          src={src}
          alt={family.toUpperCase()}
          width={size}
          height={size}
          className="rounded-[3px] object-contain"
        />
      )}
      {!src && (
        <span className="text-micro font-extrabold uppercase leading-none">{family.toUpperCase()}</span>
      )}
    </span>
  )
}
