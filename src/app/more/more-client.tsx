"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import {
  ArrowRightLeft,
  BellRing,
  BookOpen,
  ChevronRight,
  Crown,
  Globe,
  Bookmark,
  LogOut,
  MessageCircle,
  MonitorCog,
  Moon,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  Sun,
  Swords,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import { useTheme } from "next-themes";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GroupedSection, GroupedRow } from "@/components/ui/grouped-list";
import { useHeaderData } from "@/hooks/use-header-data";
import { usePublicConfig } from "@/hooks/use-public-config";
import { useUIStore, type Language, type Currency } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/utils/currency";
import { t } from "@/lib/i18n";
import {
  LANG_OPTIONS,
  CURRENCY_OPTIONS,
  THEME_OPTIONS,
  TIER_DISPLAY,
  type ThemeChoice,
} from "@/components/layout/header-constants";

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


/** GroupedSection at page scope — the page container already provides the
 *  horizontal inset, so the section's own padding is zeroed out. */
const SECTION_INSET = "px-0 sm:px-0";

/**
 * `/more` — the bottom-nav "More" tab as a real destination (iOS HIG: a tab
 * navigates, it never opens an overlay). Replaces the old right-sheet drawer.
 * Same grouped-inset grammar as /settings mobile; reachable by URL on desktop
 * too (renders as a narrow centered column, though desktop users normally get
 * this content from the header menus).
 */
export default function MoreClient() {
  const router = useRouter();
  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const currency = useUIStore((s) => s.currency);
  const setCurrency = useUIStore((s) => s.setCurrency);
  const { theme, setTheme } = useTheme();

  const {
    authUser,
    authLoaded,
    userTier,
    honeyPoints,
    honeyPendingActions,
    unreadMessages,
    userName,
    userAvatar,
    mounted,
    handleLogout,
  } = useHeaderData();
  const { config: publicConfig } = usePublicConfig();
  const themeChoice: ThemeChoice =
    mounted && (theme === "system" || theme === "light" || theme === "dark")
      ? theme
      : "system";
  const themeOptions = THEME_OPTIONS.map((option) => ({
    value: option.value,
    label: t(language, option.labelKey),
  }));
  const ThemeIcon =
    themeChoice === "dark" ? Moon : themeChoice === "light" ? Sun : MonitorCog;

  const doLogout = useCallback(async () => {
    await handleLogout();
    router.push("/login");
    router.refresh();
  }, [handleLogout, router]);

  const tier = TIER_DISPLAY[userTier];
  const authed = authLoaded && !!authUser;

  const marketplaceEnabled = publicConfig.marketplaceEnabled;

  return (
    <div className="mx-auto max-w-2xl md:max-w-4xl">
      {/* No page title here on purpose — the page no longer has a site Header
          above it (see main-chrome.tsx's NO_HEADER_FOOTER_ROUTES), so a bare
          "เพิ่มเติม" heading right at the safe-area top read as redundant
          noise rather than useful identity. `pt-safe` keeps the first card
          clear of the status bar/notch instead. */}
      <div className="pt-safe space-y-6">
        {/* ── User block — its own grouped card, full width on every breakpoint ── */}
        <GroupedSection className={SECTION_INSET}>
          {authed ? (
            <Link
              href="/settings"
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
                className="flex-1 rounded-lg border border-hair py-2.5 text-center text-sm font-medium motion-base hover:bg-muted/70"
              >
                {t(language, "login")}
              </Link>
              <Link
                href="/register"
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

        {/* ── Remaining sections — single column on mobile, 2-up on desktop
            (a deliberate directory layout instead of one long stretched
            column when /more is opened on a wide screen). `gap` instead of
            `space-y` so the same wrapper works for both flex and grid. */}
        <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:items-start md:gap-x-6">
          {/* ── Browse — the destinations with no tab of their own. ชุดการ์ด is
              NOT repeated here (bottom tab + desktop header own it) and ค้นหา
              lives in the phone header, not in this menu (เบส). ── */}
          <GroupedSection className={SECTION_INSET} label={t(language, "browse")}>
            <GroupedRow
              icon={TrendingUp}
              iconClassName="bg-success-soft text-success"
              title={t(language, "trendingShort")}
              href="/opcg/trending"
            />
            <GroupedRow
              icon={ArrowRightLeft}
              iconClassName="bg-warning-soft text-warning"
              title={t(language, "compareCards")}
              href="/opcg/compare"
            />
            <GroupedRow
              icon={Swords}
              iconClassName="bg-primary/12 text-primary"
              title={t(language, "decksAndTools")}
              href="/opcg/decks"
            />
          </GroupedSection>

          {/* ── My Account (signed-in only) ────────────────────────────── */}
          {authed && (
            <GroupedSection className={SECTION_INSET} label={t(language, "myAccount")}>
              {/* พอร์ต / รายการโปรด are tabs in the bottom nav; the alerts lens
                  has no tab of its own, so it needs a row here. */}
              <GroupedRow
                icon={BellRing}
                iconClassName="bg-warning-soft text-warning"
                title={t(language, "managePriceAlerts")}
                href="/watchlist?tab=alerts"
              />
              {marketplaceEnabled && (
                <>
                  <GroupedRow
                    icon={ShoppingBag}
                    iconClassName="bg-info-soft text-info"
                    title={t(language, "myOrders")}
                    href="/orders"
                  />
                  <GroupedRow
                    icon={Bookmark}
                    iconClassName="bg-destructive/10 text-destructive"
                    title={t(language, "savedListings")}
                    href="/saved"
                  />
                  <GroupedRow
                    icon={MessageCircle}
                    iconClassName="bg-success-soft text-success"
                    title={t(language, "messagesTitle")}
                    href="/messages"
                    trailing={<CountBadge count={unreadMessages} />}
                  />
                </>
              )}
              <GroupedRow
                icon={Sparkles}
                iconClassName="bg-primary/12 text-primary"
                title="Honey"
                href="/honey"
                trailing={honeyPendingActions ? <PendingDot /> : undefined}
              />
              {marketplaceEnabled && (
                <GroupedRow
                  icon={Store}
                  iconClassName="bg-warning-soft text-warning"
                  title={t(language, "sellShellSellerCenter")}
                  href="/seller"
                />
              )}
            </GroupedSection>
          )}

          {/* ── Preferences — value rows with inline controls ──────────── */}
          <GroupedSection className={SECTION_INSET} label={t(language, "preferences")}>
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
              icon={ThemeIcon}
              iconClassName="bg-muted text-muted-foreground"
              title={t(language, "themeLabel")}
              chevron={false}
              trailing={
                <Select
                  items={themeOptions}
                  value={themeChoice}
                  onValueChange={(value) => {
                    if (value === "system" || value === "light" || value === "dark") {
                      setTheme(value);
                    }
                  }}
                >
                  <SelectTrigger size="sm" aria-label="Theme" className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {themeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
            />
          </GroupedSection>

          {/* ── Footer links ───────────────────────────────────────────── */}
          <GroupedSection className={SECTION_INSET}>
            {authed && (
              <GroupedRow
                icon={Settings}
                iconClassName="bg-muted text-muted-foreground"
                title={t(language, "settingsTitle")}
                href="/settings"
              />
            )}
            <GroupedRow
              icon={Crown}
              iconClassName="bg-primary/12 text-primary"
              title={t(language, "pricing")}
              href="/pricing"
            />
            <GroupedRow
              icon={BookOpen}
              iconClassName="bg-info-soft text-info"
              title={t(language, "guide")}
              href="/guide"
            />
          </GroupedSection>

          {/* ── Sign out (destructive, own card) — spans both columns on desktop ── */}
          {authed && (
            <GroupedSection className={cn(SECTION_INSET, "md:col-span-2")}>
              <GroupedRow
                icon={LogOut}
                iconClassName="bg-destructive/10 text-destructive"
                title={t(language, "logout")}
                destructive
                chevron={false}
                onClick={() => void doLogout()}
              />
            </GroupedSection>
          )}
        </div>
      </div>
    </div>
  );
}
