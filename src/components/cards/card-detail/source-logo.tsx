import Image from "next/image"

import { cn } from "@/lib/utils"

/**
 * Real favicon/logo of each price source (stored locally in /public/sources).
 * Maps the labels used across the app to a logo; falls back to a neutral dot for
 * any unmapped source so nothing breaks.
 */
const SOURCE_LOGO: Record<string, string> = {
  SNKRDUNK: "/sources/snkrdunk.png",
  Yuyutei: "/sources/yuyutei.png",
  "Yuyu-tei": "/sources/yuyutei.png",
  YUYUTEI: "/sources/yuyutei.png",
  eBay: "/sources/ebay.png",
  "eBay (EN)": "/sources/ebay.png",
  "eBay JP": "/sources/ebay.png",
  EBAY_JP: "/sources/ebay.png",
  TCGplayer: "/sources/tcgplayer.png",
  TCGPlayer: "/sources/tcgplayer.png",
  TCGPLAYER: "/sources/tcgplayer.png",
  Cardmarket: "/sources/cardmarket.png",
  CARDMARKET: "/sources/cardmarket.png",
  Mercari: "/sources/mercari.png",
  "Mercari JP": "/sources/mercari.png",
  MERCARI_JP: "/sources/mercari.png",
}

/** Display name for a source code — normalizes casing for the two we render most. */
export function sourceLabel(source: string): string {
  const s = source.toUpperCase()
  return s === "YUYUTEI" ? "Yuyu-tei" : s === "SNKRDUNK" ? "SNKRDUNK" : source
}

export function SourceLogo({
  source,
  size = 18,
  className,
}: {
  source: string
  size?: number
  className?: string
}) {
  const src = SOURCE_LOGO[source]
  if (!src) {
    return <span className={cn("inline-block size-2 rounded-full bg-muted-foreground", className)} />
  }
  return (
    <Image
      src={src}
      alt={source}
      width={size}
      height={size}
      className={cn("shrink-0 rounded-[4px] object-contain", className)}
      unoptimized
    />
  )
}
