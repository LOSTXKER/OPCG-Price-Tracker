"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
import { jpyToThb } from "@/lib/utils/currency";

type CardRow = {
  id: number;
  cardCode: string;
  nameJp: string;
  imageUrl: string | null;
  latestPriceJpy: number | null;
};

type ItemRow = {
  id: number;
  quantity: number;
  purchasePrice: number | null;
  condition: string;
  card: CardRow;
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

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState<PortfolioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<CardRow[]>([]);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/portfolio");
    if (!res.ok) {
      setError("โหลดข้อมูลไม่สำเร็จ");
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { portfolios: PortfolioRow[] };
    setPortfolios(data.portfolios ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const t = window.setTimeout(() => {
      void fetch(`/api/cards?search=${encodeURIComponent(q)}&limit=20`)
        .then((r) => r.json())
        .then((j: { cards: CardRow[] }) => setSearchResults(j.cards ?? []))
        .catch(() => setSearchResults([]));
    }, 300);
    return () => window.clearTimeout(t);
  }, [search]);

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

  const addCard = async (card: CardRow) => {
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
      setSearch("");
      setSearchResults([]);
      void load();
    } catch {
      setError("เพิ่มการ์ดไม่สำเร็จ");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">กำลังโหลด…</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
          <p className="text-muted-foreground text-sm">มูลค่าคอลเลกชันของคุณ</p>
        </div>
        <Button type="button" onClick={() => setDialogOpen(true)}>
          เพิ่มการ์ด
        </Button>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {flatItems.length === 0 ? (
        <div className="bg-muted/40 flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 px-6 text-center">
          <p className="text-muted-foreground max-w-sm text-sm">
            เพิ่มการ์ดใบแรกเข้า Portfolio
          </p>
          <Button type="button" onClick={() => setDialogOpen(true)}>
            เพิ่มการ์ด
          </Button>
        </div>
      ) : (
        <>
          <PortfolioSummary {...summary} />
          <div className="space-y-3">
            {flatItems.map((it) => (
              <PortfolioItem
                key={it.id}
                cardCode={it.card.cardCode}
                nameJp={it.card.nameJp}
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
            <DialogDescription>พิมพ์ชื่อหรือรหัสการ์ดแล้วเลือกจากรายการ</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="ค้นหา…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
            <div className="max-h-60 space-y-1 overflow-auto rounded-md border p-1">
              {search.trim().length < 2 ? (
                <p className="text-muted-foreground px-2 py-3 text-sm">พิมพ์อย่างน้อย 2 ตัวอักษร</p>
              ) : searchResults.length === 0 ? (
                <p className="text-muted-foreground px-2 py-3 text-sm">ไม่พบผลลัพธ์</p>
              ) : (
                searchResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={adding}
                    className="hover:bg-muted block w-full rounded-md px-3 py-2 text-left text-sm"
                    onClick={() => void addCard(c)}
                  >
                    <span className="font-medium">{c.nameJp}</span>
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
