"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, Home, Package, ShoppingBag, User } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "หน้าแรก", icon: Home },
  { href: "/sets", label: "ชุดการ์ด", icon: Package },
  { href: "/pull-calculator", label: "คำนวณ", icon: Calculator },
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
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-all active:scale-95",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("size-5", active && "stroke-[2.5]")} aria-hidden />
                <span>{label}</span>
                <span
                  className={cn(
                    "h-1 w-1 rounded-full bg-foreground transition-opacity",
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
