"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  LayoutGrid,
  Package,
  Search,
  ShoppingBag,
  TrendingUp,
  User,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { CurrencyToggle } from "@/components/shared/currency-toggle";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "ตลาด", icon: TrendingUp },
  { href: "/sets", label: "ชุดการ์ด", icon: Package },
  { href: "/cards", label: "การ์ดเดี่ยว", icon: LayoutGrid },
  { href: "/marketplace", label: "ซื้อขาย", icon: ShoppingBag },
  { href: "/guide", label: "คู่มือ", icon: BookOpen },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/cards?search=${encodeURIComponent(q)}`);
    setQuery("");
  };

  return (
    <header className="sticky top-0 z-50 hidden border-b border-border/60 bg-background/80 backdrop-blur-xl md:block">
      <div className="mx-auto flex h-11 max-w-6xl items-center gap-6 px-4 md:px-6">
        <Link href="/" className="shrink-0">
          <Logo size="sm" />
        </Link>

        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 text-[13px] font-medium transition-colors rounded-md",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <form onSubmit={handleSearch} className="relative ml-auto max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="ค้นหาการ์ด..."
            className="h-8 w-full rounded-lg border-0 bg-muted/60 pl-8 pr-3 text-[13px] outline-none transition-colors placeholder:text-muted-foreground/60 focus:bg-muted focus:ring-1 focus:ring-border"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search"
          />
        </form>

        <div className="flex items-center">
          <LanguageToggle />
          <CurrencyToggle />
          <ThemeToggle />
          <Link
            href="/login"
            className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <User className="size-3.5" />
            <span className="hidden lg:inline">เข้าสู่ระบบ</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
