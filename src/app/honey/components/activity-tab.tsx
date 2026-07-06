"use client";

import { useMemo, useState } from "react";
import { ArrowUp, History, Sparkles } from "lucide-react";
import { t, type Language, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { HoneyTx } from "../types";
import { formatTxReason, getTxStyle } from "../types";
import { Surface } from "@/components/ui/surface";
import { FilterTabs } from "./_shared/filter-tabs";

type FilterKey = "ALL" | "CHECKIN" | "DAILY_MISSION" | "ACHIEVEMENT" | "REFERRAL" | "MARKETPLACE" | "RAFFLE" | "REDEEM" | "OTHER";

const FILTER_LABEL_KEYS: Record<FilterKey, TranslationKey> = {
  ALL: "activityFilterAll",
  CHECKIN: "activityFilterCheckin",
  DAILY_MISSION: "activityFilterMissions",
  ACHIEVEMENT: "activityFilterAchievements",
  REFERRAL: "activityFilterReferral",
  MARKETPLACE: "activityFilterMarketplace",
  RAFFLE: "activityFilterRaffle",
  REDEEM: "activityFilterRedeem",
  OTHER: "activityFilterOther",
};

const FILTER_TYPE_MAP: Record<FilterKey, string[]> = {
  ALL:           [],
  CHECKIN:       ["CHECKIN"],
  DAILY_MISSION: ["DAILY_MISSION"],
  ACHIEVEMENT:   ["ACHIEVEMENT", "LEVEL_UP", "ONBOARDING"],
  REFERRAL:      ["REFERRAL"],
  MARKETPLACE:   ["MARKETPLACE_SELL"],
  RAFFLE:        ["RAFFLE_TICKET"],
  REDEEM:        ["REDEEM"],
  OTHER:         [],
};

const KNOWN_TYPES = new Set(Object.values(FILTER_TYPE_MAP).flat());

function matchesFilter(tx: HoneyTx, filter: FilterKey): boolean {
  if (filter === "ALL") return true;
  if (filter === "OTHER") return !KNOWN_TYPES.has(tx.type);
  return FILTER_TYPE_MAP[filter].includes(tx.type);
}

export function ActivityTab({
  lang,
  transactions,
}: {
  lang: Language;
  transactions: HoneyTx[];
}) {
  const [filter, setFilter] = useState<FilterKey>("ALL");

  const availableFilters = useMemo(() => {
    const typeSet = new Set(transactions.map((tx) => tx.type));
    const filters: FilterKey[] = ["ALL"];
    for (const key of Object.keys(FILTER_TYPE_MAP) as FilterKey[]) {
      if (key === "ALL") continue;
      if (key === "OTHER") {
        if ([...typeSet].some((t) => !KNOWN_TYPES.has(t))) filters.push("OTHER");
      } else {
        if (FILTER_TYPE_MAP[key].some((t) => typeSet.has(t))) filters.push(key);
      }
    }
    return filters;
  }, [transactions]);

  const filtered = useMemo(
    () => transactions.filter((tx) => matchesFilter(tx, filter)),
    [transactions, filter],
  );

  return (
    <Surface variant="panel" className="overflow-hidden">
      <div className="border-b px-4 py-3.5">
        <h2 className="text-h3">{t(lang, "honeyHistory")}</h2>
      </div>

      {availableFilters.length > 2 && (
        <FilterTabs<FilterKey>
          value={filter}
          onChange={setFilter}
          options={availableFilters.map((key) => ({
            key,
            label: t(lang, FILTER_LABEL_KEYS[key]),
          }))}
          ariaLabel={t(lang, "honeyHistory")}
        />
      )}

      {filtered.length === 0 ? (
        transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Sparkles className="size-6 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-semibold">
                {t(lang, "activityEmptyStartTitle")}
              </p>
              <p className="mt-1 text-meta">
                {t(lang, "activityEmptyStartSubtitle")}
              </p>
            </div>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="ease-chrome inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <ArrowUp className="size-3.5" />
              {t(lang, "activityGoToMissions")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <History className="size-6 text-muted-foreground/30" />
            <p className="text-meta">{t(lang, "noTransactions")}</p>
          </div>
        )
      ) : (
        <div className="divide-y divide-hair">
          {filtered.map((tx) => (
            <TxRow key={tx.id} tx={tx} lang={lang} />
          ))}
        </div>
      )}
    </Surface>
  );
}

function TxRow({ tx, lang }: { tx: HoneyTx; lang: Language }) {
  const positive = tx.amount > 0;
  const Icon = getTxStyle(tx).icon;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{formatTxReason(tx, lang)}</p>
        <p className="text-meta tabular-nums">{new Date(tx.createdAt).toLocaleDateString()}</p>
      </div>
      <span className={cn(
        "shrink-0 text-xs font-bold tabular-nums",
        positive ? "text-price-up" : "text-destructive",
      )}>
        {positive ? "+" : ""}{tx.amount} <span className="text-xs">🍯</span>
      </span>
    </div>
  );
}
