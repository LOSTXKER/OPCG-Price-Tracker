"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Briefcase,
  Calculator,
  Package,
  Search,
  ShoppingBag,
  Star,
  User,
} from "lucide-react";

import { CurrencyToggle } from "@/components/shared/currency-toggle";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "ตลาด" },
  { href: "/sets", label: "ชุดการ์ด" },
  { href: "/portfolio", label: "พอร์ตโฟลิโอ" },
  { href: "/pull-calculator", label: "คำนวณดรอป" },
  { href: "/marketplace", label: "ซื้อขาย" },
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
    router.push(`/?search=${encodeURIComponent(q)}`);
    setQuery("");
  };

  return (
    <header className="sticky top-0 z-50 hidden border-b border-border/60 bg-background/80 backdrop-blur-xl md:block">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex h-14 items-center gap-8">
          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center gap-2">
            <Image
              src="/meecard.png"
              alt="Meecard"
              width={28}
              height={28}
              className="shrink-0 select-none"
              priority
            />
            <span className="text-base font-bold tracking-tight text-foreground">
              Meecard
            </span>
          </Link>

          {/* Divider */}
          <div className="h-5 w-px bg-border/60" />

          {/* Nav */}
          <nav className="flex items-center gap-0.5">
            {navLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-muted/60 text-foreground"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <form onSubmit={handleSearch} className="relative w-52 lg:w-60">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="search"
              placeholder="ค้นหาการ์ด..."
              className="h-8 w-full rounded-lg border border-border/50 bg-muted/40 pl-8 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/40 focus:bg-muted/60 focus:ring-1 focus:ring-primary/20"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search"
            />
          </form>

          {/* Utils */}
          <div className="flex items-center gap-0.5">
            <LanguageToggle />
            <CurrencyToggle />
            <ThemeToggle />

            <div className="mx-1 h-4 w-px bg-border/40" />

            <Link
              href="/watchlist"
              className={cn(
                "flex size-8 items-center justify-center rounded-md transition-colors hover:bg-muted/60",
                isActive(pathname, "/watchlist")
                  ? "text-amber-400"
                  : "text-muted-foreground hover:text-amber-400"
              )}
              aria-label="Watchlist"
            >
              <Star className={cn("size-4", isActive(pathname, "/watchlist") && "fill-current")} />
            </Link>

            <Link
              href="/login"
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              aria-label="Login"
            >
              <User className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
