"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpen,
  Heart,
  LogOut,
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
import { NotificationBell } from "@/components/shared/notification-bell";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { getHoneyLevel } from "@/lib/honey/levels";
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
  onLogout: () => Promise<void>;
}

export function HeaderUserMenu({
  authUser,
  authLoaded,
  userTier,
  userName,
  userAvatar,
  userId,
  honeyPoints,
  honeyLifetime,
  honeyPendingActions,
  unreadMessages,
  pathname,
  onLogout,
}: UserMenuProps) {
  const router = useRouter();
  const language = useUIStore((s) => s.language);

  const tierInfo = TIER_DISPLAY[userTier];
  const TierIcon = tierInfo.icon;
  const canUpgrade = userTier === "FREE" || userTier === "PRO";

  const honeyLevel = getHoneyLevel(honeyLifetime);
  const rankDisplay = RANK_DISPLAY[honeyLevel.label] ?? RANK_DISPLAY.Newbie;
  const expProgress = honeyLevel.nextThreshold
    ? Math.min(100, (honeyLifetime / honeyLevel.nextThreshold) * 100)
    : 100;

  const isMessagesActive = pathname === "/messages" || pathname.startsWith("/messages/");

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/messages"
        aria-label={t(language, "messagesTitle")}
        className={cn(
          "relative flex size-9 items-center justify-center rounded-lg transition-colors",
          isMessagesActive
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        )}
      >
        <MessageCircle className="size-4" />
        {unreadMessages > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-4 text-white">
            {unreadMessages > 99 ? "99+" : unreadMessages}
          </span>
        )}
      </Link>
      <NotificationBell />
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-muted/60 focus:outline-none">
          <Avatar size="sm" className={cn("h-7 w-7 ring-2", rankDisplay.ring)}>
            {userAvatar ? <AvatarImage src={userAvatar} alt="" /> : null}
            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
              {userName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="max-w-[80px] truncate text-xs font-medium leading-tight text-foreground">
              {userName}
            </span>
            <div className="flex items-center gap-1">
              <span className={cn("text-[11px] font-semibold leading-tight", tierInfo.color.replace(/bg-\S+\s?/, ""))}>
                {tierInfo.label}
              </span>
              <span className="text-[11px] leading-tight text-muted-foreground/50">|</span>
              <span className={cn("text-[11px] font-semibold leading-tight", rankDisplay.color)}>
                {honeyLevel.label}
              </span>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-medium text-foreground">{userName}</p>
              <p className="truncate text-xs text-muted-foreground">{authUser.email}</p>

              <div className="mt-2 flex items-center gap-1.5">
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", tierInfo.color)}>
                  <TierIcon className="size-2.5" />
                  {tierInfo.label}
                </span>
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", rankDisplay.bg)}>
                  <Award className="size-2.5" />
                  {honeyLevel.label}
                </span>
              </div>

              <div className="mt-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-muted-foreground">
                    {honeyLevel.nextThreshold ? "EXP" : "Max Rank"}
                  </span>
                  <span className={cn("tabular-nums font-semibold", rankDisplay.color)}>
                    {honeyLevel.nextThreshold
                      ? `${honeyLifetime.toLocaleString()} / ${honeyLevel.nextThreshold.toLocaleString()}`
                      : honeyLifetime.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      honeyLevel.label === "Diamond" ? "bg-cyan-500" :
                      honeyLevel.label === "Gold"    ? "bg-yellow-500" :
                      honeyLevel.label === "Silver"  ? "bg-slate-400" :
                      honeyLevel.label === "Bronze"  ? "bg-amber-500" :
                                                       "bg-muted-foreground"
                    )}
                    style={{ width: `${expProgress}%` }}
                  />
                </div>
                {honeyLevel.nextThreshold && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {(honeyLevel.nextThreshold - honeyLifetime).toLocaleString()} to {
                      honeyLevel.level === 0 ? "Bronze" :
                      honeyLevel.level === 1 ? "Silver" :
                      honeyLevel.level === 2 ? "Gold"   :
                                               "Diamond"
                    }
                  </p>
                )}
              </div>

              <div className="mt-2 flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1.5">
                <span className="text-sm leading-none">🍯</span>
                <span className="text-xs font-medium text-muted-foreground">Honey</span>
                <span className="ml-auto text-xs font-bold tabular-nums text-foreground">
                  {honeyPoints.toLocaleString()}
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
          <DropdownMenuItem variant="destructive" onClick={() => void onLogout()}>
            <LogOut className="size-4" />
            {t(language, "logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
