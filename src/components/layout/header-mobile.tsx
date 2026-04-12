"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Check,
  Coins,
  Crown,
  Globe,
  Heart,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  Sun,
  User,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore, type Language, type Currency } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { LANG_OPTIONS, CURRENCY_OPTIONS, type AuthUser } from "./header-constants";

interface MobileHeaderProps {
  authUser: AuthUser | null;
  authLoaded: boolean;
  userName: string;
  userId: string | null;
  honeyPendingActions: boolean;
  unreadMessages: number;
  mounted: boolean;
  onSearchOpen: () => void;
  onLogout: () => Promise<void>;
}

export function HeaderMobile({
  authUser,
  authLoaded,
  userName,
  userId,
  honeyPendingActions,
  unreadMessages,
  mounted,
  onSearchOpen,
  onLogout,
}: MobileHeaderProps) {
  const router = useRouter();
  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const currency = useUIStore((s) => s.currency);
  const setCurrency = useUIStore((s) => s.setCurrency);
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-xl md:hidden">
      <div className="flex h-14 items-center gap-2 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src="/meecard.png" alt="Meecard" width={26} height={26} className="shrink-0 select-none" priority />
          <span className="text-base font-bold tracking-tight">Meecard</span>
        </Link>

        <div className="flex-1" />

        <button
          type="button"
          aria-label={t(language, "searchPlaceholder")}
          onClick={onSearchOpen}
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <Search className="size-[18px]" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t(language, "tools")}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus:outline-none"
          >
            <Menu className="size-[18px]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-56">
            {authLoaded && authUser && (
              <>
                <div className="px-2 py-1.5">
                  <p className="truncate text-sm font-medium">{userName}</p>
                  <p className="truncate text-xs text-muted-foreground">{authUser.email}</p>
                </div>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">{t(language, "languageLabel")}</DropdownMenuLabel>
              {LANG_OPTIONS.map((l) => (
                <DropdownMenuItem key={l.value} onClick={() => setLanguage(l.value)}>
                  <Globe className="size-4" />
                  {l.label}
                  {language === l.value && <Check className="ml-auto size-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">{t(language, "currencyLabel")}</DropdownMenuLabel>
              {CURRENCY_OPTIONS.map((c) => (
                <DropdownMenuItem key={c.value} onClick={() => setCurrency(c.value)}>
                  <Coins className="size-4" />
                  {c.label}
                  {currency === c.value && <Check className="ml-auto size-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
              {mounted && resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {mounted && resolvedTheme === "dark" ? t(language, "lightMode") : t(language, "darkMode")}
            </DropdownMenuItem>

            {authLoaded && authUser ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(userId ? `/profile/${userId}` : "/profile")}>
                  <User className="size-4" />
                  {t(language, "profileLabel")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings className="size-4" />
                  {t(language, "settingsTitle")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/seller")}>
                  <Store className="size-4" />
                  {language === "TH" ? "ศูนย์ผู้ขาย" : language === "JP" ? "販売センター" : "Seller Center"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/orders")}>
                  <ShoppingBag className="size-4" />
                  {language === "TH" ? "คำสั่งซื้อของฉัน" : language === "JP" ? "購入履歴" : "My Orders"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/saved")}>
                  <Heart className="size-4" />
                  {language === "TH" ? "รายการที่บันทึก" : language === "JP" ? "保存済み" : "Saved Listings"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/watchlist")}>
                  <Bookmark className="size-4 text-blue-500 dark:text-blue-400" />
                  {t(language, "watchlistNav")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/messages")}>
                  <MessageCircle className="size-4" />
                  {t(language, "messagesTitle")}
                  {unreadMessages > 0 && (
                    <span className="ml-auto flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white">
                      {unreadMessages > 99 ? "99+" : unreadMessages}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/honey")}>
                  <Sparkles className="size-4" />
                  Honey
                  {honeyPendingActions && (
                    <span className="ml-auto flex size-2">
                      <span className="absolute inline-flex size-2 animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-red-500" />
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => void onLogout()}>
                  <LogOut className="size-4" />
                  {t(language, "logout")}
                </DropdownMenuItem>
              </>
            ) : authLoaded ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/login")}>
                  <User className="size-4" />
                  {t(language, "login")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/register")}>
                  <Zap className="size-4" />
                  {t(language, "register")}
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
