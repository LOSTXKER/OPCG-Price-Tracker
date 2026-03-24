"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Home, Search, ShoppingBag, User } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "หน้าแรก", icon: Home },
  { href: "/cards", label: "ค้นหา", icon: Search },
  { href: "/portfolio", label: "พอร์ต", icon: Briefcase },
  { href: "/marketplace", label: "ซื้อขาย", icon: ShoppingBag },
  { href: "/profile", label: "บัญชี", icon: User },
] as const;

function isTabActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname() ?? "/";

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
                  "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("size-5", active && "stroke-[2.5]")} aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
