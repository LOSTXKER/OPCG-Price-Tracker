"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, ShoppingBag, Star, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

function isTabActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const lang = useUIStore((s) => s.language);

  const tabs = [
    { href: "/", label: t(lang, "home"), icon: Home },
    { href: "/sets", label: t(lang, "sets"), icon: Package },
    { href: "/marketplace", label: t(lang, "marketplace"), icon: ShoppingBag },
    { href: "/portfolio", label: t(lang, "portfolioNav"), icon: Star },
    { href: "/profile", label: t(lang, "account"), icon: User },
  ] as const;

  return (
    <nav
      className={cn(
        "fixed right-0 bottom-0 left-0 z-50 border-t border-border/40 bg-background/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden",
        className
      )}
      aria-label="Navigation"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isTabActive(pathname, href);
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-all active:scale-95",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("size-5", active && "stroke-[2.5]")} aria-hidden />
                <span>{label}</span>
                <span
                  className={cn(
                    "h-1 w-1 rounded-full bg-primary transition-opacity",
                    active ? "opacity-100" : "opacity-0"
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
