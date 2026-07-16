import { TrendingUpDown } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Surface } from "@/components/ui/surface";
import { t, type Language } from "@/lib/i18n";

export function WatchlistMockPreview({ lang }: { lang: Language }) {
  const cards = [
    { code: "OP09-001", name: "Monkey D. Luffy", price: "¥3,200", change: "+12%" },
    { code: "OP09-019", name: "Roronoa Zoro", price: "¥2,800", change: "+5%" },
    { code: "OP09-044", name: "Boa Hancock", price: "¥1,900", change: "-3%" },
    { code: "OP08-058", name: "Trafalgar Law", price: "¥1,500", change: "+8%" },
    { code: "OP08-001", name: "Nami", price: "¥980", change: "+2%" },
    { code: "OP07-034", name: "Shanks", price: "¥4,100", change: "-1%" },
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

      <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-2 md:flex">
        <div className="h-11 min-w-0 rounded-lg border border-hair bg-card md:h-9 md:min-w-40 md:flex-1 lg:max-w-72" />
        <div className="h-11 min-w-0 rounded-lg border border-hair bg-card md:h-9 md:min-w-40 md:flex-1 lg:max-w-64" />
        <div className="h-11 rounded-lg bg-muted/50 md:h-9 md:w-36" />
        <div className="h-11 rounded-lg bg-muted/50 md:h-9 md:w-24" />
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:min-h-11 md:min-h-9">
        <span className="hidden text-meta tabular-nums sm:inline sm:mr-auto">
          6 {t(lang, "watchlistSummaryCards").toLowerCase()}
        </span>
        <div className="no-sb ml-auto flex max-w-full min-w-0 items-center gap-2 overflow-x-auto">
          <div className="relative flex h-11 shrink-0 items-center gap-0.5 px-0.5 before:absolute before:inset-x-0 before:inset-y-1 before:rounded-full before:bg-muted/50 before:content-[''] md:h-8 md:bg-muted/50 md:p-0.5 md:before:hidden">
            <TrendingUpDown
              aria-hidden
              className="relative z-10 mx-1.5 size-3.5 shrink-0 text-muted-foreground/50"
            />
            {(["24h", "7d", "30d"] as const).map((value) => (
              <span
                key={value}
                className="relative z-10 inline-flex h-11 min-w-11 items-center justify-center px-0.5 md:h-7 md:min-w-0 md:px-0"
              >
                <span
                  className={`inline-flex h-9 w-full items-center justify-center rounded-full px-2 text-micro md:h-7 md:px-2.5 ${
                    value === "7d" ? "bg-primary/15 text-primary" : "text-muted-foreground"
                  }`}
                >
                  {value}
                </span>
              </span>
            ))}
          </div>
          <div className="h-11 w-20 rounded-lg bg-muted/50 md:h-7" />
          <div className="size-11 rounded-md bg-muted/50 md:size-7" />
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
              <p className={card.change.startsWith("+") ? "text-meta text-price-up" : "text-meta text-price-down"}>
                {card.change}
              </p>
            </div>
            <div className="size-11 rounded-md bg-muted" />
          </div>
        ))}
      </Surface>

      <div className="hidden sm:block">
        <table className="w-full table-fixed text-left text-body-sm">
          <thead className="border-b border-hair text-eyebrow">
            <tr>
              <th className="px-3 py-2.5">{t(lang, "card")}</th>
              <th className="w-28 px-3 py-2.5 text-right">{t(lang, "price")}</th>
              <th className="w-24 px-3 py-2.5 text-right">{t(lang, "change")}</th>
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
                <td className={card.change.startsWith("+") ? "px-3 py-2 text-right text-price-up" : "px-3 py-2 text-right text-price-down"}>{card.change}</td>
                <td className="px-3 py-2 text-right"><div className="ml-auto size-9 rounded-md bg-muted" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
