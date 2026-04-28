"use client";

import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";

import { NotificationBell } from "@/components/shared/notification-bell";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";

export function HeaderMobile({ isAuthenticated }: { isAuthenticated: boolean }) {
  const language = useUIStore((s) => s.language);
  const openSearch = useUIStore((s) => s.setSearchOpen);

  return (
    <div className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-xl md:hidden">
      <div className="flex h-14 items-center gap-1 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src="/meecard.png" alt="Meecard" width={26} height={26} className="shrink-0 select-none" priority />
          <span className="text-base font-bold tracking-tight">Meecard</span>
        </Link>

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
