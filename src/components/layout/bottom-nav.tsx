"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Search, ShoppingBag, Menu, X } from "lucide-react";

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
  icon: typeof Home;
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
            <span className="absolute -right-2.5 -top-1.5 flex min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-[14px] text-white">
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

export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const lang = useUIStore((s) => s.language);
  const menuOpen = useUIStore((s) => s.mobileMenuOpen);
  const toggleMenu = useUIStore((s) => s.toggleMobileMenu);
  const unread = useUIStore((s) => s.unreadMessages);

  return (
    <nav
      className={cn(
        "fixed right-0 bottom-0 left-0 z-50 border-t border-border/40 bg-background/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden",
        className
      )}
      aria-label="Navigation"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        <TabLink href="/" label={t(lang, "home")} icon={Home} pathname={pathname} />
        <TabLink href="/marketplace" label={t(lang, "marketplace")} icon={ShoppingBag} pathname={pathname} />

        {/* Search — triggers CommandSearch modal */}
        <li className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => useUIStore.getState().setSearchOpen(true)}
            className="flex w-full flex-col items-center gap-0.5 py-2 text-xs font-medium text-muted-foreground transition-all active:scale-95"
            aria-label="Search"
          >
            <Search className="size-5" aria-hidden />
            <span>{lang === "TH" ? "ค้นหา" : lang === "JP" ? "検索" : "Search"}</span>
            <span className="h-1 w-1 rounded-full bg-primary opacity-0" />
          </button>
        </li>

        <TabLink href="/messages" label={t(lang, "messagesTitle")} icon={MessageCircle} badge={unread} pathname={pathname} />

        {/* Menu (opens sheet drawer) */}
        <li className="min-w-0 flex-1">
          <button
            type="button"
            onClick={toggleMenu}
            className={cn(
              "flex w-full flex-col items-center gap-0.5 py-2 text-xs font-medium transition-all active:scale-95",
              menuOpen ? "text-primary" : "text-muted-foreground"
            )}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X className="size-5 stroke-[2.5]" aria-hidden />
            ) : (
              <Menu className="size-5" aria-hidden />
            )}
            <span>{lang === "TH" ? "เมนู" : lang === "JP" ? "メニュー" : "Menu"}</span>
            <span className={cn("h-1 w-1 rounded-full bg-primary transition-opacity", menuOpen ? "opacity-100" : "opacity-0")} />
          </button>
        </li>
      </ul>
    </nav>
  );
}
