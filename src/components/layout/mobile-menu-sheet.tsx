"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowRightLeft,
  BellRing,
  Bookmark,
  ChevronRight,
  Globe,
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
  Wallet,
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
import { GroupedSection, GroupedRow } from "@/components/ui/grouped-list";
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

/** Red count badge for the trailing slot (messages). */
function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="flex min-w-[20px] items-center justify-center rounded-full bg-danger px-1.5 text-micro text-danger-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** Pulsing dot for the trailing slot (honey pending actions). */
function PendingDot() {
  return (
    <span className="relative flex size-2">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger opacity-75" />
      <span className="relative inline-flex size-2 rounded-full bg-danger" />
    </span>
  );
}

/**
 * The "More" tab's drawer — iOS grouped-inset table view grammar (same
 * `GroupedSection`/`GroupedRow` kit as /settings mobile), scoped to a right
 * sheet. All prior behavior is preserved: auth-gated sections, message badge,
 * honey pending dot, marketplace flag gating, language/currency/theme
 * preferences, and close-on-navigate.
 */
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
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const tier = TIER_DISPLAY[userTier];
  const authed = authLoaded && !!authUser;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="w-[320px] overflow-y-auto bg-muted/30 p-0 sm:max-w-[320px] dark:bg-background"
      >
        <SheetTitle className="sr-only">Menu</SheetTitle>

        <div className="space-y-5 py-4 pb-8">
          {/* ── User block — its own grouped card ─────────────────────── */}
          <GroupedSection className="px-4 sm:px-4">
            {authed ? (
              <Link
                href={`/settings`}
                onClick={close}
                className="ease-chrome block transition-colors active:bg-muted/60"
              >
                <div className="flex min-h-[68px] items-center gap-3 px-4 py-3">
                  <div className="size-11 shrink-0 overflow-hidden rounded-full bg-muted">
                    {userAvatar ? (
                      <Image
                        src={userAvatar}
                        alt={userName}
                        width={44}
                        height={44}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <User className="size-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-sm font-semibold">{userName}</p>
                    <p className="truncate text-meta">{authUser?.email}</p>
                    <div className="mt-1 flex items-center gap-2">
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
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
                </div>
              </Link>
            ) : authLoaded ? (
              <div className="flex gap-2 p-4">
                <Link
                  href="/login"
                  onClick={close}
                  className="flex-1 rounded-lg border border-[var(--p-hair)] py-2.5 text-center text-sm font-medium motion-base hover:bg-muted/70"
                >
                  {t(language, "login")}
                </Link>
                <Link
                  href="/register"
                  onClick={close}
                  className="flex-1 rounded-lg bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground motion-base hover:opacity-90"
                >
                  {t(language, "register")}
                </Link>
              </div>
            ) : (
              <div className="p-4">
                <div className="h-11 animate-pulse rounded-lg bg-muted" />
              </div>
            )}
          </GroupedSection>

          {/* ── Browse ────────────────────────────────────────────────── */}
          <GroupedSection className="px-4 sm:px-4" label={t(language, "browse")}>
            <GroupedRow
              icon={Package}
              iconClassName="bg-info-soft text-info"
              title={t(language, "sets")}
              href="/sets"
              onClick={close}
              active={isActive("/sets")}
            />
            <GroupedRow
              icon={TrendingUp}
              iconClassName="bg-success-soft text-success"
              title={t(language, "trendingShort")}
              href="/trending"
              onClick={close}
              active={isActive("/trending")}
            />
            <GroupedRow
              icon={ArrowRightLeft}
              iconClassName="bg-warning-soft text-warning"
              title={t(language, "compareCards")}
              href="/compare"
              onClick={close}
              active={isActive("/compare")}
            />
            <GroupedRow
              icon={Swords}
              iconClassName="bg-primary/12 text-primary"
              title={t(language, "decksAndTools")}
              href="/decks"
              onClick={close}
              active={isActive("/decks")}
            />
          </GroupedSection>

          {/* ── Track — unified MINE surfaces (signed-in only) ─────────── */}
          {authed && (
            <GroupedSection className="px-4 sm:px-4" label={t(language, "trackGroup")}>
              <GroupedRow
                icon={Star}
                iconClassName="bg-primary/12 text-primary"
                title={t(language, "portfolioNav")}
                href="/portfolio"
                onClick={close}
                active={isActive("/portfolio")}
              />
              <GroupedRow
                icon={Bookmark}
                iconClassName="bg-info-soft text-info"
                title={t(language, "watchlistNav")}
                href="/watchlist"
                onClick={close}
                active={isActive("/watchlist")}
              />
              <GroupedRow
                icon={BellRing}
                iconClassName="bg-warning-soft text-warning"
                title={t(language, "managePriceAlerts")}
                href="/settings/alerts"
                onClick={close}
                active={isActive("/settings/alerts")}
              />
            </GroupedSection>
          )}

          {/* ── My Account (signed-in only) ────────────────────────────── */}
          {authed && (
            <GroupedSection className="px-4 sm:px-4" label={t(language, "myAccount")}>
              {marketplaceEnabled && (
                <>
                  <GroupedRow
                    icon={ShoppingBag}
                    iconClassName="bg-info-soft text-info"
                    title={t(language, "myOrders")}
                    href="/orders"
                    onClick={close}
                    active={isActive("/orders")}
                  />
                  <GroupedRow
                    icon={Heart}
                    iconClassName="bg-destructive/10 text-destructive"
                    title={t(language, "savedListings")}
                    href="/saved"
                    onClick={close}
                    active={isActive("/saved")}
                  />
                  <GroupedRow
                    icon={MessageCircle}
                    iconClassName="bg-success-soft text-success"
                    title={t(language, "messagesTitle")}
                    href="/messages"
                    onClick={close}
                    active={isActive("/messages")}
                    trailing={<CountBadge count={unreadMessages} />}
                  />
                </>
              )}
              <GroupedRow
                icon={Sparkles}
                iconClassName="bg-primary/12 text-primary"
                title="Honey"
                href="/honey"
                onClick={close}
                active={isActive("/honey")}
                trailing={honeyPendingActions ? <PendingDot /> : undefined}
              />
              {marketplaceEnabled && (
                <GroupedRow
                  icon={Store}
                  iconClassName="bg-warning-soft text-warning"
                  title={t(language, "sellShellSellerCenter")}
                  href="/seller"
                  onClick={close}
                  active={isActive("/seller")}
                />
              )}
            </GroupedSection>
          )}

          {/* ── Preferences — value rows with inline controls ──────────── */}
          <GroupedSection className="px-4 sm:px-4" label={t(language, "preferences")}>
            <GroupedRow
              icon={Globe}
              iconClassName="bg-info-soft text-info"
              title={t(language, "languageLabel")}
              chevron={false}
              trailing={
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
              }
            />
            <GroupedRow
              icon={Wallet}
              iconClassName="bg-success-soft text-success"
              title={t(language, "currencyLabel")}
              chevron={false}
              trailing={
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
              }
            />
            <GroupedRow
              icon={mounted && resolvedTheme === "dark" ? Moon : Sun}
              iconClassName="bg-muted text-muted-foreground"
              title={t(language, "themeLabel")}
              chevron={false}
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              trailing={
                <span className="text-meta">
                  {mounted && resolvedTheme === "dark" ? "Dark" : "Light"}
                </span>
              }
            />
          </GroupedSection>

          {/* ── Footer links ───────────────────────────────────────────── */}
          <GroupedSection className="px-4 sm:px-4">
            {authed && (
              <GroupedRow
                icon={Settings}
                iconClassName="bg-muted text-muted-foreground"
                title={t(language, "settingsTitle")}
                href="/settings"
                onClick={close}
                active={isActive("/settings") && !isActive("/settings/alerts")}
              />
            )}
            <GroupedRow
              icon={Crown}
              iconClassName="bg-primary/12 text-primary"
              title={t(language, "pricing")}
              href="/pricing"
              onClick={close}
              active={isActive("/pricing")}
            />
            <GroupedRow
              icon={BookOpen}
              iconClassName="bg-info-soft text-info"
              title={t(language, "guide")}
              href="/guide"
              onClick={close}
              active={isActive("/guide")}
            />
          </GroupedSection>

          {/* ── Sign out (destructive, own card) ───────────────────────── */}
          {authed && (
            <GroupedSection className="px-4 sm:px-4">
              <GroupedRow
                icon={LogOut}
                iconClassName="bg-destructive/10 text-destructive"
                title={t(language, "logout")}
                destructive
                chevron={false}
                onClick={() => { close(); void onLogout(); }}
              />
            </GroupedSection>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
