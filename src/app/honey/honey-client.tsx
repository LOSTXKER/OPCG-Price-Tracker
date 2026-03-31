"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Award,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Crosshair,
  Flame,
  Gift,
  History,
  ListChecks,
  Lock,
  Medal,
  Package,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
  Star,
  Ticket,
  TrendingUp,
  Trophy,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthPreviewGate } from "@/components/shared/login-gate";
import { useAuthState } from "@/hooks/use-auth-state";
import { useUIStore } from "@/stores/ui-store";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ──────────────── Types ──────────────── */

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

type LeaderboardUser = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  honeyPoints: number;
  checkinStreak: number;
};

type Mission = {
  checkedPrice: boolean;
  addedCard: boolean;
  viewedSet: boolean;
  completed: boolean;
  rewardClaimed: boolean;
};

type Prediction = {
  id: number;
  direction: string;
  priceAtPrediction: number;
  resolved: boolean;
  correct: boolean | null;
  weekStart: string;
  card: { id: number; cardCode: string; nameJp: string; nameEn: string | null; imageUrl: string | null; latestPriceJpy: number | null };
};

type HoneyLevel = {
  level: number;
  label: string;
  nextThreshold: number | null;
};

type ActiveEvent = {
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  honeyMultiplier: number;
  endDate: string;
};

type RaffleData = {
  id: number;
  month: string;
  title: string;
  titleEn: string | null;
  titleTh: string | null;
  description: string | null;
  prizes: { rank: number; name: string; honeyBonus?: number }[];
  ticketCost: number;
  maxTickets: number;
  freeThreshold: number;
  totalTickets: number;
  totalParticipants: number;
};

type AchievementItem = {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  description: string | null;
  honeyReward: number;
  earned: boolean;
  earnedAt: string | null;
};

/* ──────────────── Constants ──────────────── */

const EARN_RULES = [
  { labelKey: "honeyEarnCheckin", pts: "+10", icon: Calendar },
  { labelKey: "honeyEarnPortfolio", pts: "+10", icon: Package },
  { labelKey: "honeyEarnSell", pts: "+20", icon: ShoppingBag },
  { labelKey: "honeyEarnReview", pts: "+5", icon: Star },
  { labelKey: "honeyEarnRefer", pts: "+50", icon: Users },
  { labelKey: "honeyEarnStreak7", pts: "×2", icon: Flame, mult: true },
  { labelKey: "honeyEarnStreak30", pts: "×3", icon: Trophy, mult: true },
] as const;

type TabKey = "overview" | "raffle" | "quests" | "shop" | "rankings";
type TranslationKey = Parameters<typeof t>[1];

const TABS: { key: TabKey; icon: typeof Award; labelKey: TranslationKey }[] = [
  { key: "overview", icon: Award, labelKey: "honeyPoints" },
  { key: "raffle", icon: Ticket, labelKey: "monthlyRaffle" },
  { key: "quests", icon: Medal, labelKey: "quests" },
  { key: "shop", icon: ShoppingBag, labelKey: "honeyShop" },
  { key: "rankings", icon: Trophy, labelKey: "honeyLeaderboard" },
];

const SHOP_CATEGORIES = ["ALL", "TRIAL_PRO", "TRIAL_PRO_PLUS", "PROFILE_FRAME", "BADGE", "PRICE_ALERT_SLOT", "CSV_EXPORT_PASS", "CUSTOM"] as const;
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

/* ──────────────── Entry ──────────────── */

export default function HoneyClient() {
  const { authed } = useAuthState();
  const lang = useUIStore((s) => s.language);

  if (authed === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (authed === false) {
    return <AuthPreviewGate preview={<HoneyMockPreview lang={lang} />} />;
  }

  return <HoneyContent />;
}

/* ──────────────── Main Content ──────────────── */

function HoneyContent() {
  const lang = useUIStore((s) => s.language);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [canCheckin, setCanCheckin] = useState(false);
  const [transactions, setTransactions] = useState<HoneyTx[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [mission, setMission] = useState<Mission | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [level, setLevel] = useState<HoneyLevel | null>(null);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [raffle, setRaffle] = useState<RaffleData | null>(null);
  const [myTickets, setMyTickets] = useState(0);
  const [canClaimFree, setCanClaimFree] = useState(false);
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);
  const [giftRecipient, setGiftRecipient] = useState("");
  const [giftAmount, setGiftAmount] = useState("");
  const [tab, setTab] = useState<TabKey>("overview");
  const [rankingsSubTab, setRankingsSubTab] = useState<"leaderboard" | "history">("leaderboard");
  const [shopFilter, setShopFilter] = useState("ALL");
  const [earnOpen, setEarnOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [honeyRes, shopRes, lbRes, missionsRes, predRes, achRes, raffleRes] = await Promise.all([
        fetch("/api/honey"),
        fetch("/api/honey/shop"),
        fetch("/api/honey/leaderboard"),
        fetch("/api/honey/missions"),
        fetch("/api/honey/predictions"),
        fetch("/api/honey/achievements"),
        fetch("/api/honey/raffle"),
      ]);
      if (honeyRes.ok) {
        const data = await honeyRes.json();
        setPoints(data.honeyPoints);
        setStreak(data.checkinStreak);
        setCanCheckin(data.canCheckin);
        setTransactions(data.recentTransactions);
        if (data.level) setLevel(data.level);
        if (data.activeEvent) setActiveEvent(data.activeEvent);
        if (data.onboardingCompleted === false) {
          fetch("/api/honey/onboarding", { method: "POST" })
            .then((r) => r.json())
            .then((d) => {
              if (d.earned) {
                setPoints(d.total);
                setMessage(t(lang, "onboardingReward"));
              }
            })
            .catch(() => {});
        }
      }
      if (shopRes.ok) setShopItems((await shopRes.json()).items);
      if (lbRes.ok) setLeaderboard((await lbRes.json()).leaderboard);
      if (missionsRes.ok) setMission((await missionsRes.json()).mission);
      if (predRes.ok) setPredictions((await predRes.json()).predictions);
      if (achRes.ok) setAchievements((await achRes.json()).achievements);
      if (raffleRes.ok) {
        const data = await raffleRes.json();
        if (data.raffle) {
          setRaffle(data.raffle);
          setMyTickets(data.myTickets);
          setCanClaimFree(data.canClaimFree);
        }
      }
    } catch (err) {
      console.error("Failed to load honey data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Actions ── */
  const handleCheckin = async () => {
    setCheckinLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/honey", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "checkin" }) });
      const data = await res.json();
      if (res.ok) { setPoints(data.total); setStreak(data.streak); setCanCheckin(false); setMessage(`${t(lang, "checkinSuccess")} +${data.earned}`); }
      else setMessage(data.error);
    } catch { setMessage(t(lang, "checkinFailed")); }
    finally { setCheckinLoading(false); }
  };

  const handleRedeem = async (itemId: number) => {
    setMessage(null);
    try {
      const res = await fetch("/api/honey", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "redeem", itemId }) });
      const data = await res.json();
      if (res.ok) { setPoints(data.total); setMessage(t(lang, "redeemSuccess")); load(); }
      else setMessage(data.error);
    } catch { setMessage(t(lang, "redeemFailed")); }
  };

  const handleBuyTicket = async () => {
    setMessage(null);
    try {
      const res = await fetch("/api/honey/raffle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "buy" }) });
      const data = await res.json();
      if (res.ok) { setMyTickets((p) => p + 1); if (data.total != null) setPoints(data.total); setMessage(t(lang, "raffleBought")); load(); }
      else setMessage(data.error);
    } catch { setMessage(t(lang, "redeemFailed")); }
  };

  const handleClaimFreeTicket = async () => {
    setMessage(null);
    try {
      const res = await fetch("/api/honey/raffle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "claim-free" }) });
      const data = await res.json();
      if (res.ok) { setMyTickets((p) => p + 1); setCanClaimFree(false); setMessage(t(lang, "raffleFreeTicket")); }
      else setMessage(data.error);
    } catch { setMessage(t(lang, "redeemFailed")); }
  };

  const handleGift = async () => {
    setMessage(null);
    const amt = parseInt(giftAmount, 10);
    if (!giftRecipient.trim() || !amt || amt < 1) { setMessage("Enter a valid recipient ID and amount"); return; }
    try {
      const res = await fetch("/api/honey", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "gift", recipientId: giftRecipient.trim(), amount: amt }) });
      const data = await res.json();
      if (res.ok) { setPoints(data.total); setMessage(t(lang, "giftSent")); setGiftRecipient(""); setGiftAmount(""); }
      else setMessage(data.error);
    } catch { setMessage(t(lang, "redeemFailed")); }
  };

  const handleClaimMission = async () => {
    setMessage(null);
    try {
      const res = await fetch("/api/honey/missions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "claim" }) });
      const data = await res.json();
      if (res.ok) { setMission(data.mission); setMessage(`${t(lang, "claimReward")} +${data.earned}`); load(); }
      else setMessage(data.error);
    } catch { setMessage(t(lang, "checkinFailed")); }
  };

  const localName = (item: { name: string; nameEn?: string | null; nameTh?: string | null }) =>
    lang === "EN" ? (item.nameEn ?? item.name) : lang === "TH" ? (item.nameTh ?? item.name) : item.name;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const levelProgress = level?.nextThreshold ? Math.min((points / level.nextThreshold) * 100, 100) : 100;
  const filteredShop = shopFilter === "ALL" ? shopItems : shopItems.filter((i) => i.type === shopFilter);
  const activeCategories = ["ALL", ...new Set(shopItems.map((i) => i.type))];

  return (
    <div className="space-y-5">
      {/* ════════════ HERO ════════════ */}
      <div className="panel overflow-hidden">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
          {/* Points */}
          <div className="flex items-center gap-4 sm:min-w-[180px]">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Award className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Honey</p>
              <p className="text-2xl font-extrabold tabular-nums text-primary sm:text-3xl">
                {points.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Streak + Level */}
          <div className="flex flex-1 flex-wrap items-center gap-3 sm:gap-5">
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1">
              <Flame className="size-3.5 text-primary" />
              <span className="text-xs font-bold tabular-nums text-primary">{streak}</span>
              <span className="text-[10px] text-primary/60">{t(lang, "days")}</span>
            </div>

            {level && (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {level.label}
                </span>
                {level.nextThreshold && (
                  <div className="hidden items-center gap-2 sm:flex">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${levelProgress}%` }} />
                    </div>
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {points}/{level.nextThreshold.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {activeEvent && (
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1">
                <Sparkles className="size-3 text-primary" />
                <span className="text-[10px] font-bold text-primary">
                  {activeEvent.honeyMultiplier}x
                </span>
              </div>
            )}
          </div>

          {/* Check-in */}
          <div className="shrink-0">
            {canCheckin ? (
              <Button onClick={handleCheckin} disabled={checkinLoading} size="sm" className="gap-1.5 border border-primary/20 bg-primary/10 text-primary shadow-sm hover:bg-primary/15">
                <Calendar className="size-3.5" />
                {t(lang, "dailyCheckin")}
              </Button>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="size-3.5 text-price-up" />
                {t(lang, "checkinDone")}
              </span>
            )}
          </div>
        </div>

        {/* Message bar */}
        {message && (
          <div className="border-t bg-primary/5 px-4 py-2 text-center text-xs font-semibold text-primary">
            {message}
          </div>
        )}
      </div>

      {/* ════════════ TAB BAR ════════════ */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted/50 p-1 scrollbar-none">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-all",
                active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {t(lang, item.labelKey)}
            </button>
          );
        })}
      </div>

      {/* ════════════ TAB CONTENT ════════════ */}

      {/* ──── OVERVIEW ──── */}
      {tab === "overview" && (
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Activity feed */}
          <div className="panel lg:col-span-2">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold">{t(lang, "honeyHistory")}</h2>
            </div>
            {transactions.length === 0 ? (
              <EmptyState icon={History} label={t(lang, "noTransactions")} />
            ) : (
              <div className="divide-y divide-border/40">
                {transactions.map((tx) => <TxRow key={tx.id} tx={tx} />)}
              </div>
            )}
          </div>

          {/* Side column */}
          <div className="space-y-4">
            {/* Quick raffle card */}
            <div className="panel p-4">
              <div className="mb-3 flex items-center gap-2">
                <Ticket className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">{t(lang, "monthlyRaffle")}</h3>
              </div>
              {raffle ? (
                <>
                  <p className="mb-1 text-xs font-medium">{localName({ name: raffle.title, nameEn: raffle.titleEn, nameTh: raffle.titleTh })}</p>
                  <div className="mb-2 flex gap-3 text-[10px] text-muted-foreground">
                    <span>{raffle.totalParticipants} {t(lang, "raffleParticipants")}</span>
                    <span>{myTickets}/{raffle.maxTickets}</span>
                  </div>
                  <Button size="sm" onClick={() => setTab("raffle")} variant="outline" className="w-full gap-1.5 border-primary/20 text-primary">
                    <Ticket className="size-3" /> {t(lang, "monthlyRaffle")}
                  </Button>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">{t(lang, "raffleNone")}</p>
              )}
            </div>

            {/* Gift card */}
            <div className="panel p-4">
              <div className="mb-3 flex items-center gap-2">
                <Send className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">{t(lang, "giftHoney")}</h3>
              </div>
              <div className="space-y-2">
                <Input placeholder="User ID" value={giftRecipient} onChange={(e) => setGiftRecipient(e.target.value)} className="h-8 text-xs" />
                <Input type="number" placeholder={t(lang, "amount")} min={1} value={giftAmount} onChange={(e) => setGiftAmount(e.target.value)} className="h-8 text-xs" />
                <Button
                  size="sm"
                  onClick={handleGift}
                  disabled={!giftRecipient.trim() || !giftAmount || parseInt(giftAmount) < 1 || points < parseInt(giftAmount || "0")}
                  className="w-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="size-3" /> {t(lang, "giftHoney")}
                </Button>
              </div>
            </div>

            {/* How to Earn -- collapsible */}
            <div className="panel">
              <button
                onClick={() => setEarnOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t(lang, "howToEarn")}</span>
                <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", earnOpen && "rotate-180")} />
              </button>
              {earnOpen && (
                <div className="divide-y divide-border/40">
                  {EARN_RULES.map((rule) => {
                    const Icon = rule.icon;
                    const isMult = "mult" in rule && rule.mult;
                    return (
                      <div key={rule.labelKey} className="flex items-center gap-2 px-4 py-2">
                        <Icon className={cn("size-3.5 shrink-0", isMult ? "text-primary" : "text-muted-foreground/60")} />
                        <span className="flex-1 truncate text-[11px]">{t(lang, rule.labelKey)}</span>
                        <span className="shrink-0 text-[11px] font-bold tabular-nums text-primary">{rule.pts}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──── RAFFLE ──── */}
      {tab === "raffle" && (
        <>
          {raffle ? (
            <div className="space-y-4">
              {/* Prizes hero — most prominent section */}
              <div className="panel overflow-hidden">
                <div className="border-b px-4 py-3">
                  <h2 className="text-sm font-semibold">{t(lang, "rafflePrizes")}</h2>
                </div>
                <div className="grid gap-px bg-border/40 sm:grid-cols-{n}" style={{ gridTemplateColumns: `repeat(${Math.min(raffle.prizes.length, 4)}, minmax(0, 1fr))` }}>
                  {raffle.prizes.map((prize, i) => {
                    const isGrand = i === 0;
                    return (
                      <div key={i} className={cn("flex flex-col items-center gap-2 bg-card p-5 text-center", isGrand && "sm:col-span-1")}>
                        <div className={cn(
                          "flex size-12 items-center justify-center rounded-xl",
                          isGrand ? "bg-primary/15 text-primary" : i === 1 ? "bg-muted text-muted-foreground" : "bg-accent text-accent-foreground",
                        )}>
                          <Trophy className={cn("size-5", isGrand && "size-6")} />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          #{i + 1}
                        </span>
                        <p className={cn("text-sm font-semibold", isGrand && "text-base")}>{prize.name}</p>
                        {prize.honeyBonus != null && prize.honeyBonus > 0 && (
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">+{prize.honeyBonus} Honey</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {/* Info + actions */}
                <div className="space-y-4 lg:col-span-2">
                  <div className="panel p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] text-muted-foreground">{raffle.month}</span>
                        <h2 className="mt-0.5 text-lg font-bold">{localName({ name: raffle.title, nameEn: raffle.titleEn, nameTh: raffle.titleTh })}</h2>
                        {raffle.description && <p className="mt-1 text-xs text-muted-foreground">{raffle.description}</p>}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[
                        { val: myTickets, label: t(lang, "raffleMyTickets") },
                        { val: raffle.totalParticipants, label: t(lang, "raffleParticipants") },
                        { val: raffle.maxTickets, label: "max" },
                      ].map((s) => (
                        <div key={s.label} className="rounded-lg bg-muted/50 p-2.5 text-center">
                          <p className="text-lg font-bold tabular-nums">{s.val}</p>
                          <p className="text-[10px] text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                      <Button onClick={handleBuyTicket} disabled={points < raffle.ticketCost || myTickets >= raffle.maxTickets} className="flex-1 gap-1.5 border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15">
                        <Ticket className="size-4" /> {raffle.ticketCost} pts
                      </Button>
                      {canClaimFree && (
                        <Button variant="outline" onClick={handleClaimFreeTicket} className="flex-1 gap-1.5 border-primary/20 text-primary">
                          <Gift className="size-4" /> {t(lang, "raffleFreeTicket")}
                        </Button>
                      )}
                    </div>

                    {!canClaimFree && (
                      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Flame className="size-3 text-primary/40" />
                        {t(lang, "raffleStreakRequired")} ({raffle.freeThreshold} {t(lang, "days")})
                      </div>
                    )}
                  </div>
                </div>

                {/* My tickets */}
                <div className="panel">
                  <div className="border-b px-4 py-3">
                    <h3 className="text-sm font-semibold">{t(lang, "raffleMyTickets")}</h3>
                  </div>
                  <div className="p-4">
                    {myTickets > 0 ? (
                      <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: myTickets }).map((_, i) => (
                          <div key={i} className="flex aspect-square items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Ticket className="size-4" />
                          </div>
                        ))}
                        {Array.from({ length: raffle.maxTickets - myTickets }).map((_, i) => (
                          <div key={`e${i}`} className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border/40 text-muted-foreground/20">
                            <Ticket className="size-4" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-6 text-center">
                        <Ticket className="size-5 text-muted-foreground/30" />
                        <p className="text-xs text-muted-foreground">{t(lang, "raffleNoTickets")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState icon={Ticket} label={t(lang, "raffleNone")} sub={t(lang, "raffleCheckBack")} />
          )}
        </>
      )}

      {/* ──── QUESTS (missions + predictions + achievements) ──── */}
      {tab === "quests" && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Daily Missions */}
          <div className="panel">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold">{t(lang, "dailyMissions")}</h2>
            </div>
            {mission ? (
              <div>
                <div className="flex items-center gap-4 px-4 py-4">
                  {([
                    { key: "addedCard" as const, label: "missionAddCard" as const, Icon: TrendingUp, hint: "/" },
                    { key: "checkedPrice" as const, label: "missionCheckPrice" as const, Icon: Search, hint: "/cards/*" },
                    { key: "viewedSet" as const, label: "missionViewSet" as const, Icon: Wrench, hint: "/compare" },
                  ]).map(({ key, label, Icon }) => {
                    const done = mission[key];
                    return (
                      <div key={key} className="flex flex-1 flex-col items-center gap-1.5">
                        <div className={cn("flex size-10 items-center justify-center rounded-full border-2 transition-colors", done ? "border-price-up bg-price-up/10 text-price-up" : "border-border bg-muted text-muted-foreground")}>
                          {done ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
                        </div>
                        <span className="text-center text-[10px] leading-tight text-muted-foreground">
                          {t(lang, label)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="px-4 pb-3 text-center text-[10px] text-muted-foreground/60">
                  {t(lang, "missionAutoHint")}
                </p>
                <div className="border-t px-4 py-3">
                  {mission.completed && !mission.rewardClaimed ? (
                    <Button size="sm" onClick={handleClaimMission} className="w-full gap-1.5 border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15">
                      <Gift className="size-3.5" /> {t(lang, "claimReward")} (+15)
                    </Button>
                  ) : mission.rewardClaimed ? (
                    <span className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="size-3.5 text-price-up" /> {t(lang, "missionComplete")}
                    </span>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground">{t(lang, "missionComplete")} — {t(lang, "claimReward")}</p>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState icon={ListChecks} label={t(lang, "dailyMissions")} />
            )}
          </div>

          {/* Price Predictions */}
          <div className="panel">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold">{t(lang, "predictions")}</h2>
            </div>
            {predictions.length === 0 ? (
              <EmptyState icon={Crosshair} label={t(lang, "predictionPending")} />
            ) : (
              <div className="divide-y divide-border/40">
                {predictions.map((pred) => (
                  <div key={pred.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                      pred.resolved ? pred.correct ? "bg-price-up/10 text-price-up" : "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                    )}>
                      {pred.direction === "UP" ? "↑" : "↓"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{pred.card.nameEn ?? pred.card.nameJp}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {pred.card.cardCode} &middot; ¥{pred.priceAtPrediction.toLocaleString()} → {pred.card.latestPriceJpy ? `¥${pred.card.latestPriceJpy.toLocaleString()}` : "?"}
                      </p>
                    </div>
                    <span className={cn("text-[10px] font-bold", pred.resolved ? (pred.correct ? "text-price-up" : "text-destructive") : "text-muted-foreground")}>
                      {pred.resolved ? (pred.correct ? t(lang, "predictionCorrect") : t(lang, "predictionWrong")) : t(lang, "predictionPending")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="panel lg:col-span-2">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold">{t(lang, "achievements")}</h2>
            </div>
            {achievements.length === 0 ? (
              <EmptyState icon={Medal} label={t(lang, "achievements")} />
            ) : (
              <div className="grid gap-0 divide-y divide-border/40 sm:grid-cols-2 sm:divide-y-0">
                {achievements.map((ach) => (
                  <div key={ach.id} className="flex items-center gap-3 border-b border-border/40 px-4 py-3 last:border-b-0 sm:border-b-0 sm:odd:border-r">
                    <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", ach.earned ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                      {ach.earned ? <Trophy className="size-4" /> : <Lock className="size-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-xs font-medium", !ach.earned && "text-muted-foreground")}>{localName(ach)}</p>
                      {ach.description && <p className="text-[10px] text-muted-foreground">{ach.description}</p>}
                      {ach.earned && ach.earnedAt && <p className="text-[10px] text-price-up">{new Date(ach.earnedAt).toLocaleDateString()}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-[11px] font-bold tabular-nums text-primary">+{ach.honeyReward}</span>
                      {ach.earned ? <CheckCircle2 className="ml-auto mt-0.5 size-3.5 text-price-up" /> : <span className="block text-[9px] text-muted-foreground">{t(lang, "achievementLocked")}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──── SHOP ──── */}
      {tab === "shop" && (
        <div className="space-y-4">
          {/* Category chips */}
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
            <EmptyState icon={ShoppingBag} label={t(lang, "noShopItems")} />
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
                        <h3 className="truncate text-sm font-semibold">{localName(item)}</h3>
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">{SHOP_CAT_LABELS[item.type] ?? item.type}</span>
                      </div>
                    </div>
                    {item.description && <p className="mb-3 text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-sm font-bold tabular-nums text-primary">{item.cost} pts</span>
                      <Button size="sm" onClick={() => handleRedeem(item.id)} disabled={!canAfford || !inStock} className="h-7 gap-1 border border-primary/20 bg-primary/10 text-xs text-primary hover:bg-primary/15">
                        {t(lang, "redeemItem")}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ──── RANKINGS ──── */}
      {tab === "rankings" && (
        <div className="space-y-4">
          {/* Sub-tabs */}
          <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
            {(["leaderboard", "history"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setRankingsSubTab(st)}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  rankingsSubTab === st ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {st === "leaderboard" ? t(lang, "honeyLeaderboard") : t(lang, "honeyHistory")}
              </button>
            ))}
          </div>

          {/* Leaderboard table */}
          {rankingsSubTab === "leaderboard" && (
            <div className="panel overflow-hidden">
              {leaderboard.length === 0 ? (
                <EmptyState icon={Trophy} label={t(lang, "honeyLeaderboard")} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-muted/30">
                      <tr className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                        <th className="px-4 py-2.5 w-12">#</th>
                        <th className="px-4 py-2.5">{t(lang, "anonymous")}</th>
                        <th className="px-4 py-2.5 text-right">Honey</th>
                        <th className="hidden px-4 py-2.5 text-right sm:table-cell">{t(lang, "days")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {leaderboard.map((user, i) => (
                        <tr key={user.id} className="transition-colors hover:bg-muted/20">
                          <td className="px-4 py-2.5">
                            <div className={cn(
                              "flex size-6 items-center justify-center rounded-md text-[10px] font-bold",
                              i === 0 ? "bg-primary/10 text-primary" : i === 1 ? "bg-muted text-muted-foreground" : i === 2 ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                            )}>
                              {i < 3 ? <Trophy className="size-3" /> : i + 1}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="truncate font-medium">{user.displayName ?? t(lang, "anonymous")}</p>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="font-bold tabular-nums text-primary">{user.honeyPoints.toLocaleString()}</span>
                          </td>
                          <td className="hidden px-4 py-2.5 text-right sm:table-cell">
                            <div className="flex items-center justify-end gap-1">
                              <Flame className="size-3 text-primary" />
                              <span className="tabular-nums text-primary">{user.checkinStreak}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* History table */}
          {rankingsSubTab === "history" && (
            <div className="panel overflow-hidden">
              {transactions.length === 0 ? (
                <EmptyState icon={History} label={t(lang, "noTransactions")} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-muted/30">
                      <tr className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                        <th className="px-4 py-2.5">{t(lang, "honeyHistory")}</th>
                        <th className="hidden px-4 py-2.5 sm:table-cell">Type</th>
                        <th className="px-4 py-2.5 text-right">{t(lang, "amount")}</th>
                        <th className="hidden px-4 py-2.5 text-right sm:table-cell">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {transactions.map((tx) => {
                        const positive = tx.amount > 0;
                        return (
                          <tr key={tx.id} className="transition-colors hover:bg-muted/20">
                            <td className="max-w-[200px] truncate px-4 py-2.5 text-xs font-medium">{tx.reason}</td>
                            <td className="hidden px-4 py-2.5 sm:table-cell">
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{tx.type}</span>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span className={cn("font-bold tabular-nums", positive ? "text-price-up" : "text-destructive")}>
                                {positive ? "+" : ""}{tx.amount}
                              </span>
                            </td>
                            <td className="hidden px-4 py-2.5 text-right text-xs text-muted-foreground sm:table-cell">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ──────────────── Shared Components ──────────────── */

function TxRow({ tx }: { tx: HoneyTx }) {
  const positive = tx.amount > 0;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", positive ? "bg-price-up/10 text-price-up" : "bg-destructive/10 text-destructive")}>
        {positive ? <Zap className="size-3" /> : <ShoppingBag className="size-3" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{tx.reason}</p>
        <p className="text-[10px] text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
      </div>
      <span className={cn("shrink-0 text-xs font-bold tabular-nums", positive ? "text-price-up" : "text-destructive")}>
        {positive ? "+" : ""}{tx.amount}
      </span>
    </div>
  );
}

function EmptyState({ icon: Icon, label, sub }: { icon: typeof Award; label: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <Icon className="size-8 text-muted-foreground/20" />
      <p className="text-xs text-muted-foreground/60">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/40">{sub}</p>}
    </div>
  );
}

/* ──────────────── Mock Preview (logged-out) ──────────────── */

function HoneyMockPreview({ lang }: { lang: Language }) {
  return (
    <div className="space-y-5">
      {/* Mock hero */}
      <div className="panel overflow-hidden">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Award className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Honey</p>
              <p className="text-2xl font-extrabold tabular-nums text-primary sm:text-3xl">1,250</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1">
              <Flame className="size-3.5 text-primary" />
              <span className="text-xs font-bold tabular-nums text-primary">7</span>
              <span className="text-[10px] text-primary/60">{t(lang, "days")}</span>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">GOLD</span>
          </div>
          <div className="shrink-0">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-price-up" />
              {t(lang, "checkinDone")}
            </span>
          </div>
        </div>
      </div>

      {/* Mock tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted/50 p-1 scrollbar-none">
        {TABS.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium",
                i === 0 ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {t(lang, item.labelKey)}
            </div>
          );
        })}
      </div>

      {/* Mock content */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="panel lg:col-span-2">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">{t(lang, "honeyHistory")}</h2>
          </div>
          <div className="divide-y divide-border/40">
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
                <span className="shrink-0 text-xs font-bold tabular-nums text-price-up">{row.amount}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-4">
          <div className="mb-3 flex items-center gap-2">
            <Ticket className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">{t(lang, "monthlyRaffle")}</h3>
          </div>
          <p className="text-xs text-muted-foreground">{t(lang, "raffleNone")}</p>
        </div>
      </div>
    </div>
  );
}
