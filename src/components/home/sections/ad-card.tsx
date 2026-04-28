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
      className="group relative overflow-hidden rounded-xl border border-border/40 transition-colors hover:border-border"
    >
      <Image
        src="/ad-banner.png"
        alt="Advertisement"
        fill
        sizes="(min-width: 1024px) 25vw, 50vw"
        className="object-cover"
      />
      <span className="absolute right-1.5 top-1.5 z-10 rounded bg-black/50 px-1.5 py-0.5 text-xs font-medium text-white/70">
        {t(lang, "adLabel")}
      </span>
    </Link>
  )
}
