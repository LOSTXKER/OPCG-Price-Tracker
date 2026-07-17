import { ArrowDown, ArrowUp, TrendingUpDown } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Surface } from "@/components/ui/surface";
import { t, type Language } from "@/lib/i18n";

export function WatchlistMockPreview({ lang }: { lang: Language }) {
  const cards = [
    { code: "OP09-001", name: "Monkey D. Luffy", thb: "800 ฿", jpy: "¥3,200", change24h: 2, change7d: 12, change30d: 18 },
    { code: "OP09-019", name: "Roronoa Zoro", thb: "700 ฿", jpy: "¥2,800", change24h: 1, change7d: 5, change30d: 9 },
    { code: "OP09-044", name: "Boa Hancock", thb: "475 ฿", jpy: "¥1,900", change24h: -1, change7d: -3, change30d: 4 },
    { code: "OP08-058", name: "Trafalgar Law", thb: "375 ฿", jpy: "¥1,500", change24h: 2, change7d: 8, change30d: 6 },
    { code: "OP08-001", name: "Nami", thb: "245 ฿", jpy: "¥980", change24h: 0, change7d: 2, change30d: -1 },
    { code: "OP07-034", name: "Shanks", thb: "1,025 ฿", jpy: "¥4,100", change24h: -1, change7d: -1, change30d: 7 },
  ];
  const upCount = cards.filter((c) => c.change7d > 0).length;
  const downCount = cards.filter((c) => c.change7d < 0).length;

  const changeTone = (value: number) =>
    value > 0 ? "text-price-up" : value < 0 ? "text-price-down" : "text-muted-foreground";
  const changeLabel = (value: number) => `${value > 0 ? "+" : ""}${value}%`;

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHeader title={t(lang, "watchlistNav")} className="mb-4 md:mb-5" />

      <div className="flex h-11 items-center gap-1 border-b border-hair md:h-9">
        <span className="inline-flex min-h-11 items-center border-b-2 border-primary px-3 text-label text-primary md:min-h-9">
          {t(lang, "watchlistTabCards")}
        </span>
        <span className="inline-flex min-h-11 items-center px-3 text-label text-muted-foreground md:min-h-9">
          {t(lang, "watchlistTabAlerts")}
        </span>
      </div>

      {/* Row 3 — control row: period pill + icons (mobile) / pulse text + icons (desktop). */}
      <div className="flex items-center gap-2 sm:hidden">
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
        </div>
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        <p className="shrink-0 text-body-sm tabular-nums">
          <span className="text-muted-foreground">
            {t(lang, "watchlistTracking")} {cards.length} {t(lang, "cardUnit")}
          </span>
          <span className="mx-1.5 text-muted-foreground/30">·</span>
          <span className="inline-flex items-center gap-0.5 font-medium text-price-up">
            <ArrowUp className="size-3" aria-hidden />
            {upCount}
          </span>
          <span className="mx-1.5 text-muted-foreground/30">·</span>
          <span className="inline-flex items-center gap-0.5 font-medium text-price-down">
            <ArrowDown className="size-3" aria-hidden />
            {downCount}
          </span>
        </p>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="size-7 rounded-md bg-muted/50" />
          <div className="h-7 w-20 rounded-md bg-muted/50" />
          <div className="h-7 w-20 rounded-md bg-muted/50" />
        </div>
      </div>

      {/* List. Mobile: Apple-Stocks anatomy. Desktop: 2-line price table. */}
      <div className="sm:hidden">
        <div className="flex h-9 items-center justify-between border-b border-hair px-1">
          <span className="text-meta tabular-nums">{cards.length} {t(lang, "cardUnit")}</span>
          <div className="flex items-center gap-3 text-meta">
            <span>{t(lang, "price")}</span>
            <span>{t(lang, "change")}</span>
          </div>
        </div>
        <Surface variant="panel" className="mt-2 overflow-hidden">
          {cards.map((card) => (
            <div key={card.code} className="flex items-center gap-3 border-b border-hair p-3 last:border-0">
              <div className="aspect-[63/88] h-[72px] shrink-0 rounded-lg bg-muted ring-1 ring-hair" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm font-medium">{card.name}</p>
                <p className="text-code text-muted-foreground">{card.code}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-label tabular-nums">{card.thb}</p>
                <p className={`inline-flex rounded-md px-1.5 py-0.5 text-micro font-medium ${changeTone(card.change7d)} bg-muted/50`}>
                  {changeLabel(card.change7d)}
                </p>
              </div>
            </div>
          ))}
        </Surface>
      </div>

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
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="aspect-[63/88] h-12 shrink-0 rounded-md bg-muted ring-1 ring-hair" />
                    <div className="min-w-0">
                      <p className="truncate text-body-sm">{card.name}</p>
                      <p className="text-code text-muted-foreground">{card.code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  <div className="flex flex-col items-end">
                    <span className="text-code font-semibold">{card.thb}</span>
                    <span className="text-meta">{card.jpy}</span>
                  </div>
                </td>
                <td className={`px-3 py-2.5 text-right ${changeTone(card.change24h)}`}>{changeLabel(card.change24h)}</td>
                <td className={`px-3 py-2.5 text-right ${changeTone(card.change7d)}`}>{changeLabel(card.change7d)}</td>
                <td className={`hidden px-3 py-2.5 text-right xl:table-cell ${changeTone(card.change30d)}`}>{changeLabel(card.change30d)}</td>
                <td className="px-3 py-2.5 text-right" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
