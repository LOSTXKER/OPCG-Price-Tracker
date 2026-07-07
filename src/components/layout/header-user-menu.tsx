"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BellRing,
  BookOpen,
  Heart,
  Info,
  LogOut,
  Mail,
  MessageCircle,
  Settings,
  ShoppingBag,
  Store,
  User,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/utils/currency";
import { t } from "@/lib/i18n";
import {
  findTierByLevel,
  getHoneyLevelFromTiers,
  getTierLabel,
} from "@/lib/honey/rank-tiers";
import { RankTierIcon } from "@/components/shared/rank-icon";
import { useRankTiers } from "@/hooks/use-rank-tiers";
import { TIER_DISPLAY, RANK_DISPLAY, type UserTierValue, type AuthUser } from "./header-constants";

interface UserMenuProps {
  authUser: AuthUser;
  authLoaded: boolean;
  userTier: UserTierValue;
  userName: string;
  userAvatar: string | null;
  userId: string | null;
  honeyPoints: number;
  honeyLifetime: number;
  honeyPendingActions: boolean;
  unreadMessages: number;
  pathname: string;
  marketplaceEnabled: boolean;
  onLogout: () => Promise<void>;
}

export function HeaderUserMenu({
  authUser,
  userTier,
  userName,
  userAvatar,
  userId,
  honeyPoints,
  honeyLifetime,
  unreadMessages,
  pathname,
  marketplaceEnabled,
  onLogout,
}: UserMenuProps) {
  const router = useRouter();
  const language = useUIStore((s) => s.language);

  const tierInfo = TIER_DISPLAY[userTier];
  const TierIcon = tierInfo.icon;
  /** Inline meta row: tier chips use `bg-*` — strip for text-only styling in the navbar trigger. */
  const tierTextClass = tierInfo.color.replace(/\bbg-[^\s]+/g, "").replace(/\s+/g, " ").trim();
  const canUpgrade = userTier === "FREE" || userTier === "PRO";

  const { tiers } = useRankTiers();
  const honeyLevel = getHoneyLevelFromTiers(honeyLifetime, tiers);
  const currentTier = findTierByLevel(tiers, honeyLevel.level);
  const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold);
  const currentIdx = sorted.findIndex((t) => t.level === currentTier.level);
  const nextTier = currentIdx >= 0 ? sorted[currentIdx + 1] : undefined;
  const rankLabel = getTierLabel(currentTier, language);
  const nextRankLabel = nextTier ? getTierLabel(nextTier, language) : null;
  const accent = currentTier.color ?? null;
  const rankImage = currentTier.imageUrl ?? null;
  const rankDisplayFallback = RANK_DISPLAY[currentTier.labels.EN] ?? RANK_DISPLAY.Newbie;
  const expProgress = honeyLevel.nextThreshold
    ? Math.min(100, (honeyLifetime / honeyLevel.nextThreshold) * 100)
    : 100;

  const isMessagesActive = pathname === "/messages" || pathname.startsWith("/messages/");

  return (
    <div className="flex items-center gap-1.5">
      {marketplaceEnabled && (
        <Link
          href="/messages"
          aria-label={t(language, "messagesTitle")}
          className={cn(
            "relative flex size-9 items-center justify-center rounded-lg motion-base",
            isMessagesActive
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
          )}
        >
          <MessageCircle className="size-4" />
          {unreadMessages > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-micro leading-4 text-white">
              {unreadMessages > 99 ? "99+" : unreadMessages}
            </span>
          )}
        </Link>
      )}
      <NotificationBell />
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex max-w-[12rem] items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3.5 motion-base",
            "hover:bg-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
          )}
        >
          <Avatar
            size="sm"
            className={cn("h-7 w-7 shrink-0 ring-2", !accent && rankDisplayFallback.ring)}
            style={accent ? { boxShadow: `0 0 0 2px ${accent}` } : undefined}
          >
            {userAvatar ? <AvatarImage src={userAvatar} alt="" /> : null}
            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
              {userName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col items-start gap-0.5 text-left">
            <span className="max-w-[7.5rem] truncate text-sm font-medium leading-tight text-foreground">
              {userName}
            </span>
            <div className="flex max-w-[7.5rem] flex-wrap items-center gap-x-1 gap-y-0.5 text-meta leading-tight">
              <span className={tierTextClass}>{tierInfo.label}</span>
              <span className="select-none text-muted-foreground/40" aria-hidden>
                ·
              </span>
              <span
                className={!accent ? rankDisplayFallback.color : undefined}
                style={accent ? { color: accent } : undefined}
              >
                {rankLabel}
              </span>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-medium text-foreground">{userName}</p>
              <p className="truncate text-meta">{authUser.email}</p>

              <div className="mt-2 flex items-center gap-1.5">
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-micro", tierInfo.color)}>
                  <TierIcon className="size-2.5" />
                  {tierInfo.label}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-micro",
                    !accent && rankDisplayFallback.bg,
                  )}
                  style={
                    accent
                      ? { backgroundColor: `${accent}26`, color: accent }
                      : undefined
                  }
                >
                  {rankImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={rankImage} alt="" className="size-2.5 rounded-sm object-contain" />
                  ) : (
                    <RankTierIcon name={currentTier.iconName} className="size-2.5" />
                  )}
                  {rankLabel}
                </span>
              </div>

              <div className="mt-2.5">
                <div className="flex items-center justify-between text-micro">
                  <span className="font-medium text-muted-foreground">
                    {honeyLevel.nextThreshold ? "EXP" : "Max Rank"}
                  </span>
                  <span
                    className={cn(
                      "tabular-nums font-semibold",
                      !accent && rankDisplayFallback.color,
                    )}
                    style={accent ? { color: accent } : undefined}
                  >
                    {honeyLevel.nextThreshold
                      ? `${formatCount(honeyLifetime)} / ${formatCount(honeyLevel.nextThreshold)}`
                      : formatCount(honeyLifetime)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary motion-base"
                    style={{
                      width: `${expProgress}%`,
                      backgroundColor: accent ?? undefined,
                    }}
                  />
                </div>
                {honeyLevel.nextThreshold && nextRankLabel && (
                  <p className="mt-0.5 text-meta">
                    {formatCount(honeyLevel.nextThreshold - honeyLifetime)} to {nextRankLabel}
                  </p>
                )}
              </div>

              <div className="mt-2 flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1.5">
                <span className="text-sm leading-none">🍯</span>
                <span className="text-meta">Honey</span>
                <span className="ml-auto text-xs font-bold tabular-nums text-foreground">
                  {formatCount(honeyPoints)}
                </span>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push(userId ? `/profile/${userId}` : "/profile")}>
            <User className="size-4" />
            {t(language, "profileLabel")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <Settings className="size-4" />
            {t(language, "settingsTitle")}
          </DropdownMenuItem>
          {marketplaceEnabled && (
            <>
              <DropdownMenuItem onClick={() => router.push("/seller")}>
                <Store className="size-4" />
                {t(language, "sellShellSellerCenter")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/orders")}>
                <ShoppingBag className="size-4" />
                {t(language, "myOrders")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/saved")}>
                <Heart className="size-4" />
                {t(language, "savedListings")}
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem onClick={() => router.push("/watchlist?tab=alerts")}>
            <BellRing className="size-4" />
            {t(language, "managePriceAlerts")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/guide")}>
            <BookOpen className="size-4" />
            {t(language, "guide")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/about")}>
            <Info className="size-4" />
            {t(language, "aboutUs")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/contact")}>
            <Mail className="size-4" />
            {t(language, "contactUs")}
          </DropdownMenuItem>
          {canUpgrade && (
            <DropdownMenuItem onClick={() => router.push("/pricing")} className="text-primary">
              <Zap className="size-4" />
              {t(language, "upgradePlan")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => void onLogout()}>
            <LogOut className="size-4" />
            {t(language, "logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
