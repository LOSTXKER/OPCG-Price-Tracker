"use client";

import Link from "next/link";
import {
  ArrowRightLeft,
  BellRing,
  BookOpen,
  ChevronRight,
  Menu,
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
  const { authUser, honeyPendingActions } = useHeaderData();
  const authed = !!authUser;

  // Curated quick-jump set — the important destinations that otherwise felt
  // buried one full page deep under /more; everything else stays on the full
  // menu, reachable from the row below.
  // ONE fixed set for guests and members alike. The two sets used to share only
  // 3 of 6 slots, so the launcher rearranged itself the moment you signed in and
  // no muscle memory could form. Browse-first, then the two personal features
  // (a guest tapping those lands on /login, which is the honest upsell).
  // Labels use the SHORT i18n keys — "จัดการแจ้งเตือนราคา" / "เด็คและเครื่องมือ"
  // could not fit a 112px tile and made the rows uneven.
  // Search is NOT here: the phone header carries it on every route except home,
  // where the hero owns it. It stays a row on /more for completeness.
  const tiles: Tile[] = [
    { icon: TrendingUp, label: t(lang, "trendingShort"), href: "/opcg/trending", iconClassName: "bg-success-soft text-success" },
    { icon: Swords, label: t(lang, "decks"), href: "/opcg/decks", iconClassName: "bg-primary/12 text-primary" },
    { icon: ArrowRightLeft, label: t(lang, "compareCards"), href: "/opcg/compare", iconClassName: "bg-warning-soft text-warning" },
    { icon: BookOpen, label: t(lang, "guide"), href: "/guide", iconClassName: "bg-info-soft text-info" },
    { icon: Sparkles, label: "Honey", href: "/honey", iconClassName: "bg-primary/12 text-primary", dot: authed && honeyPendingActions },
    { icon: BellRing, label: t(lang, "priceAlerts"), href: "/watchlist?tab=alerts", iconClassName: "bg-warning-soft text-warning" },
  ];

  return (
    <>
      <SheetHeader className="pb-0 pt-2 text-center">
        <SheetTitle className="text-h5">{t(lang, "quickLinks")}</SheetTitle>
      </SheetHeader>

      {/* No auth skeleton any more: the grid is identical signed in or out, so it
          can paint immediately (only the honey dot waits for data). */}
      <div className="grid grid-cols-3 gap-2.5 px-4">
        {tiles.map((tile) => (
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
        {/* grabber — decoration only (base-ui's Dialog has no swipe gesture), so
            it stays out of the a11y tree instead of promising a drag. */}
        <div
          aria-hidden
          className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-muted-foreground/25"
        />
        <MoreSheetBody onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
