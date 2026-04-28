"use client";

import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCardSearch } from "@/hooks/use-card-search";
import { cn } from "@/lib/utils";
import { CARD_BG } from "@/lib/constants/ui";
import { Search, ChevronRight } from "lucide-react";

export type SelectedCard = {
  id?: number;
  cardCode: string;
  nameJp: string;
  nameEn: string | null;
  rarity: string;
  imageUrl: string | null;
  latestPriceJpy: number | null;
  latestPriceThb: number | null;
};

interface StepCardSelectProps {
  selected: SelectedCard | null;
  onSelect: (card: SelectedCard) => void;
  onNext: () => void;
}

export function StepCardSelect({
  selected,
  onSelect,
  onNext,
}: StepCardSelectProps) {
  const { query, setQuery, results } = useCardSearch({ limit: 20, debounceMs: 300 });
  const [showResults, setShowResults] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-h3">เลือกการ์ดที่จะขาย</h2>
        <p className="text-sm text-muted-foreground">
          ค้นหาด้วยชื่อหรือรหัสการ์ด
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="ค้นหา เช่น Luffy, OP01-001, ..."
          className="pl-9"
          autoComplete="off"
        />
      </div>

      {showResults && query.trim().length >= 2 && (
        <div className="max-h-80 overflow-auto rounded-lg border">
          {results.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              ไม่พบการ์ด
            </p>
          ) : (
            results.map((c) => (
              <button
                key={c.cardCode}
                type="button"
                onClick={() => {
                  onSelect({
                    cardCode: c.cardCode,
                    nameJp: c.nameJp,
                    nameEn: c.nameEn ?? null,
                    rarity: c.rarity ?? "",
                    imageUrl: c.imageUrl ?? null,
                    latestPriceJpy: c.latestPriceJpy ?? null,
                    latestPriceThb: c.latestPriceThb ?? null,
                  });
                  setShowResults(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted",
                  selected?.cardCode === c.cardCode && "bg-primary/5"
                )}
              >
                <div className={cn("size-10 shrink-0 overflow-hidden rounded", CARD_BG)}>
                  {c.imageUrl ? (
                    <Image
                      src={c.imageUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="size-full object-contain"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-overlay text-muted-foreground">
                      N/A
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {c.nameEn ?? c.nameJp}
                  </p>
                  <p className="text-meta">
                    {c.cardCode}
                    {c.rarity && ` · ${c.rarity}`}
                  </p>
                </div>
                {c.latestPriceJpy != null && (
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    ¥{c.latestPriceJpy.toLocaleString()}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {selected && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-start gap-4">
            <div className={cn("relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-lg", CARD_BG)}>
              {selected.imageUrl ? (
                <Image
                  src={selected.imageUrl}
                  alt={selected.nameEn ?? selected.nameJp}
                  fill
                  className="object-contain"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-meta">
                  No image
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-semibold">
                {selected.nameEn ?? selected.nameJp}
              </p>
              <p className="font-mono text-sm text-muted-foreground">
                {selected.cardCode}
              </p>
              <div className="flex gap-1.5">
                {selected.rarity && (
                  <Badge variant="outline">{selected.rarity}</Badge>
                )}
              </div>
              {selected.latestPriceJpy != null && (
                <p className="text-sm">
                  ราคาตลาด: <span className="font-semibold">¥{selected.latestPriceJpy.toLocaleString()}</span>
                  {selected.latestPriceThb != null && (
                    <span className="text-muted-foreground">
                      {" "}(~฿{selected.latestPriceThb.toLocaleString()})
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!selected} className="gap-1">
          ถัดไป
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
