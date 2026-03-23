"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, Search } from "lucide-react";
import { motion } from "motion/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { CurrencyToggle } from "@/components/shared/currency-toggle";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";

export type HeaderUser = {
  name: string;
  imageUrl?: string | null;
};

export function Header({
  user = null,
  className,
}: {
  user?: HeaderUser | null;
  className?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const initials = user?.name
    ? user.name
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/cards?search=${encodeURIComponent(q)}`);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 hidden border-b border-border bg-background md:block",
        className
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 lg:px-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Link
            href="/"
            className="shrink-0 text-sm font-semibold tracking-tight text-foreground transition-colors hover:text-primary lg:text-base"
          >
            TCG Price Tracker
          </Link>
        </motion.div>

        <form onSubmit={handleSearch} className="mx-auto min-w-0 max-w-xl flex-1">
          <InputGroup className="border-border bg-card/80 shadow-sm">
            <InputGroupAddon align="inline-start" className="pl-2.5">
              <Search className="size-4 text-muted-foreground" aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              placeholder="ค้นหาการ์ด..."
              className="h-9 text-sm"
              aria-label="ค้นหาการ์ด"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <CurrencyToggle />
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-foreground"
            aria-label="การแจ้งเตือน"
          >
            <Bell className="size-4" />
          </Button>
          {user ? (
            <Link
              href="/profile"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "rounded-full text-foreground"
              )}
              aria-label={user.name}
            >
              <Avatar size="sm">
                {user.imageUrl ? (
                  <AvatarImage src={user.imageUrl} alt="" />
                ) : null}
                <AvatarFallback className="bg-surface-elevated text-xs text-foreground">
                  {initials || "?"}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            >
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
