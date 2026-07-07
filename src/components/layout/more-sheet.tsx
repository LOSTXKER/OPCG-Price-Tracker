"use client";

import Link from "next/link";
import {
  ArrowRightLeft,
  BellRing,
  BookOpen,
  ChevronRight,
  Crown,
  Menu,
  Settings,
  Sparkles,
  Swords,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useHeaderData } from "@/hooks/use-header-data";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Tile = {
  icon: LucideIcon;
  label: string;
  href: string;
  iconClassName: string;
  dot?: boolean;
};

/** Pulsing dot for a tile that has a pending action (honey). */
function PendingDot() {
  return (
    <span className="absolute -right-0.5 -top-0.5 flex size-2.5">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger opacity-75" />
      <span className="relative inline-flex size-2.5 rounded-full bg-danger" />
    </span>
  );
}

/**
 * The tiles + full-menu link. Kept as a separate component so its `useHeaderData`
 * (auth + honey fetch) only runs while the sheet is actually open — base-ui's
 * Dialog unmounts its portal children when closed, so this never mounts until
 * the user taps "More".
 */
function MoreSheetBody({ onNavigate }: { onNavigate: () => void }) {
  const lang = useUIStore((s) => s.language);
  const { authUser, authLoaded, honeyPendingActions } = useHeaderData();
  const authed = !!authUser;

  // Curated quick-jump set — the important destinations that otherwise felt
  // buried one full page deep under /more. Everything else still lives on the
  // full menu, reachable from the row below.
  const tiles: Tile[] = authed
    ? [
        { icon: Sparkles, label: "Honey", href: "/honey", iconClassName: "bg-primary/12 text-primary", dot: honeyPendingActions },
        { icon: Swords, label: t(lang, "decksAndTools"), href: "/decks", iconClassName: "bg-primary/12 text-primary" },
        { icon: BellRing, label: t(lang, "managePriceAlerts"), href: "/watchlist?tab=alerts", iconClassName: "bg-warning-soft text-warning" },
        { icon: TrendingUp, label: t(lang, "trendingShort"), href: "/trending", iconClassName: "bg-success-soft text-success" },
        { icon: BookOpen, label: t(lang, "guide"), href: "/guide", iconClassName: "bg-info-soft text-info" },
        { icon: Settings, label: t(lang, "settingsTitle"), href: "/settings", iconClassName: "bg-muted text-muted-foreground" },
      ]
    : [
        { icon: Swords, label: t(lang, "decksAndTools"), href: "/decks", iconClassName: "bg-primary/12 text-primary" },
        { icon: TrendingUp, label: t(lang, "trendingShort"), href: "/trending", iconClassName: "bg-success-soft text-success" },
        { icon: ArrowRightLeft, label: t(lang, "compareCards"), href: "/compare", iconClassName: "bg-warning-soft text-warning" },
        { icon: BookOpen, label: t(lang, "guide"), href: "/guide", iconClassName: "bg-info-soft text-info" },
        { icon: Crown, label: t(lang, "pricing"), href: "/pricing", iconClassName: "bg-primary/12 text-primary" },
      ];

  return (
    <>
      <SheetHeader className="pb-0 pt-2 text-center">
        <SheetTitle className="text-h5">{t(lang, "quickLinks")}</SheetTitle>
      </SheetHeader>

      <div className="grid grid-cols-3 gap-2.5 px-4">
        {/* Auth resolves a tick after each open (base-ui remounts this body
            fresh every time). Show neutral skeletons until authLoaded so a
            signed-in user never sees the guest/upsell tiles flash before their
            real set lands. */}
        {!authLoaded
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 rounded-xl border border-hair bg-card p-3"
                aria-hidden
              >
                <span className="size-11 animate-pulse rounded-full bg-muted" />
                <span className="h-3 w-14 animate-pulse rounded bg-muted" />
              </div>
            ))
          : tiles.map((tile) => (
              <Link
                key={tile.href}
                href={tile.href}
                onClick={onNavigate}
                className="flex flex-col items-center gap-2 rounded-xl border border-hair bg-card p-3 text-center motion-base active:scale-95 active:bg-muted/50"
              >
                <span className={cn("relative flex size-11 items-center justify-center rounded-full", tile.iconClassName)}>
                  <tile.icon className="size-5" aria-hidden />
                  {tile.dot && (
                    <>
                      <PendingDot />
                      <span className="sr-only">{t(lang, "claimReward")}</span>
                    </>
                  )}
                </span>
                <span className="text-xs font-medium leading-tight">{tile.label}</span>
              </Link>
            ))}
      </div>

      <div className="px-4">
        <Link
          href="/more"
          onClick={onNavigate}
          className="flex items-center justify-between rounded-xl border border-hair bg-card px-4 py-3 motion-base active:bg-muted/50"
        >
          <span className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Menu className="size-4" aria-hidden />
            </span>
            <span className="text-body-sm font-medium">{t(lang, "viewAllMenu")}</span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground/50" aria-hidden />
        </Link>
      </div>
    </>
  );
}

/**
 * Bottom-sheet quick-launcher for the mobile "More" tab. Tapping the tab opens
 * this over the current page (context stays underneath) with a curated grid of
 * important shortcuts + a link to the full /more menu — instead of navigating a
 * full page deep just to reach a frequently-used destination.
 */
export function MoreSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="gap-3 rounded-t-2xl pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        {/* grabber */}
        <div className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-muted-foreground/25" />
        <MoreSheetBody onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
