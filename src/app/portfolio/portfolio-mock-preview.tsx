import { ArrowUp, ChevronDown, Eye, Plus, Search, Share2, Wallet } from "lucide-react"

import { t, type Language } from "@/lib/i18n"

/** Static, data-free preview shown behind the auth gate on /portfolio. Mirrors
 *  the live overview tab: underline tabs → hero line → stat strip → holdings —
 *  flat editorial layout, no boxed panels. */
export function PortfolioMockPreview({ lang }: { lang: Language }) {
  const holdings = [
    { code: "OP09-001", name: "Monkey D. Luffy", qty: 2, value: "¥6,400", chg: "+4.1%" },
    { code: "OP09-019", name: "Roronoa Zoro", qty: 1, value: "¥2,800", chg: "+2.4%" },
    { code: "OP09-044", name: "Boa Hancock", qty: 1, value: "¥1,900", chg: "-1.2%" },
    { code: "OP02-013", name: "Portgas D. Ace", qty: 2, value: "¥3,000", chg: "+0.8%" },
    { code: "OP01-120", name: "Shanks", qty: 1, value: "¥1,480", chg: "+3.1%" },
  ]

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Action row */}
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-[var(--p-hair)] bg-card px-3 py-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold leading-tight">
              Main Collection
            </span>
            <span className="block tabular-nums text-meta leading-tight">
              ¥15,580 <span className="font-semibold text-price-up">+9.3%</span>
            </span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground">
            <Eye className="size-4" />
          </span>
          <span className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground">
            <Share2 className="size-4" />
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t(lang, "addCard")}</span>
          </span>
        </div>
      </div>

      {/* Underline tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--p-hair)]">
        <span className="-mb-px border-b-2 border-primary px-2.5 py-2.5 text-xs font-semibold text-primary">
          {t(lang, "overviewTab")}
        </span>
        <span className="border-b-2 border-transparent px-2.5 py-2.5 text-xs font-semibold text-muted-foreground">
          {t(lang, "insightsTab")}
        </span>
      </div>

      {/* Hero line */}
      <div>
        <p className="text-eyebrow">{t(lang, "portfolioValue")}</p>
        <div className="mt-2 flex flex-wrap items-end gap-x-2.5 gap-y-1">
          <span className="tabular-nums text-display leading-none">¥15,580</span>
          <span className="inline-flex items-center gap-1 pb-0.5 text-sm font-semibold tabular-nums text-price-up">
            <ArrowUp className="size-3.5" />
            +¥1,320 <span className="font-normal opacity-70">(+9.3%)</span>
          </span>
          <span className="pb-0.5 text-meta">7 {t(lang, "card")}</span>
        </div>

        {/* Stat strip */}
        <div className="mt-5 flex flex-wrap gap-x-10 gap-y-3 border-t border-[var(--p-hair)] pt-4">
          <MockStat label={t(lang, "costBasis")} value="¥14,260" />
          <MockStat label={t(lang, "pnl")} value="+¥1,320" up />
          <MockStat label={t(lang, "roi")} value="+9.3%" up />
        </div>
      </div>

      {/* Holdings toolbar */}
      <div className="flex items-center gap-2.5 border-b border-[var(--p-hair)] pb-3">
        <p className="text-eyebrow">
          {t(lang, "assets")}
          <span className="ml-2 tabular-nums text-muted-foreground/70">7</span>
        </p>
        <Search className="ml-auto size-4 text-muted-foreground/60" />
      </div>

      {/* Holdings list */}
      <div className="divide-y divide-[var(--p-hair)]">
        {holdings.map((h) => (
          <div key={h.code} className="flex items-center gap-3 py-3">
            <div className="surface-1 hairline aspect-[63/88] w-11 shrink-0 rounded-md bg-muted/40" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm font-medium leading-tight">{h.name}</p>
              <p className="mt-0.5 tabular-nums font-mono text-meta">
                {h.code}
                <span className="ml-1.5 font-sans text-foreground/60">×{h.qty}</span>
              </p>
            </div>
            <div className="shrink-0 text-right leading-tight">
              <p className="tabular-nums text-body-sm font-semibold">{h.value}</p>
              <p
                className={`mt-0.5 tabular-nums text-micro font-medium ${h.chg.startsWith("-") ? "text-price-down" : "text-price-up"}`}
              >
                {h.chg}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockStat({ label, value, up }: { label: string; value: string; up?: boolean }) {
  return (
    <div>
      <p className="text-eyebrow">{label}</p>
      <p className={`text-price tnum mt-1 ${up ? "text-price-up" : ""}`}>{value}</p>
    </div>
  )
}
