"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRightLeft,
  BookOpen,
  Coins,
  Crown,
  Globe,
  LogOut,
  Moon,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";

import { CommandSearchModal } from "@/components/shared/command-search";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useUIStore, type Language, type Currency } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const NAV_LINKS = [
  { href: "/" as const, key: "overview" as const },
  { href: "/sets" as const, key: "sets" as const },
  { href: "/pull-calculator" as const, key: "pullCalculator" as const },
  { href: "/deck-calculator" as const, key: "deckCalculatorNav" as const },
  { href: "/compare" as const, key: "compareCards" as const },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AuthUser = {
  email?: string;
  user_metadata?: { avatar_url?: string; full_name?: string };
};

type UserTierValue = "FREE" | "PRO" | "PRO_PLUS" | "LIFETIME_PRO" | "LIFETIME_PRO_PLUS";

const TIER_DISPLAY: Record<UserTierValue, { label: string; color: string; icon: typeof Star }> = {
  FREE: { label: "Free", color: "bg-muted text-muted-foreground", icon: User },
  PRO: { label: "Pro", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400", icon: Zap },
  PRO_PLUS: { label: "Pro+", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400", icon: Crown },
  LIFETIME_PRO: { label: "Pro ∞", color: "bg-purple-500/15 text-purple-600 dark:text-purple-400", icon: Sparkles },
  LIFETIME_PRO_PLUS: { label: "Pro+ ∞", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400", icon: Crown },
};

type MarketStats = {
  totalCards: number;
  exchangeRate: number;
  topMover: { code: string; name: string; change: number } | null;
};

const LANG_OPTIONS: { value: Language; label: string }[] = [
  { value: "TH", label: "ไทย" },
  { value: "EN", label: "English" },
  { value: "JP", label: "日本語" },
];

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "THB", label: "฿ THB" },
  { value: "JPY", label: "¥ JPY" },
  { value: "USD", label: "$ USD" },
];

const CURRENCY_SYMBOL: Record<Currency, string> = { THB: "฿", JPY: "¥", USD: "$" };

export function Header() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<MarketStats>({
    totalCards: 0,
    exchangeRate: 0.296,
    topMover: { code: "OP13-118-P", name: "Monkey.D.Luffy", change: 5.8 },
  });
  const [userTier, setUserTier] = useState<UserTierValue>("FREE");

  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const currency = useUIStore((s) => s.currency);
  const setCurrency = useUIStore((s) => s.setCurrency);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser()
      .then(({ data }) => {
        setAuthUser(data.user ?? null);
        setAuthLoaded(true);
      })
      .catch(() => {
        setAuthLoaded(true);
      });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      setAuthLoaded(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser) { setUserTier("FREE"); return; }
    fetch("/api/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.tier) setUserTier(data.tier as UserTierValue); })
      .catch(() => {});
  }, [authUser]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [rateRes, statsRes] = await Promise.all([
          fetch("/api/exchange-rate"),
          fetch("/api/cards?limit=1&sort=priceChange24h&order=desc"),
        ]);
        const rateData = rateRes.ok ? await rateRes.json() : null;
        const cardsData = statsRes.ok ? await statsRes.json() : null;

        const top = cardsData?.cards?.[0];
        setStats((prev) => ({
          totalCards: cardsData?.total ?? prev.totalCards,
          exchangeRate: rateData?.rate ?? prev.exchangeRate,
          topMover: top
            ? {
                code: top.cardCode,
                name: top.nameEn ?? top.nameJp ?? top.cardCode,
                change: top.priceChange24h ?? 0,
              }
            : prev.topMover,
        }));
      } catch {
        /* non-critical — keep previous/default values */
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const tierInfo = TIER_DISPLAY[userTier];
  const TierIcon = tierInfo.icon;
  const canUpgrade = userTier === "FREE" || userTier === "PRO";

  return (
    <>
    <div className="sticky top-0 z-50 hidden md:block">
      {/* ══════════ TOP BAR — market ticker + preferences ══════════ */}
      <div className="border-b border-border/40 bg-background">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-6 text-[11.5px] lg:px-8">
          {/* Left — market ticker chips */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex items-center gap-1.5 rounded-full bg-background/60 px-2.5 py-1">
              <ArrowRightLeft className="size-3 text-blue-500" />
              <span className="font-medium">JPY/THB</span>
              <span className="font-bold tabular-nums text-foreground">
                {stats.exchangeRate.toFixed(3)}
              </span>
            </div>

            {stats.topMover && stats.topMover.change !== 0 && (
              <Link
                href={`/cards/${stats.topMover.code}`}
                className="flex items-center gap-1.5 rounded-full bg-background/60 px-2.5 py-1 transition-colors hover:bg-background"
              >
                <TrendingUp className="size-3 text-green-500" />
                <span className="font-medium">Top 24h</span>
                <span className="max-w-[120px] truncate font-bold text-foreground">
                  {stats.topMover.name}
                </span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                    stats.topMover.change >= 0
                      ? "bg-green-500/15 text-green-600 dark:text-green-400"
                      : "bg-red-500/15 text-red-600 dark:text-red-400"
                  )}
                >
                  {stats.topMover.change >= 0 ? "+" : ""}
                  {stats.topMover.change.toFixed(1)}%
                </span>
              </Link>
            )}
          </div>

          {/* Right — search + preferences (compact) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-7 w-40 items-center gap-1.5 rounded-md border border-border/80 bg-background/80 px-2.5 text-muted-foreground transition-colors hover:border-border hover:bg-background lg:w-48"
            >
              <Search className="size-3.5 shrink-0 text-muted-foreground/60" />
              <span className="flex-1 text-left text-[11px] text-muted-foreground/70">{t(language, "searchPlaceholder")}</span>
              <kbd className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] leading-none text-muted-foreground/60">/</kbd>
            </button>

            <div className="mx-0.5 h-4 w-px bg-border/40" />

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 rounded-md px-2 py-1 font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus:outline-none">
                <Globe className="size-3" />
                <span>{language}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={6} className="min-w-[110px]">
                <DropdownMenuRadioGroup value={language} onValueChange={(v) => setLanguage(v as Language)}>
                  {LANG_OPTIONS.map((l) => (
                    <DropdownMenuRadioItem key={l.value} value={l.value} className="text-xs">
                      {l.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 rounded-md px-2 py-1 font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus:outline-none">
                <Coins className="size-3" />
                <span>{currency}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={6} className="min-w-[110px]">
                <DropdownMenuRadioGroup value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                  {CURRENCY_OPTIONS.map((c) => (
                    <DropdownMenuRadioItem key={c.value} value={c.value} className="text-xs">
                      {c.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              title={mounted && resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {mounted && resolvedTheme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ══════════ BOTTOM BAR — brand + nav + user tools ══════════ */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-7xl items-center px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="mr-6 flex shrink-0 items-center gap-2">
            <Image
              src="/meecard.png"
              alt="Meecard"
              width={26}
              height={26}
              className="shrink-0 select-none"
              priority
            />
            <span className="text-[15px] font-bold tracking-tight">Meecard</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center">
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative whitespace-nowrap px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                    active
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t(language, link.key)}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex-1" />

          {/* Right — user tools */}
          <div className="flex items-center gap-0.5">
            {/* Marketplace — prominent */}
            <Link
              href="/marketplace"
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                isActive(pathname, "/marketplace")
                  ? "border-foreground/20 bg-foreground text-background"
                  : "border-border bg-muted/50 text-foreground hover:bg-muted"
              )}
            >
              <ShoppingBag className="size-3.5" />
              {t(language, "marketplace")}
            </Link>

            <div className="mx-1.5 h-5 w-px bg-border/40" />

            {/* Portfolio — chip style */}
            <Link
              href="/portfolio"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                isActive(pathname, "/portfolio")
                  ? "bg-amber-500/10 font-semibold text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              {t(language, "portfolioNav")}
            </Link>

            {/* Honey — chip style */}
            <Link
              href="/honey"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                isActive(pathname, "/honey")
                  ? "bg-amber-500/10 font-semibold text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <span className="text-sm leading-none">🍯</span>
              Honey
            </Link>

            <div className="mx-2 h-5 w-px bg-border/40" />

            {/* Auth area */}
            {authLoaded && authUser ? (
              <div className="flex items-center gap-1.5">
                {/* Upgrade CTA — only if not max tier */}
                {canUpgrade && (
                  <Link
                    href="/pricing"
                    className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20"
                  >
                    <Zap className="size-3" />
                    {language === "TH" ? "อัปเกรด" : language === "JP" ? "アップグレード" : "Upgrade"}
                  </Link>
                )}

                {/* Profile dropdown — avatar + tier integrated */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-muted/60 focus:outline-none">
                    <Avatar size="sm" className="h-7 w-7 ring-2 ring-primary/20">
                      {authUser.user_metadata?.avatar_url ? (
                        <AvatarImage src={authUser.user_metadata.avatar_url} alt="" />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-[11px] font-bold text-primary">
                        {(authUser.user_metadata?.full_name ?? authUser.email ?? "U").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="max-w-[80px] truncate text-[12px] font-medium leading-tight text-foreground">
                        {authUser.user_metadata?.full_name ?? authUser.email?.split("@")[0] ?? "User"}
                      </span>
                      <span className={cn("text-[10px] font-semibold leading-tight", tierInfo.color.replace(/bg-\S+\s?/, ""))}>
                        {tierInfo.label}
                      </span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={8} className="w-56">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="font-normal">
                        <p className="truncate text-xs text-muted-foreground">{authUser.email}</p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", tierInfo.color)}>
                            <TierIcon className="size-2.5" />
                            {tierInfo.label}
                          </span>
                        </div>
                      </DropdownMenuLabel>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <User className="size-4" />
                      {t(language, "profileLabel")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/profile?tab=notifications")}>
                      <Settings className="size-4" />
                      {t(language, "settingsTitle")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/guide")}>
                      <BookOpen className="size-4" />
                      {t(language, "guide")}
                    </DropdownMenuItem>
                    {canUpgrade && (
                      <DropdownMenuItem onClick={() => router.push("/pricing")} className="text-primary">
                        <Zap className="size-4" />
                        {language === "TH" ? "อัปเกรดแพ็กเกจ" : language === "JP" ? "プランをアップグレード" : "Upgrade Plan"}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => void handleLogout()}>
                      <LogOut className="size-4" />
                      {t(language, "logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : authLoaded ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/pricing"
                  className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  <Crown className="size-3 text-amber-500" />
                  {language === "TH" ? "แพ็กเกจ" : language === "JP" ? "プラン" : "Plans"}
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-border/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                >
                  {t(language, "login")}
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {t(language, "register")}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </header>
    </div>

    <CommandSearchModal open={searchOpen} onClose={closeSearch} />
    </>
  );
}
