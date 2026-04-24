"use client";

import Link from "next/link";
import {
  ArrowRightLeft,
  Globe,
  Moon,
  Search,
  Sun,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Price } from "@/components/shared/price-inline";
import { useUIStore, type Language, type Currency } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import {
  LANG_OPTIONS,
  CURRENCY_OPTIONS,
  CURRENCY_SYMBOL,
  type MarketStats,
} from "./header-constants";

interface MarketTickerProps {
  stats: MarketStats;
  authLoaded: boolean;
  authUser: object | null;
  canUpgrade: boolean;
  mounted: boolean;
  onSearchOpen: () => void;
}

export function HeaderMarketTicker({
  stats,
  authLoaded,
  authUser,
  canUpgrade,
  mounted,
  onSearchOpen,
}: MarketTickerProps) {
  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const currency = useUIStore((s) => s.currency);
  const setCurrency = useUIStore((s) => s.setCurrency);
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="border-b border-border/40 bg-background">
      <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-6 text-xs lg:px-8">
        {/* Left — market ticker chips */}
        <div className="flex items-center gap-2 text-muted-foreground">
          {stats.totalCards > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1">
              <span className="font-medium">{t(language, "totalCards")}</span>
              <span className="font-bold tabular-nums text-foreground">
                {stats.totalCards.toLocaleString()}
              </span>
            </div>
          )}

          {stats.totalValue > 0 && (
            <Link href="/market-overview" className="group flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/5 px-2.5 py-1 transition-colors hover:border-green-500/40 hover:bg-green-500/10">
              <span className="font-medium text-green-700 dark:text-green-300">{t(language, "totalValue")}</span>
              <span className="font-bold tabular-nums text-green-600 dark:text-green-400">
                <Price jpy={stats.totalValue} />
              </span>
              <TrendingUp className="size-3 text-green-500 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}

          <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1">
            <ArrowRightLeft className="size-3 text-blue-500" />
            <span className="font-medium">JPY/THB</span>
            <span className="font-bold tabular-nums text-foreground">
              {stats.exchangeRate.toFixed(3)}
            </span>
          </div>

          {stats.topMover && stats.topMover.change !== 0 && (
            <Link
              href={`/cards/${stats.topMover.code}`}
              className="flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1 transition-colors hover:bg-muted/80"
            >
              <TrendingUp className="size-3 text-green-500" />
              <span className="font-medium">Top 24h</span>
              <span className="max-w-[120px] truncate font-bold text-foreground">
                {stats.topMover.name}
              </span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-bold leading-none",
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

        {/* Right — search + preferences */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSearchOpen}
            className="flex h-7 w-40 items-center gap-1.5 rounded-md border border-border/80 bg-background/80 px-2.5 text-muted-foreground transition-colors hover:border-border hover:bg-background lg:w-48"
          >
            <Search className="size-3.5 shrink-0 text-muted-foreground/60" />
            <span className="flex-1 text-left text-xs text-muted-foreground/70">{t(language, "searchPlaceholder")}</span>
            <kbd className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs leading-none text-muted-foreground/60">/</kbd>
          </button>

          <div className="mx-0.5 h-4 w-px bg-border/40" />

          {authLoaded && authUser && canUpgrade && (
            <>
              <Link
                href="/pricing"
                className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                <Zap className="size-3" />
                {language === "TH" ? "อัปเกรด" : language === "JP" ? "アップグレード" : "Upgrade"}
              </Link>
              <div className="mx-0.5 h-4 w-px bg-border/40" />
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1 font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted/60 hover:text-foreground focus:outline-none">
              <Globe className="size-3" />
              <span>{LANG_OPTIONS.find((l) => l.value === language)?.label ?? language}</span>
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
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1 font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted/60 hover:text-foreground focus:outline-none">
              <span>{CURRENCY_SYMBOL[currency]}</span>
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
            className="flex items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1 text-muted-foreground transition-colors hover:border-border hover:bg-muted/60 hover:text-foreground"
          >
            {mounted && resolvedTheme === "dark" ? <Sun className="size-3" /> : <Moon className="size-3" />}
            <span className="font-medium">{mounted && resolvedTheme === "dark" ? t(language, "lightMode") : t(language, "darkMode")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
