"use client";

import { useMemo, useState } from "react";
import { Crown, Gift, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ShopItem } from "../types";
import { localizedName } from "../types";
import { FilterTabs } from "./_shared/filter-tabs";

const SHOP_CAT_LABELS: Record<string, Record<string, string>> = {
  ALL:              { TH: "ทั้งหมด",            EN: "All",          JP: "すべて" },
  TRIAL_PRO:        { TH: "แพ็กเกจ",             EN: "Package",      JP: "パッケージ" },
  TRIAL_PRO_PLUS:   { TH: "แพ็กเกจ",             EN: "Package",      JP: "パッケージ" },
  PROFILE_FRAME:    { TH: "กรอบโปรไฟล์",        EN: "Frames",       JP: "フレーム" },
  BADGE:            { TH: "แบดจ์",               EN: "Badges",       JP: "バッジ" },
  PRICE_ALERT_SLOT: { TH: "แจ้งเตือน",          EN: "Alerts",       JP: "アラート" },
  CSV_EXPORT_PASS:  { TH: "ส่งออก",             EN: "Export",       JP: "エクスポート" },
  RAFFLE_TICKET:    { TH: "ตั๋วลุ้นรางวัล",     EN: "Tickets",      JP: "チケット" },
  CUSTOM:           { TH: "อื่นๆ",              EN: "Other",        JP: "その他" },
};

const DESC_I18N: { match: string; TH: string; JP: string }[] = [
  { match: "shiny gold frame",          TH: "กรอบโปรไฟล์สีทองสุดพิเศษ",                          JP: "プロフィール用のゴールドフレーム" },
  { match: "diamond frame",             TH: "กรอบโปรไฟล์เพชรสุดพรีเมียม",                        JP: "プロフィール用のダイヤモンドフレーム" },
  { match: "fiery frame",               TH: "กรอบโปรไฟล์ลายไฟสุดเท่",                            JP: "プロフィール用の炎フレーム" },
  { match: "Boost your listing",        TH: "ดันรายการขายของคุณขึ้นด้านบน 24 ชั่วโมง",            JP: "出品を24時間トップに表示" },
  { match: "extra price alert",         TH: "เพิ่มช่องแจ้งเตือนราคาถาวร +1 ช่อง",                JP: "価格アラート枠を1つ追加（永久）" },
  { match: "Kuma badge",                TH: "แบดจ์ Kuma สุดพิเศษบนโปรไฟล์ของคุณ",                JP: "プロフィールにKumaバッジを表示" },
  { match: "Export your portfolio",      TH: "ส่งออกพอร์ตโฟลิโอเป็นไฟล์ CSV 1 ครั้ง",            JP: "ポートフォリオをCSVで1回エクスポート" },
  { match: "Use tickets to enter",      TH: "ใช้ตั๋วเข้าร่วมลุ้นรางวัลประจำเดือน",                JP: "チケットで月間抽選に参加" },
  { match: "Buy 3 tickets",             TH: "ซื้อ 3 ใบในราคาประหยัด",                              JP: "3枚をお得に購入" },
  { match: "Best value! 5",             TH: "คุ้มที่สุด! แพ็ค 5 ใบ",                               JP: "最もお得！5枚パック" },
  { match: "Pro features for 7 days",   TH: "ใช้งานฟีเจอร์ Pro ได้ 7 วัน + แบดจ์พิเศษ",          JP: "Pro機能を7日間利用 + 限定バッジ" },
  { match: "Pro features for 30 days",  TH: "ใช้งานฟีเจอร์ Pro ได้ 30 วัน + แบดจ์ Honey Elite + ตั๋วชิงรางวัลฟรี 1 ใบ", JP: "Pro機能を30日間利用 + Honey Eliteバッジ + 抽選チケット1枚" },
  { match: "Pro+ features for 30 days", TH: "ใช้งานฟีเจอร์ Pro+ ได้ 30 วัน + แบดจ์พิเศษ + ตั๋วชิงรางวัลฟรี 2 ใบ", JP: "Pro+機能を30日間利用 + 限定バッジ + 抽選チケット2枚" },
];

function localizedDesc(desc: string | null, lang: Language): string {
  if (!desc) return "";
  if (lang === "EN") return desc.replace(/Honey Pass/gi, "Honey");
  const entry = DESC_I18N.find((d) => desc.toLowerCase().includes(d.match.toLowerCase()));
  return entry ? entry[lang] : desc.replace(/Honey Pass/gi, "Honey");
}

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
    const labels = SHOP_CAT_LABELS[cat];
    if (!labels) return cat;
    return labels[lang] ?? labels.EN;
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
                  <p className="mb-3 text-meta line-clamp-2">{localizedDesc(item.description, lang)}</p>
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
