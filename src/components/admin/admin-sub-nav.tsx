"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface AdminSubNavItem {
  href: string;
  label: string;
  icon?: LucideIcon;
  /** When true, the tab is active only on exact pathname match. */
  exact?: boolean;
  /** Optional badge/count rendered after the label (e.g. counts, "NEW"). */
  badge?: React.ReactNode;
}

interface AdminSubNavProps {
  items: AdminSubNavItem[];
  className?: string;
  /** Visual density. `pill` = rounded background tabs (default), `underline` = underlined row. */
  variant?: "pill" | "underline";
}

/**
 * Reusable secondary tab nav used under `AdminPageHeader`. Sourced from the
 * old `honey/layout.tsx` pattern but works for any sub-section (cards detail
 * tabs, missions tabs, future seller subnav…).
 */
export function AdminSubNav({
  items,
  className,
  variant = "pill",
}: AdminSubNavProps) {
  const pathname = usePathname() ?? "";

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (variant === "underline") {
    return (
      <nav
        className={cn(
          "flex flex-wrap gap-1 border-b border-[var(--p-hair)]",
          className,
        )}
        aria-label="Section navigation"
      >
        {items.map((tab) => {
          const active = isActive(tab.href, tab.exact);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.icon && <tab.icon className="size-4" />}
              <span>{tab.label}</span>
              {tab.badge}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      className={cn(
        "flex flex-wrap gap-1 rounded-xl border border-[var(--p-hair)] bg-muted/20 p-1.5",
        className,
      )}
      aria-label="Section navigation"
    >
      {items.map((tab) => {
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
            {tab.icon && <tab.icon className="size-4" />}
            <span>{tab.label}</span>
            {tab.badge}
          </Link>
        );
      })}
    </nav>
  );
}
