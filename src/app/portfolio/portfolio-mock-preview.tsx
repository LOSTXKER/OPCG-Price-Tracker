import { ChevronDown, Plus, Wallet } from "lucide-react"

import { Surface } from "@/components/ui/surface"
import { t, type Language } from "@/lib/i18n"

/** Static, data-free preview shown behind the auth gate on /portfolio. */
export function PortfolioMockPreview({ lang }: { lang: Language }) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:gap-6">
      {/* Mobile compact picker mock */}
      <Surface variant="panel" className="flex items-center gap-3 px-3.5 py-3 md:hidden">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Wallet className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Main Collection</p>
          <p className="font-price text-xs tabular-nums text-muted-foreground">
            ¥15,800
          </p>
        </div>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </Surface>

      <aside className="hidden w-52 shrink-0 lg:block xl:w-56">
        <Surface variant="panel" className="overflow-hidden">
          <div className="p-4">
            <p className="text-xs font-medium text-muted-foreground">
              {t(lang, "overview")}
            </p>
            <p className="mt-1 font-price text-xl font-bold tabular-nums tracking-tight">
              ¥15,800
            </p>
          </div>
          <div className="border-t border-[var(--p-hair)]">
            <div className="px-4 py-2.5">
              <p className="text-xs font-medium text-muted-foreground">
                {t(lang, "portfolio")} (2)
              </p>
            </div>
            <div className="space-y-px p-1.5">
              <div className="flex items-center gap-3 rounded-lg bg-primary/6 px-3 py-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Wallet className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold">Main Collection</span>
                  <p className="text-meta">¥12,300</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Wallet className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium">OP-09 Pulls</span>
                  <p className="text-meta">¥3,500</p>
                </div>
              </div>
            </div>
          </div>
        </Surface>
      </aside>

      <main className="min-w-0 flex-1 space-y-4 sm:space-y-5">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-0.5 rounded-lg bg-muted/60 p-0.5">
            <span className="rounded-md bg-background px-3 py-1.5 text-sm font-medium shadow-sm">
              {t(lang, "overviewTab")}
            </span>
            <span className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground">
              {t(lang, "insightsTab")}
            </span>
            <span className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground">
              {t(lang, "transactionsTab")}
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t(lang, "addCard")}</span>
          </div>
        </div>

        {/* Hero mock */}
        <Surface variant="panel" className="relative isolate overflow-hidden ring-1 ring-border/30">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full opacity-[0.14] blur-3xl sm:-right-24 sm:-top-24 sm:size-72 sm:opacity-[0.18]"
            style={{ background: "var(--color-price-up)" }}
          />
          <div className="relative p-5 sm:p-6">
            <p className="text-eyebrow text-muted-foreground/70">
              {t(lang, "portfolioValue")}
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <span className="font-price text-display">¥12,300</span>
              <span className="rounded-full bg-price-up/12 px-3 py-1 text-sm font-bold tabular-nums text-price-up sm:px-2.5 sm:text-xs">
                +10.8%
              </span>
            </div>
            <div className="mt-5 flex flex-wrap items-stretch gap-x-5 gap-y-3 sm:mt-6 sm:gap-x-7">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-eyebrow text-muted-foreground/60">
                  {t(lang, "unrealizedPnl")}
                </span>
                <span className="font-price text-sm font-bold tabular-nums text-price-up">
                  +¥1,200
                </span>
              </div>
              <div aria-hidden className="hidden w-px self-stretch bg-border/40 sm:block" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-eyebrow text-muted-foreground/60">
                  {t(lang, "costBasis")}
                </span>
                <span className="font-price text-sm font-semibold tabular-nums text-foreground/85">
                  ¥11,100
                </span>
              </div>
            </div>
          </div>
        </Surface>

        {/* Assets mock */}
        <Surface variant="panel" className="overflow-hidden ring-1 ring-border/10">
          <div className="flex items-center justify-between border-b border-[var(--p-hair)] px-5 py-3 sm:px-6">
            <div className="flex items-center gap-2.5">
              <p className="text-sm font-bold">{t(lang, "assets")}</p>
              <span className="rounded-full bg-primary/8 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary/80">
                8 {t(lang, "card")}
              </span>
            </div>
          </div>
          <div className="divide-y divide-[var(--p-hair)]">
            {[
              { code: "OP09-001", name: "Monkey D. Luffy", price: "¥3,200" },
              { code: "OP09-019", name: "Roronoa Zoro", price: "¥2,800" },
              { code: "OP09-044", name: "Boa Hancock", price: "¥1,900" },
            ].map((row) => (
              <div
                key={row.code}
                className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-muted/30 sm:px-6"
              >
                <div className="size-11 rounded-lg bg-muted/60 ring-1 ring-border/20" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{row.name}</p>
                  <p className="mt-0.5 font-mono text-meta text-muted-foreground/60">
                    {row.code}
                  </p>
                </div>
                <p className="font-price text-sm font-bold tabular-nums">{row.price}</p>
              </div>
            ))}
          </div>
        </Surface>
      </main>
    </div>
  )
}
