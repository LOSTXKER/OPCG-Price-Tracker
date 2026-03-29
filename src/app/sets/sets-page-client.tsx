"use client";

import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { Price } from "@/components/shared/price-inline";

export function SetsPageHeader({
  totalSets,
  totalMarketValue,
}: {
  totalSets: number;
  totalMarketValue: number;
}) {
  const lang = useUIStore((s) => s.language);
  return (
    <div>
      <h1 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">{t(lang, "setsTitle")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t(lang, "setsDesc")}</p>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {totalSets} {t(lang, "setCount")}
        </span>
        <span>
          {t(lang, "totalValueLabel")} <Price jpy={totalMarketValue} />
        </span>
      </div>
    </div>
  );
}

export function HighestValueSetLabel() {
  const lang = useUIStore((s) => s.language);
  return <h2 className="text-sm font-semibold">{t(lang, "highestValueSet")}</h2>;
}

export function CardCountLabel({ count }: { count: number }) {
  const lang = useUIStore((s) => s.language);
  return <span className="shrink-0 text-xs text-muted-foreground">{count} {t(lang, "cardsCount")}</span>;
}
