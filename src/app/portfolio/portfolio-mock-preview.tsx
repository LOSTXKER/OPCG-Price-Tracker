import { ArrowUp, Eye, MoreHorizontal } from "lucide-react"

import { Surface } from "@/components/ui/surface"
import { t, type Language } from "@/lib/i18n"

/** Static, data-free preview shown behind the auth gate on /portfolio (and any
 *  /portfolio/[id] a logged-out visitor lands on). Mirrors the hub: dashboard
 *  hero → portfolio picker grid — no data, no interactivity, just the shape. */
export function PortfolioMockPreview({ lang }: { lang: Language }) {
  const portfolios = [
    { name: "Main Collection", value: "¥15,580", chg: "+9.3%", count: 7 },
    { name: "Grading Pile", value: "¥42,900", chg: "+2.1%", count: 12 },
  ]

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Dashboard hero */}
      <Surface variant="panel" className="relative overflow-hidden p-4 sm:p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-20 h-64 w-80 rounded-full blur-3xl"
          style={{ background: "color-mix(in srgb, var(--price-up) 12%, transparent)" }}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-eyebrow">{t(lang, "allPortfolios")}</p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="tabular-nums text-display leading-none">¥58,480</span>
              <span className="inline-flex items-center gap-1 pb-0.5 text-sm font-semibold tabular-nums text-price-up">
                <ArrowUp className="size-3.5" />
                +6.8%
              </span>
            </div>
            <p className="mt-1.5 text-meta">2 {t(lang, "portfolio")} · 19 {t(lang, "card")}</p>
          </div>
          <span className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground">
            <Eye className="size-4" />
          </span>
        </div>
      </Surface>

      {/* Portfolio picker grid */}
      <div>
        <p className="mb-3 text-eyebrow">{t(lang, "selectPortfolio")}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((p) => (
            <Surface key={p.name} variant="panel" className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="mt-1.5 text-price-lg tabular-nums">{p.value}</p>
                  <span className="inline-flex items-center gap-0.5 text-micro font-semibold tabular-nums text-price-up">
                    <ArrowUp className="size-3" />
                    {p.chg}
                  </span>
                </div>
                <span className="text-muted-foreground">
                  <MoreHorizontal className="size-4" />
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[63/88] w-7 shrink-0 rounded-sm bg-muted ring-1 ring-hair"
                  />
                ))}
                <span className="ml-auto text-meta tabular-nums">
                  {p.count} {t(lang, "card")}
                </span>
              </div>
            </Surface>
          ))}
        </div>
      </div>
    </div>
  )
}
