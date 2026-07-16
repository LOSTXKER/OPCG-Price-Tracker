import { TrendingUpDown } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Surface } from "@/components/ui/surface";
import { t, type Language } from "@/lib/i18n";

export function WatchlistMockPreview({ lang }: { lang: Language }) {
  const cards = [
    { code: "OP09-001", name: "Monkey D. Luffy", price: "¥3,200", change24h: "+2%", change7d: "+12%", change30d: "+18%" },
    { code: "OP09-019", name: "Roronoa Zoro", price: "¥2,800", change24h: "+1%", change7d: "+5%", change30d: "+9%" },
    { code: "OP09-044", name: "Boa Hancock", price: "¥1,900", change24h: "-1%", change7d: "-3%", change30d: "+4%" },
    { code: "OP08-058", name: "Trafalgar Law", price: "¥1,500", change24h: "+2%", change7d: "+8%", change30d: "+6%" },
    { code: "OP08-001", name: "Nami", price: "¥980", change24h: "0%", change7d: "+2%", change30d: "-1%" },
    { code: "OP07-034", name: "Shanks", price: "¥4,100", change24h: "-1%", change7d: "-1%", change30d: "+7%" },
  ];

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHeader
        title={t(lang, "watchlistNav")}
        className="mb-3 md:mb-4"
      />

      <div className="flex h-11 items-center gap-1 border-b border-hair md:h-9">
        <span className="inline-flex min-h-11 items-center border-b-2 border-primary px-3 text-label text-primary md:min-h-9">
          {t(lang, "watchlistTabCards")}
        </span>
        <span className="inline-flex min-h-11 items-center px-3 text-label text-muted-foreground md:min-h-9">
          {t(lang, "watchlistTabAlerts")}
        </span>
      </div>

      {/* Mobile toolbar (<sm): prominent set bar, control row, sort row. */}
      <div className="space-y-2 sm:hidden">
        <div className="h-10 w-full rounded-lg border border-primary/25 bg-primary/5" />
        <div className="flex items-center gap-2">
          <div className="relative flex h-9 shrink-0 items-center gap-0.5 rounded-full bg-muted/50 px-0.5">
            <TrendingUpDown aria-hidden className="mx-1.5 size-3.5 shrink-0 text-muted-foreground/50" />
            {(["24h", "7d", "30d"] as const).map((value) => (
              <span
                key={value}
                className={`inline-flex h-7 items-center justify-center rounded-full px-2.5 text-micro ${
                  value === "7d" ? "bg-primary/15 text-primary" : "text-muted-foreground"
                }`}
              >
                {value}
              </span>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="size-9 rounded-md bg-muted/50" />
            <div className="size-9 rounded-md bg-muted/50" />
            <div className="size-9 rounded-md bg-muted/50" />
            <div className="size-9 rounded-md bg-muted/50" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-meta">{t(lang, "sortBy")}</span>
          <div className="h-9 w-48 rounded-md bg-muted/50" />
        </div>
        <p className="text-meta tabular-nums">
          {cards.length} {t(lang, "watchlistSummaryCards").toLowerCase()}
        </p>
      </div>

      {/* Desktop/tablet toolbar (>=sm): one row. */}
      <div className="hidden items-center gap-2 sm:flex">
        <div className="h-9 w-[19rem] rounded-lg border border-hair bg-card" />
        <span className="text-meta tabular-nums">
          {cards.length} {t(lang, "watchlistSummaryCards").toLowerCase()}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="relative flex h-7 shrink-0 items-center gap-0.5 rounded-full bg-muted/50 px-0.5">
            {(["24h", "7d", "30d"] as const).map((value) => (
              <span
                key={value}
                className={`inline-flex h-7 items-center justify-center rounded-full px-2.5 text-micro ${
                  value === "7d" ? "bg-primary/15 text-primary" : "text-muted-foreground"
                }`}
              >
                {value}
              </span>
            ))}
          </div>
          <div className="h-5 w-px bg-border/40" />
          <div className="h-7 w-32 rounded-md bg-muted/50" />
          <div className="h-7 w-20 rounded-md bg-muted/50" />
          <div className="h-7 w-20 rounded-md bg-muted/50" />
          <div className="size-7 rounded-md bg-muted/50" />
        </div>
      </div>

      <Surface variant="panel" className="overflow-hidden sm:hidden">
        {cards.slice(0, 4).map((card) => (
          <div key={card.code} className="flex items-center gap-3 border-b border-hair p-3 last:border-0">
            <div className="aspect-[63/88] h-16 shrink-0 rounded-lg bg-muted" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm">{card.name}</p>
              <p className="text-code text-muted-foreground">{card.code}</p>
            </div>
            <div className="text-right">
              <p className="text-label tabular-nums">{card.price}</p>
              <p className={card.change7d.startsWith("+") ? "text-meta text-price-up" : "text-meta text-price-down"}>
                {card.change7d}
              </p>
            </div>
            <div className="size-11 rounded-md bg-muted" />
          </div>
        ))}
      </Surface>

      <div className="hidden sm:block">
        <table className="w-full text-left text-body-sm">
          <thead className="border-b border-hair text-eyebrow">
            <tr>
              <th className="px-3 py-2.5">{t(lang, "card")}</th>
              <th className="w-28 px-3 py-2.5 text-right">{t(lang, "price")}</th>
              <th className="w-20 px-3 py-2.5 text-right">24H</th>
              <th className="w-20 px-3 py-2.5 text-right">7D</th>
              <th className="hidden w-20 px-3 py-2.5 text-right xl:table-cell">30D</th>
              <th className="w-24 px-3 py-2.5"><span className="sr-only">{t(lang, "moreActions")}</span></th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => (
              <tr key={card.code}>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div className="aspect-[63/88] h-12 shrink-0 rounded-md bg-muted" />
                    <div className="min-w-0">
                      <p className="truncate text-body-sm">{card.name}</p>
                      <p className="text-code text-muted-foreground">{card.code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{card.price}</td>
                <td className={card.change24h.startsWith("+") ? "px-3 py-2 text-right text-price-up" : card.change24h.startsWith("-") ? "px-3 py-2 text-right text-price-down" : "px-3 py-2 text-right text-muted-foreground"}>{card.change24h}</td>
                <td className={card.change7d.startsWith("+") ? "px-3 py-2 text-right text-price-up" : "px-3 py-2 text-right text-price-down"}>{card.change7d}</td>
                <td className={card.change30d.startsWith("+") ? "hidden px-3 py-2 text-right text-price-up xl:table-cell" : "hidden px-3 py-2 text-right text-price-down xl:table-cell"}>{card.change30d}</td>
                <td className="px-3 py-2 text-right"><div className="ml-auto size-9 rounded-md bg-muted" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
