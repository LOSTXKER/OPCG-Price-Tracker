"use client";

import { useState } from "react";
import { Gift, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ShopItem } from "../types";
import { localizedName } from "../types";

const SHOP_CAT_LABELS: Record<string, string> = {
  ALL: "All",
  TRIAL_PRO: "Trial",
  TRIAL_PRO_PLUS: "Trial+",
  PROFILE_FRAME: "Frames",
  BADGE: "Badges",
  PRICE_ALERT_SLOT: "Alerts",
  CSV_EXPORT_PASS: "Export",
  CUSTOM: "Other",
};

export function ShopTab({
  lang,
  shopItems,
  points,
  onRedeem,
}: {
  lang: Language;
  shopItems: ShopItem[];
  points: number;
  onRedeem: (itemId: number) => void;
}) {
  const [shopFilter, setShopFilter] = useState("ALL");

  const activeCategories = ["ALL", ...new Set(shopItems.map((i) => i.type))];
  const filteredShop = shopFilter === "ALL" ? shopItems : shopItems.filter((i) => i.type === shopFilter);

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
        {activeCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setShopFilter(cat)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
              shopFilter === cat ? "border border-primary/20 bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {SHOP_CAT_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      {filteredShop.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-center">
          <ShoppingBag className="size-8 text-muted-foreground/20" />
          <p className="text-xs text-muted-foreground/60">{t(lang, "noShopItems")}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredShop.map((item) => {
            const canAfford = points >= item.cost;
            const inStock = item.stock == null || item.stock > 0;
            return (
              <div key={item.id} className="panel flex flex-col p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Gift className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">{localizedName(item, lang)}</h3>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">{SHOP_CAT_LABELS[item.type] ?? item.type}</span>
                  </div>
                </div>
                {item.description && <p className="mb-3 text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-sm font-bold tabular-nums text-primary">{item.cost} pts</span>
                  <Button size="sm" onClick={() => onRedeem(item.id)} disabled={!canAfford || !inStock} className="h-7 gap-1 border border-primary/20 bg-primary/10 text-xs text-primary hover:bg-primary/15">
                    {t(lang, "redeemItem")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
