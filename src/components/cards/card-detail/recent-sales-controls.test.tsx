import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-hydrated", () => ({
  useHydrated: () => true,
}));

vi.mock("@/hooks/use-tier-limits", () => ({
  useTierLimits: () => ({
    loaded: true,
    limits: { priceHistoryDays: 30 },
  }),
}));

vi.mock("@/components/shared/filter-modal", () => ({
  FilterModal: ({ children, open }: { children: ReactNode; open: boolean }) => (
    <section data-slot="filter-modal-mock" data-open={open}>
      {children}
    </section>
  ),
}));

vi.mock("@/components/shared/upgrade-dialog", () => ({
  useUpgradeDialog: () => ({ openUpgradeDialog: vi.fn() }),
}));

import { filterRecentSales, RecentSales } from "./recent-sales";
import type { SaleRow } from "./sold-feed";

const sales: SaleRow[] = [
  {
    source: "SNKRDUNK",
    condition: "Raw",
    family: null,
    priceJpy: 100_000,
    soldAtIso: "2026-04-10T00:00:00.000Z",
  },
  {
    source: "YUYUTEI",
    condition: "PSA 10",
    family: "psa",
    priceJpy: 300_000,
    soldAtIso: "2026-04-09T00:00:00.000Z",
  },
  {
    source: "SNKRDUNK",
    condition: "Raw",
    family: null,
    priceJpy: 98_000,
    soldAtIso: "2026-04-03T00:00:00.000Z",
  },
  {
    source: "SNKRDUNK",
    condition: "Raw",
    family: null,
    priceJpy: 96_000,
    soldAtIso: "2026-04-02T23:59:59.000Z",
  },
  {
    source: "SNKRDUNK",
    condition: "Raw",
    family: null,
    priceJpy: 95_000,
    soldAtIso: "invalid",
  },
];

describe("RecentSales controls", () => {
  it("keeps the range visible before the filter-modal trigger", () => {
    const markup = renderToStaticMarkup(
      <RecentSales
        sales={sales}
        currency="THB"
        lang="TH"
        range="1M"
        onRangeChange={() => undefined}
      />,
    );
    const rangeIndex = markup.indexOf('data-slot="recent-sales-range"');
    const triggerIndex = markup.indexOf(
      'data-slot="recent-sales-filter-trigger"',
    );
    const modalIndex = markup.indexOf('data-slot="filter-modal-mock"');
    const conditionFilterIndex = markup.indexOf(
      'aria-label="สภาพ"',
      modalIndex,
    );
    const sourceFilterIndex = markup.indexOf(
      'data-slot="recent-sales-source-filter"',
      modalIndex,
    );
    const controlsMarkup = markup.slice(
      markup.indexOf('data-slot="recent-sales-controls"'),
      modalIndex,
    );

    expect(rangeIndex).toBeGreaterThan(-1);
    expect(triggerIndex).toBeGreaterThan(rangeIndex);
    expect(modalIndex).toBeGreaterThan(triggerIndex);
    expect(conditionFilterIndex).toBeGreaterThan(modalIndex);
    expect(sourceFilterIndex).toBeGreaterThan(conditionFilterIndex);
    expect(markup.match(/role="radiogroup"/g)).toHaveLength(3);
    expect(markup).toContain('aria-label="ช่วงเวลา"');
    expect(controlsMarkup).toContain(">30D<");
    expect(controlsMarkup).toContain(">90D<");
    expect(markup).toContain('aria-label="ตัวกรอง"');
    expect(markup).toContain('aria-label="สภาพ"');
    expect(markup).toContain('aria-label="ตลาด"');
    expect(markup).toContain('aria-haspopup="dialog"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('data-open="false"');
    expect(controlsMarkup).toContain("flex-wrap");
    expect(controlsMarkup).toContain("bg-muted/50");
    expect(markup).not.toContain('role="combobox"');
  });

  it("keeps exact source and grade filters ANDed with an inclusive date cutoff", () => {
    expect(
      filterRecentSales(sales, { source: "all", grade: "all", range: "7D" }),
    ).toEqual(sales.slice(0, 3));

    expect(
      filterRecentSales(sales, {
        source: "SNKRDUNK",
        grade: "Raw",
        range: "All",
      }),
    ).toEqual([sales[0], sales[2], sales[3]]);

    expect(
      filterRecentSales(sales, {
        source: "YUYUTEI",
        grade: "Raw",
        range: "All",
      }),
    ).toEqual([]);
  });
});
