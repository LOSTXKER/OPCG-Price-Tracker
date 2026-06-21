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
import { t } from "@/lib/i18n";
import { formatCount } from "@/lib/utils/currency";
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
    <div className="border-b border-[var(--p-hair)] bg-background">
      <div className="mx-auto flex h-11 max-w-7xl items-center gap-3 px-4 lg:px-6">
        {/* Left — market ticker chips (scrolls on narrow widths so the row doesn’t feel “exploded”) */}
        <div className="flex min-h-0 min-w-0 flex-1 items-center gap-2 overflow-x-auto overflow-y-hidden text-muted-foreground [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {stats.totalCards > 0 && (
            <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1.5 text-sm">
              <span className="font-medium">{t(language, "totalCards")}</span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatCount(stats.totalCards)}
              </span>
            </div>
          )}

          {stats.totalValue > 0 && (
            <Link href="/market-overview" className="group ease-chrome flex shrink-0 items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/5 px-3 py-1.5 text-sm transition-colors hover:border-green-500/40 hover:bg-green-500/10">
              <span className="font-medium text-green-700 dark:text-green-300">{t(language, "totalValue")}</span>
              <span className="font-semibold tabular-nums text-green-600 dark:text-green-400">
                <Price jpy={stats.totalValue} />
              </span>
              <TrendingUp className="size-3 shrink-0 text-green-500 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}

          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1.5 text-sm">
            <ArrowRightLeft className="size-3 shrink-0 text-blue-500" />
            <span className="font-medium">JPY/THB</span>
            <span className="font-semibold tabular-nums text-foreground">
              {stats.exchangeRate.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Right — search + preferences */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onSearchOpen}
            className="surface-2 hairline ease-chrome flex h-8 w-44 items-center gap-1.5 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground lg:w-52"
          >
            <Search className="size-3.5 shrink-0 text-muted-foreground/60" />
            <span className="min-w-0 flex-1 truncate text-left text-muted-foreground/70">{t(language, "searchPlaceholder")}</span>
            <kbd className="shrink-0 rounded bg-muted px-1 py-px font-mono text-micro leading-none text-muted-foreground/60">/</kbd>
          </button>

          <div className="mx-1 hidden h-5 w-px bg-border/60 sm:block" />

          {authLoaded && authUser && canUpgrade && (
            <>
              <Link
                href="/pricing"
                className="ease-chrome hidden items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 sm:flex"
              >
                <Zap className="size-3" />
                {language === "TH" ? "อัปเกรด" : language === "JP" ? "アップグレード" : "Upgrade"}
              </Link>
              <div className="mx-1 hidden h-5 w-px bg-border/60 sm:block" />
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger className="ease-chrome flex items-center gap-1.5 rounded-full border border-[var(--p-hair)] px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-[var(--p-hair)] hover:bg-foreground/[0.06] hover:text-foreground focus:outline-none">
              <Globe className="size-3" />
              <span className="hidden sm:inline">{LANG_OPTIONS.find((l) => l.value === language)?.label ?? language}</span>
              <span className="sm:hidden">{language}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6} className="min-w-[120px]">
              <DropdownMenuRadioGroup value={language} onValueChange={(v) => setLanguage(v as Language)}>
                {LANG_OPTIONS.map((l) => (
                  <DropdownMenuRadioItem key={l.value} value={l.value} className="text-sm">
                    {l.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="ease-chrome flex items-center gap-1.5 rounded-full border border-[var(--p-hair)] px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-[var(--p-hair)] hover:bg-foreground/[0.06] hover:text-foreground focus:outline-none">
              <span>{CURRENCY_SYMBOL[currency]}</span>
              <span>{currency}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6} className="min-w-[120px]">
              <DropdownMenuRadioGroup value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                {CURRENCY_OPTIONS.map((c) => (
                  <DropdownMenuRadioItem key={c.value} value={c.value} className="text-sm">
                    {c.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="ease-chrome flex items-center gap-1.5 rounded-full border border-[var(--p-hair)] px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-[var(--p-hair)] hover:bg-foreground/[0.06] hover:text-foreground"
          >
            {mounted && resolvedTheme === "dark" ? <Sun className="size-3" /> : <Moon className="size-3" />}
            <span className="hidden font-medium lg:inline">{mounted && resolvedTheme === "dark" ? t(language, "lightMode") : t(language, "darkMode")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
