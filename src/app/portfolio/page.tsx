"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";
import { PortfolioItem } from "@/components/portfolio/portfolio-item";
import { PortfolioSummary } from "@/components/portfolio/portfolio-summary";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCardSearch, type CardSearchResult } from "@/hooks/use-card-search";
import { jpyToThb } from "@/lib/utils/currency";

type PortfolioCardRow = {
  id: number;
  cardCode: string;
  baseCode: string | null;
  nameJp: string;
  nameEn: string | null;
  imageUrl: string | null;
  latestPriceJpy: number | null;
};

type ItemRow = {
  id: number;
  quantity: number;
  purchasePrice: number | null;
  condition: string;
  card: PortfolioCardRow;
};

type PortfolioRow = {
  id: number;
  name: string;
  items: ItemRow[];
};

async function ensurePortfolioId(): Promise<number> {
  const res = await fetch("/api/portfolio");
  if (!res.ok) throw new Error("โหลดพอร์ตไม่สำเร็จ");
  const data = (await res.json()) as { portfolios: PortfolioRow[] };
  if (data.portfolios?.length) {
    return data.portfolios[0]!.id;
  }
  const create = await fetch("/api/portfolio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Default" }),
  });
  if (!create.ok) throw new Error("สร้างพอร์ตไม่สำเร็จ");
  const created = (await create.json()) as { portfolio: { id: number } };
  return created.portfolio.id;
}

type HistoryPoint = { label: string; value: number };

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState<PortfolioRow[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const cardSearch = useCardSearch();
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const [portfolioRes, historyRes] = await Promise.all([
      fetch("/api/portfolio"),
      fetch("/api/portfolio/history").catch(() => null),
    ]);
    if (!portfolioRes.ok) {
      setError("โหลดข้อมูลไม่สำเร็จ");
      setLoading(false);
      return;
    }
    const data = (await portfolioRes.json()) as { portfolios: PortfolioRow[] };
    setPortfolios(data.portfolios ?? []);

    if (historyRes?.ok) {
      const hData = (await historyRes.json()) as {
        snapshots: { totalJpy: number; snapshotAt: string }[];
      };
      setHistory(
        (hData.snapshots ?? []).map((s) => ({
          label: new Date(s.snapshotAt).toLocaleDateString("th-TH", {
            month: "short",
            day: "numeric",
          }),
          value: s.totalJpy,
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const flatItems = useMemo(() => portfolios.flatMap((p) => p.items), [portfolios]);

  const summary = useMemo(() => {
    let totalValueJpy = 0;
    let totalCostJpy = 0;
    for (const it of flatItems) {
      const px = it.card.latestPriceJpy ?? 0;
      totalValueJpy += px * it.quantity;
      totalCostJpy += (it.purchasePrice ?? 0) * it.quantity;
    }
    const unrealizedPnl = totalValueJpy - totalCostJpy;
    const unrealizedPnlPercent =
      totalCostJpy > 0 ? (unrealizedPnl / totalCostJpy) * 100 : 0;
    return {
      totalValueJpy,
      totalValueThb: jpyToThb(totalValueJpy),
      totalCostJpy,
      unrealizedPnl,
      unrealizedPnlPercent,
      cardCount: flatItems.length,
    };
  }, [flatItems]);

  const removeItem = async (itemId: number) => {
    const res = await fetch(`/api/portfolio/items/${itemId}`, { method: "DELETE" });
    if (res.ok) void load();
  };

  const addCard = async (card: CardSearchResult) => {
    setAdding(true);
    setError(null);
    try {
      const portfolioId = await ensurePortfolioId();
      const res = await fetch("/api/portfolio/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioId,
          cardId: card.id,
          quantity: 1,
          condition: "NM",
        }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        setError(j.error ?? "เพิ่มการ์ดไม่สำเร็จ");
        return;
      }
      setDialogOpen(false);
      cardSearch.reset();
      void load();
    } catch {
      setError("เพิ่มการ์ดไม่สำเร็จ");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="panel animate-pulse p-8">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="mt-3 h-10 w-48 rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight">
            Collection
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            ติดตามมูลค่าคอลเลกชันของคุณ
          </p>
        </div>
        <Button type="button" onClick={() => setDialogOpen(true)} className="gap-1.5">
          <Plus className="size-4" />
          เพิ่มการ์ด
        </Button>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {flatItems.length === 0 ? (
        <KumaEmptyState
          preset="empty-portfolio"
          action={
            <Button type="button" onClick={() => setDialogOpen(true)} className="gap-1.5">
              <Plus className="size-4" />
              เพิ่มการ์ด
            </Button>
          }
        />
      ) : (
        <>
          {/* Hero value */}
          <div className="panel p-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Total Value
            </p>
            <p className="mt-1 font-mono text-4xl font-bold tracking-tight tabular-nums">
              ¥{summary.totalValueJpy.toLocaleString()}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <span className="text-muted-foreground font-mono tabular-nums">
                ~{Math.round(summary.totalValueThb).toLocaleString()} ฿
              </span>
              <span
                className={
                  summary.unrealizedPnl >= 0
                    ? "font-mono font-semibold text-price-up tabular-nums"
                    : "font-mono font-semibold text-price-down tabular-nums"
                }
              >
                {summary.unrealizedPnl >= 0 ? "+" : ""}
                ¥{summary.unrealizedPnl.toLocaleString()} (
                {summary.unrealizedPnlPercent >= 0 ? "+" : ""}
                {summary.unrealizedPnlPercent.toFixed(1)}%)
              </span>
              <span className="text-muted-foreground">
                {summary.cardCount} ใบ
              </span>
            </div>
          </div>

          <PortfolioSummary {...summary} history={history} />

          <div className="space-y-3">
            <h2 className="font-sans text-base font-semibold">
              Holdings
            </h2>
            {flatItems.map((it) => (
              <PortfolioItem
                key={it.id}
                cardCode={it.card.cardCode}
                baseCode={it.card.baseCode}
                nameJp={it.card.nameJp}
                nameEn={it.card.nameEn}
                imageUrl={it.card.imageUrl}
                quantity={it.quantity}
                purchasePrice={it.purchasePrice}
                currentPrice={it.card.latestPriceJpy}
                condition={it.condition}
                onRemove={() => void removeItem(it.id)}
              />
            ))}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ค้นหาการ์ด</DialogTitle>
            <DialogDescription>
              พิมพ์ชื่อหรือรหัสการ์ดแล้วเลือกจากรายการ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="ค้นหา…"
              value={cardSearch.query}
              onChange={(e) => cardSearch.setQuery(e.target.value)}
              autoComplete="off"
              className=""
            />
            <div className="max-h-60 space-y-1 overflow-auto rounded-lg border border-border/50 p-1">
              {cardSearch.query.trim().length < 2 ? (
                <p className="text-muted-foreground px-2 py-3 text-sm">
                  พิมพ์อย่างน้อย 2 ตัวอักษร
                </p>
              ) : cardSearch.results.length === 0 ? (
                <p className="text-muted-foreground px-2 py-3 text-sm">
                  ไม่พบผลลัพธ์
                </p>
              ) : (
                cardSearch.results.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={adding}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                    onClick={() => void addCard(c)}
                  >
                    <span className="font-medium">{c.nameEn ?? c.nameJp}</span>
                    <span className="text-muted-foreground block font-mono text-xs">
                      {c.cardCode}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
