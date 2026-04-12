"use client";

import { useMemo, useState } from "react";
import { ArrowUp, History, Sparkles } from "lucide-react";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { HoneyTx } from "../types";
import { formatTxReason, getTxStyle } from "../types";

type FilterKey = "ALL" | "CHECKIN" | "DAILY_MISSION" | "ACHIEVEMENT" | "REFERRAL" | "MARKETPLACE" | "RAFFLE" | "REDEEM" | "OTHER";

const FILTER_LABELS: Record<FilterKey, Record<string, string>> = {
  ALL:          { TH: "ทั้งหมด",    EN: "All",          JP: "すべて" },
  CHECKIN:      { TH: "เช็คอิน",    EN: "Check-in",     JP: "チェックイン" },
  DAILY_MISSION:{ TH: "ภารกิจ",     EN: "Missions",     JP: "ミッション" },
  ACHIEVEMENT:  { TH: "ความสำเร็จ", EN: "Achievements", JP: "実績" },
  REFERRAL:     { TH: "แนะนำเพื่อน", EN: "Referral",    JP: "紹介" },
  MARKETPLACE:  { TH: "ตลาด",       EN: "Marketplace",  JP: "マーケット" },
  RAFFLE:       { TH: "ลุ้นรางวัล",  EN: "Raffle",      JP: "抽選" },
  REDEEM:       { TH: "แลกของ",      EN: "Redeem",      JP: "交換" },
  OTHER:        { TH: "อื่นๆ",       EN: "Other",       JP: "その他" },
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
    <div className="panel overflow-hidden">
      <div className="border-b px-4 py-3.5">
        <h2 className="text-lg font-semibold">{t(lang, "honeyHistory")}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {lang === "TH" ? "ดูประวัติการรับและใช้ Honey ทั้งหมด" : lang === "JP" ? "Honeyの獲得・使用履歴" : "View all Honey earning and spending history"}
        </p>
      </div>

      {availableFilters.length > 2 && (
        <div className="flex gap-1 overflow-x-auto bg-muted/20 px-4 py-1.5 scrollbar-none">
          {availableFilters.map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                filter === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
              )}
            >
              {FILTER_LABELS[key][lang] ?? FILTER_LABELS[key].EN}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {lang === "TH" ? "เริ่มสะสม Honey กันเลย!" : lang === "JP" ? "Honeyを集め始めよう！" : "Start earning Honey!"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {lang === "TH"
                  ? "ทำภารกิจประจำวันด้านบนเพื่อรับ Honey แรกของคุณ"
                  : lang === "JP"
                    ? "上のデイリーミッションをクリアして最初のHoneyをゲット"
                    : "Complete a daily mission above to earn your first Honey"}
              </p>
            </div>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
            >
              <ArrowUp className="size-3.5" />
              {lang === "TH" ? "ไปทำภารกิจ" : lang === "JP" ? "ミッションへ" : "Go to missions"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <History className="size-8 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground/60">{t(lang, "noTransactions")}</p>
          </div>
        )
      ) : (
        <div className="divide-y divide-border/40">
          {filtered.map((tx) => (
            <TxRow key={tx.id} tx={tx} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}

function TxRow({ tx, lang }: { tx: HoneyTx; lang: Language }) {
  const positive = tx.amount > 0;
  const style = getTxStyle(tx);
  const Icon = style.icon;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", style.bg)}>
        <Icon className={cn("size-3.5", style.fg)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{formatTxReason(tx, lang)}</p>
        <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
      </div>
      <span className={cn("shrink-0 text-xs font-bold tabular-nums", positive ? "text-price-up" : "text-destructive")}>
        {positive ? "+" : ""}{tx.amount} <span className="text-xs">🍯</span>
      </span>
    </div>
  );
}
