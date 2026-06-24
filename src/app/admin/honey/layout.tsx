"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  CalendarDays,
  Crown,
  ShoppingBag,
  Target,
  Ticket,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const HONEY_TABS = [
  { href: "/admin/honey", label: "ภาพรวม", icon: Award, exact: true },
  { href: "/admin/honey/ranks", label: "ระดับแรงค์", icon: Crown },
  { href: "/admin/honey/missions", label: "ภารกิจ", icon: Target },
  { href: "/admin/honey/shop", label: "ร้านค้า", icon: ShoppingBag },
  { href: "/admin/honey/achievements", label: "ความสำเร็จ", icon: Trophy },
  { href: "/admin/honey/raffle", label: "สุ่มรางวัล", icon: Ticket },
  { href: "/admin/honey/events", label: "อีเวนต์", icon: CalendarDays },
];

export default function HoneyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-1 rounded-xl border border-[var(--p-hair)] bg-muted/20 p-1.5">
        {HONEY_TABS.map((tab) => {
          const active = isActive(tab.href, tab.exact);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
              )}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
