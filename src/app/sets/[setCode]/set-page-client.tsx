"use client";

import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { Price } from "@/components/shared/price-inline";

export function SetPageStats({
  cardCount,
  totalValue,
  avgPrice,
}: {
  cardCount: number;
  totalValue: number;
  avgPrice: number;
}) {
  const lang = useUIStore((s) => s.language);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      <span>
        <strong className="font-mono font-semibold text-foreground">
          {cardCount}
        </strong>{" "}
        {t(lang, "card")}
      </span>
      <span className="text-border">·</span>
      <span>
        {t(lang, "totalValue")}{" "}
        <strong className="font-mono font-semibold text-foreground">
          <Price jpy={totalValue} />
        </strong>
      </span>
      <span className="text-border">·</span>
      <span>
        Avg{" "}
        <strong className="font-mono font-semibold text-foreground">
          <Price jpy={avgPrice} />
        </strong>
      </span>
    </div>
  );
}

export function SetPageTopCardLabel() {
  const lang = useUIStore((s) => s.language);
  return (
    <span className="text-[11px] font-medium text-muted-foreground">
      {t(lang, "highestValue")}
    </span>
  );
}

export function SetPageBreadcrumbLabels() {
  const lang = useUIStore((s) => s.language);
  return { home: t(lang, "home"), sets: t(lang, "sets") };
}
