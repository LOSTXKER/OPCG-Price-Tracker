"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  House,
  Search,
  Store,
  User,
} from "lucide-react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", icon: House },
  { href: "/cards", label: "Search", icon: Search },
  { href: "/marketplace", label: "Market", icon: Store },
  { href: "/portfolio", label: "Portfolio", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
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
        "fixed right-0 bottom-0 left-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden",
        className
      )}
      aria-label="หลัก"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between gap-0 px-1 pt-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isTabActive(pathname, href);
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-lg py-2 text-[0.65rem] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-pill"
                    className="absolute inset-x-1 top-0 bottom-0 -z-10 rounded-lg bg-primary/10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <motion.span
                  animate={{ scale: active ? 1.06 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                >
                  <Icon className="size-5" aria-hidden />
                </motion.span>
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
