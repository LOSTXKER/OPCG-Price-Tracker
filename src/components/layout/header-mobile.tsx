"use client";

import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";

import { NotificationBell } from "@/components/layout/notification-bell";
import { Button } from "@/components/ui/button";
import { GameSwitcher } from "@/components/layout/game-switcher";
import { useScrolled } from "@/hooks/use-scrolled";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function HeaderMobile({ isAuthenticated }: { isAuthenticated: boolean }) {
  const language = useUIStore((s) => s.language);
  const openSearch = useUIStore((s) => s.setSearchOpen);

  // Transparent at the top (the page's ambient glow flows through uninterrupted),
  // frosted + hairline once scrolled — same collapsing pattern as the desktop
  // header (header.tsx) and the /proto/ios showcase's nav bar.
  //
  // Same collapsing chrome as the desktop header — starts false (hydration- and
  // scroll-restoration-safe), corrects on mount. CHROME-11: one shared hook.
  const scrolled = useScrolled();

  return (
    <div
      className={cn(
        "ease-chrome sticky top-0 z-50 transition-colors md:hidden",
        scrolled ? "hairline-b bg-background" : "bg-transparent",
      )}
    >
      <div className="flex h-14 items-center gap-0.5 px-4">
        <Link href="/" className="flex min-h-11 shrink-0 items-center gap-2">
          <Image
            src="/meecard.png"
            alt="Meecard"
            width={754}
            height={694}
            className="h-auto shrink-0 select-none"
            style={{ width: 26, height: "auto" }}
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
