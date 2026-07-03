import { ArrowUp, ChevronDown, Eye, Plus, Search, Share2, Wallet } from "lucide-react"

import { Surface } from "@/components/ui/surface"
import { t, type Language } from "@/lib/i18n"

/** Static, data-free preview shown behind the auth gate on /portfolio. Mirrors
 *  the live layout: sidebar (desktop) → switcher pill (mobile) → tabs → hero
 *  panel → holdings list. */
export function PortfolioMockPreview({ lang }: { lang: Language }) {
  const holdings = [
    { code: "OP09-001", name: "Monkey D. Luffy", qty: 2, value: "¥6,400", chg: "+4.1%" },
    { code: "OP09-019", name: "Roronoa Zoro", qty: 1, value: "¥2,800", chg: "+2.4%" },
    { code: "OP09-044", name: "Boa Hancock", qty: 1, value: "¥1,900", chg: "-1.2%" },
    { code: "OP02-013", name: "Portgas D. Ace", qty: 2, value: "¥3,000", chg: "+0.8%" },
    { code: "OP01-120", name: "Shanks", qty: 1, value: "¥1,480", chg: "+3.1%" },
  ]

  return (
    <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-6">
      {/* Sidebar (desktop only) */}
      <aside className="hidden lg:block lg:space-y-4">
        <Surface variant="panel" className="p-4">
          <p className="text-eyebrow">{t(lang, "allPortfolios")}</p>
          <p className="mt-1.5 font-price text-xl font-bold tabular-nums">¥15,580</p>
          <p className="mt-0.5 font-price text-meta tabular-nums text-price-up">+9.3%</p>
        </Surface>
        <Surface variant="panel" className="p-3">
          <div className="flex items-center gap-2.5 rounded-lg bg-primary/6 px-2.5 py-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Wallet className="size-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold leading-tight">
                Main Collection
              </span>
              <span className="text-meta">¥15,580</span>
            </span>
          </div>
        </Surface>
      </aside>

      <div className="mt-5 space-y-5 sm:space-y-6 lg:mt-0">
        {/* Top bar */}
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-[var(--p-hair)] bg-card px-3 py-2 lg:hidden">
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
          <span className="hidden rounded-lg bg-muted/50 p-0.5 lg:inline-flex">
            <span className="rounded-md bg-card px-3 py-1.5 text-xs font-semibold shadow-sm">
              {t(lang, "overviewTab")}
            </span>
            <span className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              {t(lang, "insightsTab")}
            </span>
          </span>
          <div className="hidden flex-1 lg:block" />
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="inline-flex size-9 items-center justify-center rounded-lg border border-[var(--p-hair)] bg-card text-muted-foreground">
              <Eye className="size-4" />
            </span>
            <span className="inline-flex size-9 items-center justify-center rounded-lg border border-[var(--p-hair)] bg-card text-muted-foreground">
              <Share2 className="size-4" />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
              <Plus className="size-4" />
              <span className="hidden sm:inline">{t(lang, "addCard")}</span>
            </span>
          </div>
        </div>

        {/* Mobile tabs */}
        <span className="flex rounded-lg bg-muted/50 p-0.5 lg:hidden">
          <span className="flex-1 rounded-md bg-card py-1.5 text-center text-xs font-semibold shadow-sm">
            {t(lang, "overviewTab")}
          </span>
          <span className="flex-1 py-1.5 text-center text-xs font-semibold text-muted-foreground">
            {t(lang, "insightsTab")}
          </span>
        </span>

        {/* Hero panel — value + delta + stat row */}
        <Surface variant="panel" className="relative overflow-hidden p-4 sm:p-5">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-20 h-64 w-80 rounded-full blur-3xl"
            style={{ background: "color-mix(in srgb, var(--price-up) 12%, transparent)" }}
          />
          <p className="text-eyebrow">{t(lang, "portfolioValue")}</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-2">
            <span className="tabular-nums text-display leading-none">¥15,580</span>
            <span className="inline-flex items-center gap-1 text-body-sm font-medium tabular-nums text-price-up">
              <ArrowUp className="size-3.5" />
              +¥1,320 <span className="opacity-70">(9.30%)</span>
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[var(--p-hair)] pt-4 sm:grid-cols-4">
            <MockStat label={t(lang, "pnl")} value="+¥1,320" up />
            <MockStat label={t(lang, "costBasis")} value="¥14,260" />
            <MockStat label={t(lang, "bestPerformer")} value="Shanks" up pct="+12.4%" />
            <MockStat label={t(lang, "worstPerformer")} value="Boa Hancock" pct="-1.2%" />
          </div>
        </Surface>

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
    </div>
  )
}

function MockStat({
  label,
  value,
  up,
  pct,
}: {
  label: string
  value: string
  up?: boolean
  pct?: string
}) {
  return (
    <div className="min-w-0">
      <p className="text-eyebrow">{label}</p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="truncate text-price">{value}</span>
        {pct && (
          <span
            className={`shrink-0 font-price text-micro tabular-nums ${up ? "text-price-up" : "text-price-down"}`}
          >
            {pct}
          </span>
        )}
      </p>
    </div>
  )
}
