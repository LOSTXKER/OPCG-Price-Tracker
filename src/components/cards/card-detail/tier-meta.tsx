import { t, type Language } from "@/lib/i18n"

/**
 * Competitive-meta snapshot (tier + meta share). Sample numbers for now — wired
 * to real deck/meta stats in a later phase (VISION §6). Carries a "sample" tag
 * so the modeled figures are never read as live.
 */
export function CardTierMeta({ lang }: { lang: Language }) {
  return (
    <div className="hairline-t flex items-center justify-between gap-3 py-4">
      <div>
        <p className="text-meta flex items-center gap-1.5">
          {t(lang, "metaTier")}
          <span className="text-overlay uppercase text-muted-foreground/40">{t(lang, "sampleLabel")}</span>
        </p>
        <p className="mt-0.5 text-h5 text-foreground">Tier A</p>
      </div>
      <div className="text-right">
        <p className="tnum text-h4 text-foreground">12.4%</p>
        <p className="text-meta">{t(lang, "metaShare")}</p>
      </div>
    </div>
  )
}
