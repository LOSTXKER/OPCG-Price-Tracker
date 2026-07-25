import { Bell, MoreHorizontal, Trash2, TrendingUpDown } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import {
  buildMarketColumns,
  getMarketColumnLabel,
} from "@/components/market/market-columns";
import {
  MarketTableLayout,
  marketTableCellClass,
  marketTableHeaderClass,
  type MarketTableLayoutColumn,
} from "@/components/market/market-table-layout";
import { Price } from "@/components/shared/price-inline";
import { RarityBadge } from "@/components/shared/rarity-badge";
import { GameFilterChips } from "@/components/shared/game-filter-chips";
import { MiniSparkline } from "@/components/ui/mini-sparkline";
import { ALL_GAMES } from "@/lib/game/constants";
import { t, type Language } from "@/lib/i18n";
import { GLOBAL_GRADE_TIERS } from "@/lib/pricing/grade-tiers";

type PreviewCard = {
  code: string;
  name: string;
  set: string;
  rarity: string;
  priceJpy: number;
  change24h: number;
  change7d: number;
  change30d: number;
  sparkline: number[];
};

const PREVIEW_CARDS: PreviewCard[] = [
  { code: "OP09-001", name: "Monkey D. Luffy", set: "OP09", rarity: "L", priceJpy: 3_200, change24h: 2, change7d: 12, change30d: 18, sparkline: [58, 62, 61, 68, 72, 76] },
  { code: "OP09-019", name: "Roronoa Zoro", set: "OP09", rarity: "SR", priceJpy: 2_800, change24h: 1, change7d: 5, change30d: 9, sparkline: [64, 63, 67, 69, 68, 72] },
  { code: "OP09-044", name: "Boa Hancock", set: "OP09", rarity: "SR", priceJpy: 1_900, change24h: -1, change7d: -3, change30d: 4, sparkline: [52, 55, 57, 54, 53, 54] },
  { code: "OP08-058", name: "Trafalgar Law", set: "OP08", rarity: "SR", priceJpy: 1_500, change24h: 2, change7d: 8, change30d: 6, sparkline: [42, 44, 43, 47, 48, 50] },
  { code: "OP08-001", name: "Nami", set: "OP08", rarity: "L", priceJpy: 980, change24h: 0, change7d: 2, change30d: -1, sparkline: [38, 37, 39, 38, 40, 39] },
  { code: "OP07-034", name: "Shanks", set: "OP07", rarity: "SR", priceJpy: 4_100, change24h: -1, change7d: -1, change30d: 7, sparkline: [70, 74, 73, 76, 75, 77] },
];

const WATCHLIST_PREVIEW_COLUMNS: MarketTableLayoutColumn[] = [
  ...buildMarketColumns({ showViews: false }).filter(
    (column) => column.key !== "star" && column.key !== "rank",
  ),
  { key: "actions", col: "w-[100px]", cell: "", align: "right" },
];

function changeTone(value: number) {
  return value > 0
    ? "text-price-up"
    : value < 0
      ? "text-price-down"
      : "text-muted-foreground";
}

function changeLabel(value: number) {
  return `${value > 0 ? "+" : ""}${value}%`;
}

function columnLabel(column: MarketTableLayoutColumn, lang: Language) {
  return column.key === "actions" ? null : getMarketColumnLabel(column, lang);
}

export function WatchlistMockPreview({ lang }: { lang: Language }) {
  return (
    <div className="space-y-4 md:space-y-5">
      <PageHeader title={t(lang, "watchlistNav")} className="mb-4 md:mb-5" />

      <div className="flex h-11 items-center gap-1 border-b border-hair md:h-10">
        <span className="inline-flex min-h-11 items-center gap-1.5 border-b-2 border-primary px-3 text-label text-primary md:min-h-10">
          {t(lang, "watchlistTabCards")}
          <span className="text-micro tabular-nums opacity-60">{PREVIEW_CARDS.length}</span>
        </span>
        <span className="inline-flex min-h-11 items-center px-3 text-label text-muted-foreground md:min-h-10">
          {t(lang, "watchlistTabAlerts")}
        </span>
      </div>

      <div
        className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-x-2 sm:gap-y-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-y-0"
        data-slot="watchlist-preview-toolbar"
      >
        <div
          className="min-w-0 sm:col-start-1 sm:row-start-1"
          data-slot="watchlist-preview-game-filter"
        >
          <GameFilterChips
            games={[{ slug: "opcg", label: "One Piece" }]}
            activeGame={ALL_GAMES}
            onSelect={() => undefined}
            variant="select"
          />
        </div>

        <div
          className="contents"
          data-slot="watchlist-preview-toolbar-controls"
        >
          <div
            className="flex items-center gap-2 sm:hidden"
            data-slot="watchlist-preview-mobile-search"
          >
            <div className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-background" />
            <div className="size-9 rounded-md bg-muted/50" />
            <div className="size-9 rounded-md bg-muted/50" />
          </div>
          <div className="sm:hidden" data-slot="watchlist-preview-mobile-grade">
            <GradePreview lang={lang} />
          </div>

          <div
            className="hidden min-w-0 sm:col-start-2 sm:row-start-1 sm:block"
            data-slot="watchlist-preview-toolbar-search"
          >
            <div className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background md:w-72 md:flex-none" />
          </div>
          <div
            className="hidden min-w-0 shrink-0 items-center gap-1.5 sm:col-span-2 sm:row-start-2 sm:flex sm:justify-self-end lg:col-span-1 lg:col-start-3 lg:row-start-1"
            data-slot="watchlist-preview-toolbar-actions"
          >
            <GradePreview lang={lang} />
            <div className="h-5 w-px shrink-0 bg-border/40" />
            <div className="h-7 w-20 shrink-0 rounded-md bg-muted/50" />
            <div className="h-7 w-20 shrink-0 rounded-md bg-muted/50" />
          </div>
        </div>
      </div>

      <div className="sm:hidden">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 border-b border-hair px-1 pb-2">
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
          <div className="ml-auto flex items-center gap-3 text-meta">
            <span>{t(lang, "price")}</span>
            <span>{t(lang, "change")}</span>
          </div>
        </div>

        <div className="divide-y divide-hair">
          {PREVIEW_CARDS.map((card) => (
            <div key={card.code} className="flex min-w-0 items-center gap-3 px-4 py-2.5">
              <div className="hairline aspect-[63/88] w-11 shrink-0 rounded-md bg-muted" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm font-medium leading-tight">{card.name}</p>
                <div className="mt-0.5 flex items-center gap-1.5 text-meta">
                  <span className="truncate font-mono">{card.code}</span>
                  <RarityBadge rarity={card.rarity} size="sm" />
                  <MiniSparkline
                    data={card.sparkline}
                    width={48}
                    height={20}
                    className="ml-auto shrink-0"
                  />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <Price jpy={card.priceJpy} className="text-price" />
                <p className={`mt-0.5 text-label tabular-nums ${changeTone(card.change7d)}`}>
                  {changeLabel(card.change7d)}
                </p>
              </div>
              <span aria-hidden className="inline-flex size-11 shrink-0 items-center justify-center text-muted-foreground">
                <MoreHorizontal className="size-4" />
              </span>
            </div>
          ))}
        </div>
      </div>

      <MarketTableLayout
        columns={WATCHLIST_PREVIEW_COLUMNS}
        surface="canvas"
        header={WATCHLIST_PREVIEW_COLUMNS.map((column) => (
          <th key={column.key} className={marketTableHeaderClass(column)}>
            {column.key === "actions" ? (
              <span className="sr-only">{t(lang, "moreActions")}</span>
            ) : (
              columnLabel(column, lang)
            )}
          </th>
        ))}
      >
        {PREVIEW_CARDS.map((card) => (
          <PreviewDesktopRow key={card.code} card={card} />
        ))}
      </MarketTableLayout>
    </div>
  );
}

function PreviewDesktopRow({ card }: { card: PreviewCard }) {
  const changes = {
    change24h: card.change24h,
    change7d: card.change7d,
    change30d: card.change30d,
  } as const;

  return (
    <tr>
      {WATCHLIST_PREVIEW_COLUMNS.map((column) => {
        const change = column.key in changes
          ? changes[column.key as keyof typeof changes]
          : null;

        return (
          <td key={column.key} className={marketTableCellClass(column)}>
            {column.key === "card" ? (
              <div className="flex min-w-0 items-center gap-3">
                <div className="size-10 shrink-0 rounded-md bg-muted" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-sm font-medium leading-tight">{card.name}</p>
                  <p className="mt-0.5 truncate text-meta font-mono">{card.code}</p>
                </div>
              </div>
            ) : column.key === "set" ? (
              <span className="text-code text-muted-foreground">{card.set}</span>
            ) : column.key === "rarity" ? (
              <RarityBadge rarity={card.rarity} size="sm" />
            ) : column.key === "price" ? (
              <Price jpy={card.priceJpy} className="text-price" />
            ) : change != null ? (
              <span className={`text-label tabular-nums ${changeTone(change)}`}>
                {changeLabel(change)}
              </span>
            ) : column.key === "sparkline" ? (
              <MiniSparkline data={card.sparkline} width={88} height={28} className="ml-auto block" />
            ) : column.key === "actions" ? (
              <span aria-hidden className="flex items-center justify-end gap-2 text-muted-foreground">
                <span className="inline-flex size-9 items-center justify-center"><Bell className="size-4" /></span>
                <span className="inline-flex size-9 items-center justify-center"><Trash2 className="size-4" /></span>
              </span>
            ) : null}
          </td>
        );
      })}
    </tr>
  );
}

function GradePreview({ lang }: { lang: Language }) {
  return (
    <div
      role="group"
      aria-label={t(lang, "chooseGrade")}
      className="no-sb w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-px sm:w-56 lg:w-auto"
    >
      <div className="inline-flex h-11 w-max shrink-0 items-center gap-0.5 rounded-lg bg-muted/50 p-1 lg:h-9">
        {GLOBAL_GRADE_TIERS.map((tier) => (
          <span
            key={tier.key}
            className={`inline-flex h-7 min-w-11 items-center justify-center rounded-md px-2 text-micro ${
              tier.key === "raw" ? "bg-primary/15 text-primary" : "text-muted-foreground"
            }`}
          >
            {tier.label}
          </span>
        ))}
      </div>
    </div>
  );
}
