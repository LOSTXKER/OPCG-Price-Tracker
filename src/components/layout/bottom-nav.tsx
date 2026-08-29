"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, LayoutGrid, LineChart, Menu, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { isNavActive } from "@/lib/game/constants";
import { useUIStore } from "@/stores/ui-store";

// The 4 real-destination tabs, TWO EACH SIDE of the raised search button (owner
// selection 2026-08-29 from /proto/mobile-home): an odd tab count is what lets
// the button sit dead centre under the thumb. รายการโปรด gave up its slot and
// moved to the phone header as a heart icon — same one-tap reach from every
// route, and it lands in the slot the search icon vacated.
//
// "More" is appended separately: it navigates to /more like the rest, but it
// also lights up on any deep route none of these own (settings/honey/decks/
// messages/watchlist…), so the user never loses their sense of place (iOS tab
// grammar). `owns` lists tab-less catalog routes that keep ชุดการ์ด lit while
// browsing.
const TABS = [
  { href: "/", key: "home", icon: LineChart, owns: [] as readonly string[] },
  { href: "/opcg/sets", key: "sets", icon: LayoutGrid, owns: ["/cards", "/search", "/trending", "/market-overview"] as readonly string[] },
  { href: "/portfolio", key: "portfolioNav", icon: Briefcase, owns: [] as readonly string[] },
] as const;

function TabInner({
  icon: Icon,
  label,
  badge,
  active,
}: {
  icon: typeof LineChart;
  label: string;
  badge?: number;
  active: boolean;
}) {
  return (
    <>
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
    </>
  );
}

const TAB_CLASS =
  "flex w-full flex-col items-center gap-0.5 py-2 text-xs font-medium transition-all active:scale-95";

function TabLink({
  href,
  label,
  icon,
  badge,
  active,
}: {
  href: string;
  label: string;
  icon: typeof LineChart;
  badge?: number;
  active: boolean;
}) {
  return (
    <li className="min-w-0 flex-1">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(TAB_CLASS, active ? "text-primary" : "text-muted-foreground")}
      >
        <TabInner icon={icon} label={label} badge={badge} active={active} />
      </Link>
    </li>
  );
}

/**
 * The one loud element on the phone: search as a raised round button in the
 * middle of the tab bar. It is a BUTTON, not a tab — it opens the global
 * search modal in place instead of navigating, so it never claims an "active"
 * state and never takes the user off the page they are reading.
 */
function SearchTab({ label, onOpen }: { label: string; onOpen: () => void }) {
  return (
    <li className="min-w-0 flex-1">
      <button
        type="button"
        onClick={onOpen}
        aria-label={label}
        aria-haspopup="dialog"
        className={cn(TAB_CLASS, "relative text-muted-foreground")}
      >
        {/* -mt-7 lifts the disc above the hairline; ring-4 in the page
            background cuts it cleanly out of the bar instead of overlapping it.

            The halo behind it (owner selection 2026-08-29, from
            /proto/search-ai) is how this button says "there is something
            smarter than a text match behind me" — search here also runs an AI
            photo lookup — WITHOUT swapping the magnifier for a cleverer glyph.
            The icon is the one thing on this bar nobody should have to decode,
            so the meaning stays and the treatment carries the message. */}
        <span aria-hidden className="pointer-events-none absolute -top-7 size-14 rounded-full bg-gradient-to-br from-primary/60 to-primary/0 blur-md" />
        <span className="ease-chrome relative flex size-14 -mt-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg ring-4 ring-background active:brightness-95">
          <Search className="size-6" strokeWidth={2.25} aria-hidden />
        </span>
        <span>{label}</span>
        {/* Keeps the label baseline aligned with the neighbouring tabs, which
            reserve this row for their active dot. */}
        <span aria-hidden className="h-1 w-1" />
      </button>
    </li>
  );
}

/**
 * Mobile bottom-nav — 4 FIXED tabs around ONE raised search button (owner
 * selection 2026-08-29). Tab identity never changes (no feature-flag
 * swapping); flag-gated features (marketplace, messages) live inside ชุดการ์ด /
 * Portfolio / More, not as tabs.
 *
 * Every tab navigates, "More" included (เบส): it goes straight to /more, whose
 * first block is the quick-launcher grid the bottom sheet used to hold. One menu,
 * one source of truth — the sheet + page pair had already drifted apart.
 */
export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const lang = useUIStore((s) => s.language);
  const unread = useUIStore((s) => s.unreadMessages);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);

  const tabActive = TABS.map((tab) => isNavActive(pathname, tab.href, tab.owns));
  // "More" owns everything the tabs don't — /more itself plus every deep route
  // none of them claim (watchlist included, where it lives in the TRACK group),
  // so it is lit whenever no other tab is.
  const moreActive = !tabActive.some(Boolean);

  return (
    <nav
      className={cn(
        "hairline-t pb-safe fixed right-0 bottom-0 left-0 z-chrome bg-background md:hidden",
        className
      )}
      aria-label="Navigation"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {TABS.slice(0, 2).map((tab, i) => (
          <TabLink
            key={tab.href}
            href={tab.href}
            label={t(lang, tab.key)}
            icon={tab.icon}
            active={tabActive[i]}
          />
        ))}

        <SearchTab
          label={t(lang, "search")}
          onOpen={() => setSearchOpen(true)}
        />

        {TABS.slice(2).map((tab, i) => (
          <TabLink
            key={tab.href}
            href={tab.href}
            label={t(lang, tab.key)}
            icon={tab.icon}
            active={tabActive[i + 2]}
          />
        ))}
        <TabLink
          href="/more"
          label={t(lang, "more")}
          icon={Menu}
          badge={unread}
          active={moreActive}
        />
      </ul>
    </nav>
  );
}
