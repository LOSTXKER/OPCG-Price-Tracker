"use client";

import Link from "next/link";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";

/**
 * App-wide 404. The ~15 routes that call `notFound()` (deleted sets/cards/blog,
 * marketplace routes while the flag is off, mistyped URLs) land here instead of
 * Next's bare default — a branded "หมีหลงทาง" with a real way back in.
 */
export default function NotFound() {
  const lang = useUIStore((s) => s.language);

  return (
    <div className="mx-auto flex max-w-lg flex-col justify-center px-5 py-16">
      <EmptyState
        preset="not-found"
        lang={lang}
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button render={<Link href="/" />}>{t(lang, "backToHome")}</Button>
            <Button variant="outline" render={<Link href="/opcg/search" />} className="gap-1.5">
              <Search className="size-4" />
              {t(lang, "search")}
            </Button>
          </div>
        }
      />
    </div>
  );
}
