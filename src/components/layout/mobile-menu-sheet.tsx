"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowRightLeft,
  BellRing,
  Bookmark,
  Heart,
  LogOut,
  MessageCircle,
  Moon,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Sun,
  Swords,
  TrendingUp,
  User,
  Crown,
  BookOpen,
} from "lucide-react";
import { useTheme } from "next-themes";

import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUIStore, type Language, type Currency } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/utils/currency";
import { t } from "@/lib/i18n";
import {
  LANG_OPTIONS,
  CURRENCY_OPTIONS,
  TIER_DISPLAY,
  type AuthUser,
  type UserTierValue,
} from "./header-constants";

interface MobileMenuSheetProps {
  authUser: AuthUser | null;
  authLoaded: boolean;
  userName: string;
  userAvatar: string | null;
  userId: string | null;
  userTier: UserTierValue;
  honeyPoints: number;
  honeyPendingActions: boolean;
  unreadMessages: number;
  mounted: boolean;
  marketplaceEnabled: boolean;
  onLogout: () => Promise<void>;
}

function MenuLink({
  href,
  icon: Icon,
  label,
  badge,
  pendingDot,
  pathname,
  onNav,
}: {
  href: string;
  icon: typeof User;
  label: string;
  badge?: number;
  pendingDot?: boolean;
  pathname: string;
  onNav: () => void;
}) {
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onNav}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-[18px] shrink-0" />
      <span className="flex-1">{label}</span>
      {typeof badge === "number" && badge > 0 && (
        <span className="flex min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold leading-4 text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {pendingDot && (
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-red-500" />
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 mt-4 px-3 text-eyebrow text-muted-foreground/70 first:mt-0">
      {children}
    </p>
  );
}

export function MobileMenuSheet({
  authUser,
  authLoaded,
  userName,
  userAvatar,
  userTier,
  honeyPoints,
  honeyPendingActions,
  unreadMessages,
  mounted,
  marketplaceEnabled,
  onLogout,
}: MobileMenuSheetProps) {
  const pathname = usePathname() ?? "/";
  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const currency = useUIStore((s) => s.currency);
  const setCurrency = useUIStore((s) => s.setCurrency);
  const open = useUIStore((s) => s.mobileMenuOpen);
  const setOpen = useUIStore((s) => s.setMobileMenuOpen);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    if (open) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const close = () => setOpen(false);

  const tier = TIER_DISPLAY[userTier];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-[300px] overflow-y-auto p-0 sm:max-w-[300px]">
        <SheetTitle className="sr-only">Menu</SheetTitle>

        {/* User block */}
        <div className="border-b border-border/40 p-4">
          {authLoaded && authUser ? (
            <div className="flex items-start gap-3">
              <div className="size-10 shrink-0 overflow-hidden rounded-full bg-muted">
                {userAvatar ? (
                  <Image
                    src={userAvatar}
                    alt={userName}
                    width={40}
                    height={40}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <User className="size-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{userName}</p>
                <p className="truncate text-xs text-muted-foreground">{authUser.email}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-micro", tier.color)}>
                    {tier.label}
                  </span>
                  {honeyPoints > 0 && (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <span>🍯</span>
                      {formatCount(honeyPoints)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : authLoaded ? (
            <div className="flex gap-2">
              <Link
                href="/login"
                onClick={close}
                className="flex-1 rounded-lg border border-border/60 py-2.5 text-center text-sm font-medium transition-colors hover:bg-muted/60"
              >
                {t(language, "login")}
              </Link>
              <Link
                href="/register"
                onClick={close}
                className="flex-1 rounded-lg bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                {t(language, "register")}
              </Link>
            </div>
          ) : (
            <div className="h-10 animate-pulse rounded-lg bg-muted" />
          )}
        </div>

        {/* Navigation sections */}
        <div className="p-3">
          {/* Browse */}
          <SectionLabel>{language === "TH" ? "เรียกดู" : language === "JP" ? "ブラウズ" : "Browse"}</SectionLabel>
          <MenuLink href="/sets" icon={Package} label={t(language, "sets")} pathname={pathname} onNav={close} />
          <MenuLink href="/trending" icon={TrendingUp} label={language === "TH" ? "กำลังมา" : language === "JP" ? "トレンド" : "Trending"} pathname={pathname} onNav={close} />
          <MenuLink href="/watchlist" icon={Bookmark} label={t(language, "watchlistNav")} pathname={pathname} onNav={close} />
          <MenuLink href="/compare" icon={ArrowRightLeft} label={t(language, "compareCards")} pathname={pathname} onNav={close} />

          {/* Decks & Tools — hub holds deck/drop calculators, compare, and future meta/tier */}
          <SectionLabel>{t(language, "tools")}</SectionLabel>
          <MenuLink href="/decks" icon={Swords} label={t(language, "decksAndTools")} pathname={pathname} onNav={close} />

          {/* My Account — only when logged in */}
          {authLoaded && authUser && (
            <>
              <SectionLabel>{language === "TH" ? "บัญชีของฉัน" : language === "JP" ? "マイアカウント" : "My Account"}</SectionLabel>
              <MenuLink href="/portfolio" icon={Star} label={t(language, "portfolioNav")} pathname={pathname} onNav={close} />
              {marketplaceEnabled && (
                <>
                  <MenuLink href="/orders" icon={ShoppingBag} label={language === "TH" ? "คำสั่งซื้อ" : language === "JP" ? "購入履歴" : "My Orders"} pathname={pathname} onNav={close} />
                  <MenuLink href="/saved" icon={Heart} label={language === "TH" ? "รายการที่บันทึก" : language === "JP" ? "保存済み" : "Saved"} pathname={pathname} onNav={close} />
                </>
              )}
              <MenuLink href="/settings/alerts" icon={BellRing} label={t(language, "managePriceAlerts")} pathname={pathname} onNav={close} />
              {marketplaceEnabled && (
                <MenuLink href="/messages" icon={MessageCircle} label={t(language, "messagesTitle")} badge={unreadMessages} pathname={pathname} onNav={close} />
              )}
              <MenuLink href="/honey" icon={Sparkles} label="Honey" pendingDot={honeyPendingActions} pathname={pathname} onNav={close} />
              {marketplaceEnabled && (
                <MenuLink href="/seller" icon={Store} label={language === "TH" ? "ศูนย์ผู้ขาย" : language === "JP" ? "販売センター" : "Seller Center"} pathname={pathname} onNav={close} />
              )}
            </>
          )}

          {/* Preferences */}
          <SectionLabel>{language === "TH" ? "การตั้งค่า" : language === "JP" ? "設定" : "Preferences"}</SectionLabel>
          <div className="space-y-2 px-3 py-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t(language, "languageLabel")}</span>
              <Select
                items={LANG_OPTIONS}
                value={language}
                onValueChange={(value) => setLanguage(value as Language)}
              >
                <SelectTrigger size="sm" aria-label="Language" className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANG_OPTIONS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t(language, "currencyLabel")}</span>
              <Select
                items={CURRENCY_OPTIONS}
                value={currency}
                onValueChange={(value) => setCurrency(value as Currency)}
              >
                <SelectTrigger size="sm" aria-label="Currency" className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{language === "TH" ? "ธีม" : language === "JP" ? "テーマ" : "Theme"}</span>
              <button
                type="button"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="flex items-center gap-1.5 rounded-md border border-border/50 bg-card px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted/60"
                aria-label="Toggle theme"
              >
                {mounted && resolvedTheme === "dark" ? (
                  <><Sun className="size-3.5" /> Light</>
                ) : (
                  <><Moon className="size-3.5" /> Dark</>
                )}
              </button>
            </div>
          </div>

          {/* Footer links */}
          <div className="mt-3 border-t border-border/40 pt-3">
            {authLoaded && authUser && (
              <MenuLink href="/settings" icon={Settings} label={t(language, "settingsTitle")} pathname={pathname} onNav={close} />
            )}
            <MenuLink href="/pricing" icon={Crown} label={language === "TH" ? "แพ็กเกจ" : language === "JP" ? "プラン" : "Pricing"} pathname={pathname} onNav={close} />
            <MenuLink href="/guide" icon={BookOpen} label={language === "TH" ? "คู่มือ" : language === "JP" ? "ガイド" : "Guide"} pathname={pathname} onNav={close} />
          </div>

          {/* Logout */}
          {authLoaded && authUser && (
            <div className="mt-2 border-t border-border/40 pt-2">
              <button
                type="button"
                onClick={() => { close(); void onLogout(); }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="size-[18px]" />
                {t(language, "logout")}
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
