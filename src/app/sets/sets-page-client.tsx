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
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t(lang, "setsTitle")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t(lang, "setsDesc")}</p>
      <p className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{totalSets} {t(lang, "setCount")}</span>
        <span className="text-border">·</span>
        <span>{t(lang, "totalValueLabel")} <span className="font-semibold text-foreground"><Price jpy={totalMarketValue} /></span></span>
      </p>
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
