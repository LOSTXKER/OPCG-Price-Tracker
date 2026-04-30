"use client";

import { useMemo, useState } from "react";
import { Crown, Gift, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ShopItem } from "../types";
import { localizedName, localizedShopDesc, localizedShopType } from "../types";
import { FilterTabs } from "./_shared/filter-tabs";

const ALL_LABEL: Record<Language, string> = {
  TH: "ทั้งหมด",
  EN: "All",
  JP: "すべて",
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

  const activeCategories = useMemo(
    () => ["ALL", ...new Set(shopItems.map((i) => i.type))],
    [shopItems],
  );
  const filteredShop = shopFilter === "ALL"
    ? shopItems
    : shopItems.filter((i) => i.type === shopFilter);

  const catLabel = (cat: string) => {
    if (cat === "ALL") return ALL_LABEL[lang];
    return localizedShopType(cat, lang);
  };

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3.5">
        <h2 className="text-h3">{t(lang, "honeyShop")}</h2>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold tabular-nums text-primary">
          🍯 {points.toLocaleString()}
        </span>
      </div>

      <FilterTabs<string>
        value={shopFilter}
        onChange={setShopFilter}
        options={activeCategories.map((cat) => ({ key: cat, label: catLabel(cat) }))}
        ariaLabel={t(lang, "honeyShop")}
      />

      {filteredShop.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-center">
          <ShoppingBag className="size-6 text-muted-foreground/30" />
          <p className="text-meta">{t(lang, "noShopItems")}</p>
        </div>
      ) : (
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredShop.map((item) => {
            const canAfford = points >= item.cost;
            const inStock = item.stock == null || item.stock > 0;
            const isTrial = item.type === "TRIAL_PRO" || item.type === "TRIAL_PRO_PLUS";
            const ItemIcon = isTrial ? Crown : Gift;
            const imageUrl = typeof item.value?.imageUrl === "string" ? item.value.imageUrl : null;

            return (
              <div key={item.id} className="flex flex-col rounded-xl border p-4">
                <div className="mb-3 flex items-center gap-3">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt=""
                      className="size-9 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                      <ItemIcon className="size-4.5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">
                      {isTrial
                        ? `${lang === "TH" ? "แพ็กเกจ" : lang === "JP" ? "パッケージ" : "Package"} ${localizedName(item, lang)}`
                        : localizedName(item, lang)}
                    </h3>
                    <p className="mt-0.5 text-meta">{catLabel(item.type)}</p>
                  </div>
                </div>
                {item.description && (
                  <p className="mb-3 text-meta line-clamp-2">{localizedShopDesc(item.description, lang)}</p>
                )}
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-sm font-bold tabular-nums text-primary">
                    {item.cost.toLocaleString()} 🍯
                  </span>
                  <Button
                    size="sm"
                    onClick={() => onRedeem(item.id)}
                    disabled={!canAfford || !inStock}
                    className={cn(
                      "h-8 gap-1.5 text-xs",
                      canAfford && inStock
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
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
