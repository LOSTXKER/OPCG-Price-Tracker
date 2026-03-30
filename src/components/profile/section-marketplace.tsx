"use client";

import Link from "next/link";
import { Store } from "lucide-react";
import { PriceDisplay } from "@/components/shared/price-display";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import type { ListingBrief } from "./profile-types";

type Props = {
  listings: ListingBrief[];
  userId: string;
};

export function SectionMarketplace({ listings, userId }: Props) {
  const lang = useUIStore((s) => s.language);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Store className="size-5" />
          {t(lang, "myListings")}
        </h2>
        <Link
          href={`/profile/${userId}`}
          className="text-primary text-xs hover:underline underline-offset-4"
        >
          {t(lang, "profileSellerRating")} →
        </Link>
      </div>

      <div className="rounded-xl border border-border/40 bg-card p-5">
        {listings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Store className="size-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">{t(lang, "noListings")}</p>
            <Link href="/marketplace">
              <Button size="sm" variant="outline">
                {t(lang, "listCard")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {listings.map((l) => (
              <Link
                key={l.id}
                href={`/marketplace/${l.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/30 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium">
                    {lang === "EN" ? l.card.nameEn ?? l.card.nameJp : l.card.nameJp}
                  </span>
                  <span className="text-muted-foreground ml-2 text-xs">{l.card.cardCode}</span>
                </div>
                <PriceDisplay
                  priceJpy={l.priceJpy}
                  priceThb={l.priceThb ?? undefined}
                  showChange={false}
                  size="sm"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
