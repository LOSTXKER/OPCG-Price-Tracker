"use client"

import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import type { GradeKey } from "./grades"

/**
 * One-line PSA population strip for graded grades (VISION §5.1, zone 4). Scarcity
 * context that justifies a graded premium — active grade bolded.
 *
 * ⚠️ PROTOTYPE: sample counts. Replace with a `CardPopulation` table (VISION §6);
 * the strip already renders a "ตัวอย่าง" marker so it's never mistaken for real pop.
 */
const SAMPLE_POP: { key: GradeKey; short: string; count: number }[] = [
  { key: "psa_10", short: "10", count: 124 },
  { key: "psa_9", short: "9", count: 980 },
  { key: "psa_8", short: "8", count: 1510 },
]

export function PopulationStrip({ selected, lang }: { selected: GradeKey; lang: Language }) {
  const total = SAMPLE_POP.reduce((a, b) => a + b.count, 0)
  return (
    <div className="no-sb flex items-center gap-3 overflow-x-auto px-5 py-2.5">
      <span className="text-eyebrow shrink-0">PSA Pop</span>
      {SAMPLE_POP.map((p) => (
        <span
          key={p.key}
          className={cn(
            "font-price shrink-0 text-xs tabular-nums",
            p.key === selected ? "font-bold text-foreground" : "text-muted-foreground",
          )}
        >
          {p.short}
          <span className="text-muted-foreground/40">→</span>
          {p.count.toLocaleString()}
        </span>
      ))}
      <span className="font-price shrink-0 text-xs tabular-nums text-muted-foreground/60">
        {t(lang, "popTotal")} {total.toLocaleString()}
      </span>
      <span className="text-overlay shrink-0 uppercase text-muted-foreground/40">
        {t(lang, "sampleLabel")}
      </span>
    </div>
  )
}
