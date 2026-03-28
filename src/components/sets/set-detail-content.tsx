"use client";

import { useState, useRef, useEffect } from "react";
import { AlertTriangle, BarChart3, ChevronDown } from "lucide-react";

import { TrendingUpDown } from "lucide-react";

import { CardGrid } from "@/components/cards/card-grid";
import { CardItem, type ChangePeriod } from "@/components/cards/card-item";
import { RarityBadge } from "@/components/shared/rarity-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  pullChance,
  formatPct,
  PACKS_PER_BOX,
  BOXES_PER_CARTON,
} from "@/lib/utils/pull-rate";
import { RARITY_BAR_COLOR } from "@/lib/constants/rarity";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CardData = {
  id: number;
  cardCode: string;
  nameJp: string;
  nameEn: string | null;
  rarity: string;
  isParallel: boolean;
  imageUrl: string | null;
  latestPriceJpy: number | null;
  latestPriceThb: number | null;
  priceChange24h: number | null;
  priceChange7d: number | null;
  priceChange30d: number | null;
  setCode: string;
};

export type PullRateData = {
  rarity: string;
  avgPerBox: number;
  ratePerPack: number;
};

export type RarityGroup = {
  rarity: string;
  name: string;
  cards: CardData[];
  pullRate?: PullRateData;
  pullChancePerBox?: number;
};

interface SetDetailContentProps {
  groups: RarityGroup[];
  totalCards: number;
  packsPerBox: number | null;
  cardsPerPack: number | null;
  hasPullRates: boolean;
}

/* ------------------------------------------------------------------ */
/*  Pull rate helpers                                                  */
/* ------------------------------------------------------------------ */

type Unit = "pack" | "box" | "carton";

const UNIT_LABELS: Record<Unit, string> = {
  pack: "ซอง",
  box: "กล่อง",
  carton: "คาตั้น",
};


function fmtCount(v: number): string {
  if (v >= 100) return `~${Math.round(v)}`;
  if (v >= 10) return `~${v.toFixed(0)}`;
  if (v >= 1) return `~${v.toFixed(1)}`;
  if (v >= 0.01) return `~${v.toFixed(2)}`;
  return `~${v.toFixed(3)}`;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function SetDetailContent({
  groups,
  totalCards,
  packsPerBox,
  cardsPerPack,
  hasPullRates,
}: SetDetailContentProps) {
  const [activeRarity, setActiveRarity] = useState<string>("all");
  const [changePeriod, setChangePeriod] = useState<ChangePeriod>("7d");
  const [unit, setUnit] = useState<Unit>("box");
  const [pullRateOpen, setPullRateOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const el = toolbarRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 1, rootMargin: "-1px 0px 0px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  if (totalCards === 0) {
    return (
      <div className="panel py-16 text-center text-sm text-muted-foreground">
        ยังไม่มีการ์ดในชุดนี้
      </div>
    );
  }

  const pullRateGroups = groups.filter((g) => g.pullRate);
  const showPullRates = hasPullRates && pullRateGroups.length > 0;

  const countForUnit = (pr: PullRateData) =>
    unit === "pack"
      ? pr.avgPerBox / PACKS_PER_BOX
      : unit === "carton"
        ? pr.avgPerBox * BOXES_PER_CARTON
        : pr.avgPerBox;

  const rateForUnit = (pr: PullRateData) =>
    unit === "pack"
      ? pr.ratePerPack
      : unit === "carton"
        ? pr.avgPerBox * BOXES_PER_CARTON
        : pr.avgPerBox;

  const visibleGroups =
    activeRarity === "all"
      ? groups
      : groups.filter((g) => g.rarity === activeRarity);

  const activeLabel =
    activeRarity === "all"
      ? `ทั้งหมด (${totalCards})`
      : `${activeRarity} — ${groups.find((g) => g.rarity === activeRarity)?.name ?? ""} (${groups.find((g) => g.rarity === activeRarity)?.cards.length ?? 0})`;

  return (
    <div className="space-y-6">
      {/* Sentinel for sticky detection */}
      <div ref={toolbarRef} className="h-0" />

      {/* Toolbar */}
      <div
        className={cn(
          "sticky top-0 z-20 -mx-4 px-4 transition-shadow duration-200 md:-mx-6 md:px-6",
          isSticky
            ? "bg-background/95 shadow-sm backdrop-blur-md"
            : "bg-transparent"
        )}
      >
        <div className="flex items-center gap-3 py-2.5">
          {/* Rarity dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted/50"
            >
              {activeRarity !== "all" && (
                <RarityBadge rarity={activeRarity} size="sm" />
              )}
              <span className="max-w-[200px] truncate">{activeLabel}</span>
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground transition-transform",
                  dropdownOpen && "rotate-180"
                )}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 top-full z-30 mt-1 max-h-80 w-64 overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-lg">
                <button
                  onClick={() => {
                    setActiveRarity("all");
                    setDropdownOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    activeRarity === "all"
                      ? "bg-primary/5 font-medium text-primary"
                      : "text-foreground hover:bg-muted/60"
                  )}
                >
                  <span className="flex-1">ทั้งหมด</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {totalCards}
                  </span>
                </button>
                <div className="my-1 h-px bg-border/50" />
                {groups.map((g) => (
                  <button
                    key={g.rarity}
                    onClick={() => {
                      setActiveRarity(g.rarity);
                      setDropdownOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      activeRarity === g.rarity
                        ? "bg-primary/5 font-medium text-primary"
                        : "text-foreground hover:bg-muted/60"
                    )}
                  >
                    <RarityBadge rarity={g.rarity} size="sm" />
                    <span className="flex-1 truncate">{g.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {g.cards.length}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Period toggle */}
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-1.5 py-1 shadow-sm">
            <TrendingUpDown className="size-3.5 text-muted-foreground" />
            {(["24h", "7d", "30d"] as ChangePeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setChangePeriod(p)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold tabular-nums transition-all",
                  changePeriod === p
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Pull rates trigger */}
          {showPullRates && (
            <Dialog open={pullRateOpen} onOpenChange={setPullRateOpen}>
              <DialogTrigger className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted/50">
                <BarChart3 className="size-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">อัตราดรอป</span>
              </DialogTrigger>

              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>อัตราดรอป</DialogTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-0.5 text-[11px] font-medium text-warning">
                      <AlertTriangle className="size-3" />
                      ประมาณการจากชุมชน
                    </span>
                    {packsPerBox && cardsPerPack && (
                      <span className="text-[11px] text-muted-foreground">
                        {packsPerBox} ซอง/กล่อง · {cardsPerPack} ใบ/ซอง
                      </span>
                    )}
                  </div>
                </DialogHeader>

                {/* Unit toggle */}
                <div className="inline-flex rounded-lg bg-muted/60 p-0.5">
                  {(["pack", "box", "carton"] as Unit[]).map((u) => (
                    <button
                      key={u}
                      onClick={() => setUnit(u)}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                        unit === u
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {UNIT_LABELS[u]}
                    </button>
                  ))}
                </div>

                {/* Table */}
                <div className="-mx-4 max-h-[60vh] overflow-y-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 z-10 bg-background text-[11px] font-medium text-muted-foreground">
                      <tr className="border-b border-border/30">
                        <th className="py-1.5 pl-4 text-left font-medium">
                          ระดับ
                        </th>
                        <th className="py-1.5 text-left font-medium" />
                        <th className="py-1.5 text-right font-medium">
                          ต่อ{UNIT_LABELS[unit]}
                        </th>
                        <th className="py-1.5 text-right font-medium">
                          ใบ
                        </th>
                        <th className="py-1.5 pr-4 text-right font-medium">
                          โอกาส
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {pullRateGroups.map((g) => {
                        const pr = g.pullRate!;
                        const count = countForUnit(pr);
                        const chance = pullChance(
                          rateForUnit(pr),
                          g.cards.length
                        );
                        const maxBar = 6;
                        const barWidth = Math.min(
                          (pr.avgPerBox / maxBar) * 100,
                          100
                        );
                        const barColor =
                          RARITY_BAR_COLOR[g.rarity] ?? "bg-neutral-400";

                        return (
                          <tr key={g.rarity}>
                            <td className="whitespace-nowrap py-2.5 pl-4">
                              <RarityBadge rarity={g.rarity} size="sm" />
                            </td>
                            <td className="w-full px-3 py-2.5">
                              <div className="h-1.5 min-w-12 overflow-hidden rounded-full bg-muted">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    barColor
                                  )}
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </td>
                            <td className="whitespace-nowrap py-2.5 text-right font-mono text-sm font-bold tabular-nums">
                              {fmtCount(count)}
                            </td>
                            <td className="whitespace-nowrap py-2.5 text-right text-xs tabular-nums text-muted-foreground">
                              {g.cards.length}
                            </td>
                            <td className="whitespace-nowrap py-2.5 pr-4 text-right font-mono text-xs font-semibold tabular-nums text-primary">
                              {formatPct(chance)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Card Sections */}
      <div className="space-y-10">
        {visibleGroups.map((g) => (
          <section key={g.rarity}>
            <div className="mb-4 flex items-center gap-3">
              <RarityBadge rarity={g.rarity} size="md" />
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold leading-tight">
                  {g.name}
                </h2>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                {g.cards.length}
              </span>
            </div>
            <CardGrid>
              {g.cards.map((c) => (
                <CardItem
                  key={c.id}
                  cardCode={c.cardCode}
                  nameJp={c.nameJp}
                  nameEn={c.nameEn}
                  rarity={c.rarity}
                  isParallel={c.isParallel}
                  imageUrl={c.imageUrl}
                  priceJpy={c.latestPriceJpy ?? undefined}
                  priceThb={c.latestPriceThb ?? undefined}
                  priceChange24h={c.priceChange24h}
                  priceChange7d={c.priceChange7d}
                  priceChange30d={c.priceChange30d}
                  changePeriod={changePeriod}
                  setCode={c.setCode}
                  pullChancePerBox={g.pullChancePerBox}
                />
              ))}
            </CardGrid>
          </section>
        ))}
      </div>
    </div>
  );
}
