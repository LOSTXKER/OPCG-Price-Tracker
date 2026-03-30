"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Award,
  Calendar,
  CheckCircle2,
  Flame,
  Gift,
  History,
  Package,
  ShoppingBag,
  Star,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthPreviewGate } from "@/components/shared/login-gate";
import { useAuthState } from "@/hooks/use-auth-state";
import { useUIStore } from "@/stores/ui-store";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type HoneyTx = {
  id: number;
  amount: number;
  type: string;
  reason: string;
  createdAt: string;
};

type ShopItem = {
  id: number;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  description: string | null;
  cost: number;
  type: string;
  isActive: boolean;
  stock: number | null;
};

const EARN_RULES = [
  { labelKey: "honeyEarnCheckin", pts: "+10", icon: Calendar },
  { labelKey: "honeyEarnPortfolio", pts: "+10", icon: Package },
  { labelKey: "honeyEarnSell", pts: "+20", icon: ShoppingBag },
  { labelKey: "honeyEarnReview", pts: "+5", icon: Star },
  { labelKey: "honeyEarnRefer", pts: "+50", icon: Users },
  { labelKey: "honeyEarnStreak7", pts: "×2", icon: Flame, mult: true },
  { labelKey: "honeyEarnStreak30", pts: "×3", icon: Trophy, mult: true },
] as const;

const NAV_ITEMS = [
  { key: "overview" as const, icon: Award, labelKey: "honeyPoints" },
  { key: "shop" as const, icon: ShoppingBag, labelKey: "honeyShop" },
  { key: "history" as const, icon: History, labelKey: "honeyHistory" },
] as const;

export default function HoneyClient() {
  const { authed } = useAuthState();
  const lang = useUIStore((s) => s.language);

  if (authed === null) {
    return (
      <div className="flex flex-col gap-5 md:flex-row">
        <aside className="w-full shrink-0 md:w-64">
          <div className="space-y-3">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </aside>
        <main className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 rounded-xl" />
        </main>
      </div>
    );
  }

  if (authed === false) {
    return <AuthPreviewGate preview={<HoneyMockPreview lang={lang} />} />;
  }

  return <HoneyContent />;
}

function HoneyContent() {
  const lang = useUIStore((s) => s.language);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [canCheckin, setCanCheckin] = useState(false);
  const [transactions, setTransactions] = useState<HoneyTx[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [tab, setTab] = useState<"overview" | "shop" | "history">("overview");
  const [loading, setLoading] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [honeyRes, shopRes] = await Promise.all([
        fetch("/api/honey"),
        fetch("/api/honey/shop"),
      ]);
      if (honeyRes.ok) {
        const data = await honeyRes.json();
        setPoints(data.honeyPoints);
        setStreak(data.checkinStreak);
        setCanCheckin(data.canCheckin);
        setTransactions(data.recentTransactions);
      }
      if (shopRes.ok) {
        const data = await shopRes.json();
        setShopItems(data.items);
      }
    } catch (err) {
      console.error("Failed to load honey data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCheckin = async () => {
    setCheckinLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/honey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkin" }),
      });
      const data = await res.json();
      if (res.ok) {
        setPoints(data.total);
        setStreak(data.streak);
        setCanCheckin(false);
        setMessage(`${t(lang, "checkinSuccess")} +${data.earned}`);
      } else {
        setMessage(data.error);
      }
    } catch {
      setMessage(t(lang, "checkinFailed"));
    } finally {
      setCheckinLoading(false);
    }
  };

  const handleRedeem = async (itemId: number) => {
    setMessage(null);
    try {
      const res = await fetch("/api/honey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redeem", itemId }),
      });
      const data = await res.json();
      if (res.ok) {
        setPoints(data.total);
        setMessage(t(lang, "redeemSuccess"));
        load();
      } else {
        setMessage(data.error);
      }
    } catch {
      setMessage(t(lang, "redeemFailed"));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-5 md:flex-row">
        <aside className="w-full shrink-0 md:w-64">
          <div className="space-y-3">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </aside>
        <main className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 rounded-xl" />
        </main>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t(lang, "honeyPoints")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(lang, "honeySubtitle")}</p>
      </div>

      <div className="flex flex-col gap-5 md:flex-row">
      {/* ──── Sidebar ──── */}
      <aside className="w-full shrink-0 md:w-64">
        <div className="md:sticky md:top-20 md:space-y-3">
          {/* Points card */}
          <div className="overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent">
            <div className="px-4 pb-3 pt-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-amber-600/60 dark:text-amber-400/60">
                {t(lang, "honeyPoints")}
              </p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums text-amber-500">
                {points.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <Flame className="size-3.5 text-orange-500" />
                <span className="text-xs font-bold tabular-nums text-orange-500">
                  {streak}
                </span>
                <span className="text-[10px] text-orange-500/60">
                  {t(lang, "days")}
                </span>
              </div>
            </div>
            <div className="border-t border-amber-500/10 bg-amber-500/[0.03] px-4 py-2.5">
              {canCheckin ? (
                <Button
                  onClick={handleCheckin}
                  disabled={checkinLoading}
                  size="sm"
                  className="w-full gap-1.5 bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                >
                  <Calendar className="size-3.5" />
                  {t(lang, "dailyCheckin")}
                </Button>
              ) : (
                <span className="flex items-center justify-center gap-1.5 py-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="size-3.5 text-price-up" />
                  {t(lang, "checkinDone")}
                </span>
              )}
              {message && (
                <p className="mt-1.5 text-center text-[11px] font-semibold text-amber-500">
                  {message}
                </p>
              )}
            </div>
          </div>

          {/* Navigation -- horizontal on mobile, vertical on desktop */}
          <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-0.5 md:flex-col md:gap-0 md:rounded-xl md:p-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-all md:flex-none md:justify-start md:px-3 md:py-2",
                    active
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  <span>{t(lang, item.labelKey)}</span>
                </button>
              );
            })}
          </div>

          {/* How to Earn -- desktop only */}
          <div className="hidden rounded-xl border bg-card md:block">
            <div className="px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t(lang, "howToEarn")}
              </p>
            </div>
            <div className="divide-y divide-border/40">
              {EARN_RULES.map((rule) => {
                const Icon = rule.icon;
                const isMult = "mult" in rule && rule.mult;
                return (
                  <div
                    key={rule.labelKey}
                    className="flex items-center gap-2 px-3 py-1.5"
                  >
                    <Icon
                      className={cn(
                        "size-3.5 shrink-0",
                        isMult ? "text-orange-500" : "text-muted-foreground/60"
                      )}
                    />
                    <span className="flex-1 truncate text-[11px]">
                      {t(lang, rule.labelKey)}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-[11px] font-bold tabular-nums",
                        isMult ? "text-orange-500" : "text-amber-500"
                      )}
                    >
                      {rule.pts}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* ──── Main content ──── */}
      <main className="min-w-0 flex-1 space-y-4">
        {tab === "overview" && (
          <>
            <h2 className="text-lg font-bold tracking-tight">
              {t(lang, "honeyPoints")}
            </h2>

            <div className="rounded-xl border bg-card">
              <div className="px-4 py-2.5">
                <p className="text-xs font-semibold text-muted-foreground">
                  {t(lang, "honeyHistory")}
                </p>
              </div>
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 pb-8 pt-4 text-center">
                  <History className="size-7 text-muted-foreground/20" />
                  <p className="text-xs text-muted-foreground/60">{t(lang, "noTransactions")}</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {transactions.map((tx) => (
                    <TxRow key={tx.id} tx={tx} />
                  ))}
                </div>
              )}
            </div>

            {/* How to Earn -- mobile only */}
            <div className="rounded-xl border bg-card md:hidden">
              <div className="px-4 py-2.5">
                <p className="text-xs font-semibold text-muted-foreground">
                  {t(lang, "howToEarn")}
                </p>
              </div>
              <div className="divide-y divide-border/40">
                {EARN_RULES.map((rule) => {
                  const Icon = rule.icon;
                  const isMult = "mult" in rule && rule.mult;
                  return (
                    <div
                      key={rule.labelKey}
                      className="flex items-center gap-2.5 px-4 py-2.5"
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          isMult ? "text-orange-500" : "text-muted-foreground"
                        )}
                      />
                      <span className="flex-1 text-xs">{t(lang, rule.labelKey)}</span>
                      <span
                        className={cn(
                          "text-xs font-bold tabular-nums",
                          isMult ? "text-orange-500" : "text-amber-500"
                        )}
                      >
                        {rule.pts}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {tab === "shop" && (
          <>
            <h2 className="text-lg font-bold tracking-tight">
              {t(lang, "honeyShop")}
            </h2>
            {shopItems.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border py-14 text-center">
                <ShoppingBag className="size-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground/60">{t(lang, "noShopItems")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shopItems.map((item) => {
                  const canAfford = points >= item.cost;
                  const inStock = item.stock == null || item.stock > 0;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl border bg-card p-3.5"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                        <Gift className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold">
                          {lang === "EN"
                            ? (item.nameEn ?? item.name)
                            : lang === "TH"
                              ? (item.nameTh ?? item.name)
                              : item.name}
                        </h3>
                        {item.description && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="text-xs font-bold tabular-nums text-amber-500">
                          {item.cost} pts
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleRedeem(item.id)}
                          disabled={!canAfford || !inStock}
                          className="h-7 gap-1 bg-amber-500 text-xs text-white hover:bg-amber-600"
                        >
                          {t(lang, "redeemItem")}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "history" && (
          <>
            <h2 className="text-lg font-bold tracking-tight">
              {t(lang, "honeyHistory")}
            </h2>
            <div className="rounded-xl border bg-card">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-14 text-center">
                  <History className="size-8 text-muted-foreground/20" />
                  <p className="text-xs text-muted-foreground/60">{t(lang, "noTransactions")}</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {transactions.map((tx) => (
                    <TxRow key={tx.id} tx={tx} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
    </div>
  );
}

function TxRow({ tx }: { tx: HoneyTx }) {
  const positive = tx.amount > 0;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md",
          positive ? "bg-price-up/10 text-price-up" : "bg-destructive/10 text-destructive"
        )}
      >
        {positive ? <Zap className="size-3" /> : <ShoppingBag className="size-3" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{tx.reason}</p>
        <p className="text-[10px] text-muted-foreground">
          {new Date(tx.createdAt).toLocaleDateString()}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 text-xs font-bold tabular-nums",
          positive ? "text-price-up" : "text-destructive"
        )}
      >
        {positive ? "+" : ""}{tx.amount}
      </span>
    </div>
  );
}

function HoneyMockPreview({ lang }: { lang: Language }) {
  return (
    <div className="flex flex-col gap-5 md:flex-row">
      <aside className="w-full shrink-0 md:w-64">
        <div className="md:space-y-3">
          {/* Points card mock */}
          <div className="overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent">
            <div className="px-4 pb-3 pt-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-amber-600/60 dark:text-amber-400/60">
                {t(lang, "honeyPoints")}
              </p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums text-amber-500">
                1,250
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <Flame className="size-3.5 text-orange-500" />
                <span className="text-xs font-bold tabular-nums text-orange-500">7</span>
                <span className="text-[10px] text-orange-500/60">{t(lang, "days")}</span>
              </div>
            </div>
            <div className="border-t border-amber-500/10 bg-amber-500/[0.03] px-4 py-2.5">
              <span className="flex items-center justify-center gap-1.5 py-1 text-xs text-muted-foreground">
                <CheckCircle2 className="size-3.5 text-price-up" />
                {t(lang, "checkinDone")}
              </span>
            </div>
          </div>

          {/* Nav mock */}
          <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-0.5 md:flex-col md:gap-0 md:rounded-xl md:p-1">
            {NAV_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium md:flex-none md:justify-start md:px-3 md:py-2",
                    i === 0 ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  <span>{t(lang, item.labelKey)}</span>
                </div>
              );
            })}
          </div>

          {/* How to Earn mock */}
          <div className="hidden rounded-xl border bg-card md:block">
            <div className="px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t(lang, "howToEarn")}
              </p>
            </div>
            <div className="divide-y divide-border/40">
              {EARN_RULES.slice(0, 4).map((rule) => {
                const Icon = rule.icon;
                return (
                  <div key={rule.labelKey} className="flex items-center gap-2 px-3 py-1.5">
                    <Icon className="size-3.5 shrink-0 text-muted-foreground/60" />
                    <span className="flex-1 truncate text-[11px]">{t(lang, rule.labelKey)}</span>
                    <span className="shrink-0 text-[11px] font-bold tabular-nums text-amber-500">
                      {rule.pts}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 space-y-4">
        <h2 className="text-lg font-bold tracking-tight">{t(lang, "honeyPoints")}</h2>

        <div className="rounded-xl border bg-card">
          <div className="px-4 py-2.5">
            <p className="text-xs font-semibold text-muted-foreground">
              {t(lang, "honeyHistory")}
            </p>
          </div>
          <div className="divide-y divide-border/50">
            {[
              { reason: "Daily check-in", amount: "+10", date: "3/28/2026" },
              { reason: "Add card to portfolio", amount: "+10", date: "3/27/2026" },
              { reason: "Daily check-in", amount: "+10", date: "3/27/2026" },
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-price-up/10 text-price-up">
                  <Zap className="size-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{row.reason}</p>
                  <p className="text-[10px] text-muted-foreground">{row.date}</p>
                </div>
                <span className="shrink-0 text-xs font-bold tabular-nums text-price-up">
                  {row.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
