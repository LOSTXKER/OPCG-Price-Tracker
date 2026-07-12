import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Logo } from "@/components/brand/logo"
import { t, type Language } from "@/lib/i18n"

export type AuthHero = {
  title: string
  desc: string
  /** optional extra below the hero copy (e.g. register's feature checklist). */
  extra?: ReactNode
}

/**
 * The shared auth page frame. With `hero` → the two-column login/register layout
 * (decorative left panel + form column, mobile logo, optional back-to-home bar).
 * Without `hero` → the single-column forgot/reset layout (centered logo, no back
 * bar). `children` is the form body below the centered title/subtitle heading.
 */
export function AuthShell({
  lang,
  title,
  subtitle,
  hero,
  showBackLink = false,
  children,
}: {
  lang: Language
  title: string
  subtitle: string
  hero?: AuthHero
  showBackLink?: boolean
  children: ReactNode
}) {
  const heading = (
    <div className="space-y-2 text-center">
      <h1 className="text-h1">{title}</h1>
      <p className="text-body-sm text-muted-foreground">{subtitle}</p>
    </div>
  )

  if (!hero) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <Link href="/"><Logo size="lg" /></Link>
          </div>
          {heading}
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh">
      {/* Decorative left panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-foreground lg:block">
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/"><Logo size="lg" mono className="text-background" /></Link>
          <div className="max-w-md">
            <h2 className="text-h1 whitespace-pre-line text-background">{hero.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-background/60">{hero.desc}</p>
            {hero.extra}
          </div>
          <p className="text-xs text-background/30">Meecard</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col">
        {showBackLink && (
          <div className="p-4 sm:p-6">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="size-4" />
              {t(lang, "backToHome")}
            </Link>
          </div>
        )}
        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-8">
          <div className="w-full max-w-sm space-y-6">
            {/* Mobile logo */}
            <div className="text-center lg:hidden">
              <Link href="/"><Logo size="lg" /></Link>
            </div>
            {heading}
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
