import { ArrowUp, ChevronDown, Eye, LayoutGrid, List, Plus, Search, Share2, Wallet } from "lucide-react"

import { t, type Language } from "@/lib/i18n"

/** Static, data-free preview shown behind the auth gate on /portfolio. Mirrors
 *  the live "collection-forward" layout. */
export function PortfolioMockPreview({ lang }: { lang: Language }) {
  const tiles = [
    { code: "OP09-001", name: "Monkey D. Luffy", value: "¥3,200", chg: "+4.1%" },
    { code: "OP09-019", name: "Roronoa Zoro", value: "¥2,800", chg: "+2.4%" },
    { code: "OP09-044", name: "Boa Hancock", value: "¥1,900", chg: "-1.2%" },
    { code: "OP02-013", name: "Portgas D. Ace", value: "¥1,500", chg: "+0.8%" },
    { code: "OP01-120", name: "Shanks", value: "¥1,480", chg: "+3.1%" },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top bar */}
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-[var(--p-hair)] bg-card px-3 py-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold leading-tight">
              Main Collection
            </span>
            <span className="block font-price text-meta tabular-nums leading-tight">
              ¥15,800 <span className="font-semibold text-price-up">+10.8%</span>
            </span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </div>
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

      {/* Summary */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <div>
          <p className="text-eyebrow text-muted-foreground/70">{t(lang, "portfolioValue")}</p>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3">
            <span className="font-price text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
              ¥15,800
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-bold tabular-nums text-price-up">
              <ArrowUp className="size-3.5" />
              +10.8%
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 sm:gap-x-8">
          <MockKpi label={t(lang, "marketValue")} value="¥15,800" />
          <MockKpi label={t(lang, "costBasis")} value="¥14,260" muted />
          <MockKpi label={t(lang, "pnl")} value="+¥1,540" up />
          <MockKpi label={t(lang, "roi")} value="+10.8%" up />
        </div>
      </section>

      {/* Holdings toolbar */}
      <div className="flex items-center gap-2.5 border-b border-[var(--p-hair)] pb-3">
        <p className="text-h5">{t(lang, "assets")}</p>
        <span className="rounded-full bg-primary/8 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary/80">
          8 {t(lang, "card")}
        </span>
        <div className="ml-auto flex items-center gap-2 text-muted-foreground/60">
          <Search className="size-4" />
          <span className="flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5">
            <span className="rounded-md bg-background p-1.5 text-foreground shadow-sm">
              <LayoutGrid className="size-3.5" />
            </span>
            <span className="p-1.5">
              <List className="size-3.5" />
            </span>
          </span>
        </div>
      </div>

      {/* Collection grid */}
      <div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {tiles.map((tile) => (
          <div key={tile.code}>
            <div className="surface-1 hairline relative aspect-[63/88] overflow-hidden rounded-xl bg-muted/40">
              <span className="absolute right-1.5 top-1.5 rounded-md bg-black/55 px-1.5 py-0.5 font-price text-overlay font-semibold text-white">
                ×1
              </span>
            </div>
            <div className="mt-2">
              <p className="truncate text-sm font-semibold leading-tight">{tile.name}</p>
              <p className="mt-0.5 font-price text-meta text-muted-foreground/60">{tile.code}</p>
              <div className="mt-1 flex items-baseline justify-between gap-1.5">
                <span className="font-price text-sm font-bold tabular-nums">{tile.value}</span>
                <span
                  className={`font-price text-micro font-semibold tabular-nums ${tile.chg.startsWith("-") ? "text-price-down" : "text-price-up"}`}
                >
                  {tile.chg}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockKpi({ label, value, up, muted }: { label: string; value: string; up?: boolean; muted?: boolean }) {
  return (
    <div>
      <p className="text-eyebrow">{label}</p>
      <p
        className={`mt-0.5 font-price text-sm font-bold tabular-nums sm:text-base ${up ? "text-price-up" : muted ? "text-foreground/85" : ""}`}
      >
        {value}
      </p>
    </div>
  )
}
