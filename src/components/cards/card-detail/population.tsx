import { t, type Language } from "@/lib/i18n"

/** Sample PSA population ladder — modeled until a real population feed lands
 *  (VISION §6); carries a "sample" marker so it's never read as authoritative. */
const SAMPLE_POP = [
  { g: "PSA 10", n: 412, pct: 18 },
  { g: "PSA 9", n: 1180, pct: 52 },
  { g: "PSA 8", n: 480, pct: 21 },
  { g: "≤ PSA 7", n: 205, pct: 9 },
]

export function CardPopulation({ lang }: { lang: Language }) {
  const popTotal = SAMPLE_POP.reduce((a, b) => a + b.n, 0)
  const gemPct = SAMPLE_POP.find((r) => r.g === "PSA 10")?.pct ?? null

  return (
    <div className="surface-1 hairline space-y-3 rounded-2xl p-4">
      <div className="flex items-end justify-between gap-3">
        <p className="text-meta flex items-center gap-1.5">
          PSA Population · {popTotal.toLocaleString()} graded
          <span className="text-overlay uppercase text-muted-foreground/40">{t(lang, "sampleLabel")}</span>
        </p>
        {gemPct != null && (
          <div className="shrink-0 text-right">
            <p className="tnum text-2xl font-extrabold leading-none text-foreground">{gemPct}%</p>
            <p className="text-meta mt-0.5">{t(lang, "gemRate")}</p>
          </div>
        )}
      </div>
      <div className="space-y-2.5">
        {SAMPLE_POP.map((r) => (
          <div key={r.g} className="flex items-center gap-3">
            <span className="w-16 text-xs font-semibold text-foreground">{r.g}</span>
            <div className="surface-2 h-2.5 flex-1 overflow-hidden rounded-full">
              <div className="h-full rounded-full bg-foreground/30" style={{ width: `${r.pct}%` }} />
            </div>
            <span className="tnum w-20 shrink-0 text-right text-xs text-muted-foreground">
              {r.n.toLocaleString()}
              <span className="ml-1 text-muted-foreground/40">{r.pct}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
