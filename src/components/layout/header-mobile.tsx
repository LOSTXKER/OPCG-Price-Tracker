"use client";

import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { NotificationBell } from "@/components/shared/notification-bell";
import { Button } from "@/components/ui/button";
import { GameSwitcher } from "@/components/layout/game-switcher";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function HeaderMobile({ isAuthenticated }: { isAuthenticated: boolean }) {
  const language = useUIStore((s) => s.language);
  const openSearch = useUIStore((s) => s.setSearchOpen);

  // Transparent at the top (the page's ambient glow flows through uninterrupted),
  // frosted + hairline once scrolled — same collapsing pattern as the desktop
  // header (header.tsx) and the /proto/ios showcase's nav bar. Lazy initializer
  // reads the real scroll position on first render without an effect-body
  // setState call.
  const [scrolled, setScrolled] = useState(() => typeof window !== "undefined" && window.scrollY > 8);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "ease-chrome sticky top-0 z-50 transition-colors md:hidden",
        scrolled ? "frost hairline-b" : "bg-transparent",
      )}
    >
      <div className="flex h-14 items-center gap-1 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/meecard.png"
            alt="Meecard"
            width={32}
            height={29}
            className="h-auto shrink-0 select-none"
            style={{ width: 26, height: "auto" }}
            priority
          />
          <span className="text-base font-bold tracking-tight">Meecard</span>
        </Link>

        <GameSwitcher className="ml-1.5" />

        <div className="flex-1" />

        {isAuthenticated && <NotificationBell />}

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t(language, "searchPlaceholder")}
          onClick={() => openSearch(true)}
          className="text-muted-foreground"
        >
          <Search className="size-[18px]" />
        </Button>
      </div>
    </div>
  );
}
