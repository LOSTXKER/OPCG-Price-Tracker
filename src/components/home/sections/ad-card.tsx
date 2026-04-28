"use client"

import Image from "next/image"
import Link from "next/link"

import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"

export function HomeAdCard() {
  const lang = useUIStore((s) => s.language)

  return (
    <Link
      href="/pricing"
      className="group relative block aspect-[5/2] overflow-hidden rounded-lg"
    >
      <Image
        src="/ad-banner.png"
        alt="Advertisement"
        fill
        sizes="(min-width: 1024px) 25vw, 50vw"
        className="object-cover saturate-[0.85] transition-[filter] duration-200 group-hover:saturate-100"
      />
      <div aria-hidden className="absolute inset-0 bg-black/30" />
      <span className="absolute bottom-1.5 right-2 z-10 text-eyebrow text-white/70">
        {t(lang, "adLabel")}
      </span>
    </Link>
  )
}
