"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, LineChart, Menu, Search, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

function isTabActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function TabLink({
  href,
  label,
  icon: Icon,
  badge,
  pathname,
}: {
  href: string;
  label: string;
  icon: typeof LineChart;
  badge?: number;
  pathname: string;
}) {
  const active = isTabActive(pathname, href);
  return (
    <li className="min-w-0 flex-1">
      <Link
        href={href}
        className={cn(
          "flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-all active:scale-95",
          active ? "text-primary" : "text-muted-foreground"
        )}
      >
        <span className="relative">
          <Icon className={cn("size-5", active && "stroke-[2.5]")} aria-hidden />
          {typeof badge === "number" && badge > 0 && (
            <span className="absolute -right-2.5 -top-1.5 flex min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-overlay leading-[14px] text-danger-foreground">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </span>
        <span>{label}</span>
        <span className={cn("h-1 w-1 rounded-full bg-primary transition-opacity", active ? "opacity-100" : "opacity-0")} />
      </Link>
    </li>
  );
}

/**
 * Center action slot — not a route, so it never gets the active/label
 * treatment of a `TabLink`. A raised primary-filled circle that pops above
 * the bar (camera-button pattern) opens the same command-search overlay as
 * the header's search icon.
 */
function SearchButton() {
  const lang = useUIStore((s) => s.language);
  const openSearch = useUIStore((s) => s.setSearchOpen);

  return (
    <li className="flex min-w-0 flex-1 items-center justify-center">
      <button
        type="button"
        onClick={() => openSearch(true)}
        aria-label={t(lang, "search")}
        className="ease-chrome -mt-6 flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background transition-transform active:scale-95"
      >
        <Search className="size-6" aria-hidden />
      </button>
    </li>
  );
}

/**
 * Mobile bottom-nav — 5 FIXED tabs. Tab identity never changes (no feature-flag
 * swapping); flag-gated features (marketplace, messages) live inside ชุดการ์ด /
 * Portfolio / More, not as tabs.
 *
 * Every tab is a real destination (iOS HIG) — "More" navigates to /more like
 * the rest, it no longer opens a drawer. The center slot is the one
 * exception: it's an action (open search), not a page, styled as a raised
 * button so it reads as distinct from the 4 navigating tabs either side.
 */
export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const lang = useUIStore((s) => s.language);
  const unread = useUIStore((s) => s.unreadMessages);

  return (
    <nav
      className={cn(
        "frost hairline-t pb-safe fixed right-0 bottom-0 left-0 z-50 md:hidden",
        className
      )}
      aria-label="Navigation"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        <TabLink href="/" label={t(lang, "home")} icon={LineChart} pathname={pathname} />
        <TabLink href="/sets" label={t(lang, "sets")} icon={LayoutGrid} pathname={pathname} />
        <SearchButton />
        <TabLink href="/portfolio" label={t(lang, "portfolioNav")} icon={Wallet} pathname={pathname} />
        <TabLink href="/more" label={t(lang, "more")} icon={Menu} badge={unread} pathname={pathname} />
      </ul>
    </nav>
  );
}
