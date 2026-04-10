"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Check,
  Eye,
  Layers,
  Lock,
  Package,
  Pencil,
  Settings,
  Share2,
  Star,
  Store,
} from "lucide-react";
import { ListingCard } from "@/components/marketplace/listing-card";
import { CardItem } from "@/components/cards/card-item";
import { CardGrid } from "@/components/cards/card-grid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTierConfig } from "@/components/profile/profile-types";
import { useUIStore } from "@/stores/ui-store";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ProfileUser = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  bio: string | null;
  tier: string;
  sellerRating: number | null;
  sellerReviewCount: number;
  createdAt: string;
};

type ProfileStats = {
  listingCount: number;
  reviewCount: number;
  portfolioCardCount: number;
  watchlistCount: number;
};

type SerializedListing = {
  id: number;
  priceJpy: number;
  priceThb: number | null;
  condition: string;
  shipping: string[];
  location: string | null;
  isFeatured: boolean;
  card: {
    cardCode: string;
    nameJp: string;
    nameEn: string | null;
    rarity: string;
    imageUrl: string | null;
    latestPriceJpy: number | null;
  };
  seller: {
    displayName: string | null;
    avatarUrl: string | null;
    sellerRating: number | null;
    sellerReviewCount: number;
  };
};

type SerializedReview = {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    displayName: string | null;
    avatarUrl: string | null;
  };
};

type ProfileCardData = {
  cardCode: string;
  nameJp: string;
  nameEn: string | null;
  rarity: string;
  imageUrl: string | null;
  priceJpy: number | null;
  priceThb: number | null;
  setCode?: string | null;
};

type HiddenSections = {
  listings: boolean;
  collection: boolean;
  decks: boolean;
  stats: boolean;
};

type Tab = "listings" | "collection" | "reviews" | "watchlist";

type Props = {
  user: ProfileUser;
  stats: ProfileStats;
  listings: SerializedListing[];
  reviews: SerializedReview[];
  collectionCards: ProfileCardData[];
  watchlistCards: ProfileCardData[];
  isOwner: boolean;
  isPrivate?: boolean;
  hiddenSections?: HiddenSections;
};

const TIER_BANNER: Record<string, string> = {
  FREE: "from-slate-600 via-slate-500 to-slate-400 dark:from-slate-800 dark:via-slate-700 dark:to-slate-600",
  PRO: "from-amber-700 via-orange-500 to-yellow-400 dark:from-amber-900 dark:via-orange-700 dark:to-yellow-600",
  LIFETIME_PRO: "from-amber-700 via-orange-500 to-yellow-400 dark:from-amber-900 dark:via-orange-700 dark:to-yellow-600",
  PRO_PLUS: "from-yellow-600 via-amber-400 to-orange-300 dark:from-yellow-800 dark:via-amber-600 dark:to-orange-500",
  LIFETIME_PRO_PLUS: "from-yellow-600 via-amber-400 to-orange-300 dark:from-yellow-800 dark:via-amber-600 dark:to-orange-500",
};

export function PublicProfileClient({
  user,
  stats,
  listings,
  reviews,
  collectionCards,
  watchlistCards,
  isOwner,
  isPrivate,
  hiddenSections,
}: Props) {
  const lang = useUIStore((s) => s.language);
  const [activeTab, setActiveTab] = useState<Tab>("listings");
  const [copied, setCopied] = useState(false);
  const tierCfg = getTierConfig(user.tier);
  const bannerGradient = TIER_BANNER[user.tier] ?? TIER_BANNER.FREE;

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${user.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const memberSince = new Date(user.createdAt).toLocaleDateString(
    lang === "TH" ? "th-TH" : lang === "JP" ? "ja-JP" : "en-US",
    { year: "numeric", month: "short" },
  );

  const allTabs: { key: Tab; labelKey: Parameters<typeof t>[1]; count?: number }[] = [
    { key: "listings", labelKey: "tabListings", count: stats.listingCount },
    { key: "collection", labelKey: "tabCollection", count: stats.portfolioCardCount },
    { key: "reviews", labelKey: "tabReviews", count: stats.reviewCount },
    { key: "watchlist", labelKey: "tabWatchlist", count: stats.watchlistCount },
  ];

  const visibleTabs = isOwner
    ? allTabs
    : allTabs.filter(({ key }) => {
        if (key === "listings" && hiddenSections?.listings) return false;
        if (key === "collection" && hiddenSections?.collection) return false;
        return true;
      });

  const statItems: { labelKey: Parameters<typeof t>[1]; value: string | number; icon?: typeof Star; dimmed?: boolean }[] = [
    { labelKey: "tabListings" as const, value: stats.listingCount },
    ...(user.sellerRating != null
      ? [{ labelKey: "profileSellerRating" as const, value: `${user.sellerRating.toFixed(1)}`, icon: Star }]
      : []),
    { labelKey: "tabReviews" as const, value: stats.reviewCount },
    { labelKey: "cardsInCollection" as const, value: stats.portfolioCardCount },
  ];

  if (isPrivate) {
    return (
      <div className="pb-16">
        <div className="mx-auto w-full max-w-7xl px-4 pt-6 md:px-6 lg:px-8">
          <div className={cn("relative h-40 overflow-hidden rounded-2xl bg-gradient-to-br sm:h-48", bannerGradient)}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_60%,rgba(255,255,255,0.08),transparent_60%)]" />
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="-mt-16 flex flex-col items-center gap-4 pt-24 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/60">
              <Lock className="size-8 text-muted-foreground/40" />
            </div>
            <h1 className="text-xl font-bold">{user.displayName ?? "User"}</h1>
            <p className="text-sm text-muted-foreground">{t(lang, "profileIsPrivate")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* ── Banner ── */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 md:px-6 lg:px-8">
        <div className="relative h-40 overflow-hidden rounded-2xl sm:h-48">
          {user.coverImageUrl ? (
            <Image
              src={user.coverImageUrl}
              alt=""
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className={cn("absolute inset-0 bg-gradient-to-br", bannerGradient)}>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M0%200h40v40H0z%22%20fill%3D%22none%22%2F%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%2220%22%20r%3D%221%22%20fill%3D%22rgba(255%2C255%2C255%2C0.04)%22%2F%3E%3C%2Fsvg%3E')] bg-repeat" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_60%,rgba(255,255,255,0.08),transparent_60%)]" />
            </div>
          )}
        </div>
      </div>

      {/* ── Profile hero ── */}
      <div className="relative mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="mt-4 flex items-center justify-between gap-4">
          {/* Left: Avatar + Name/Bio beside it */}
          <div className="flex min-w-0 items-center gap-4">
            <Avatar
              className={cn(
                "size-16 shrink-0 border-[3px] border-background shadow-md sm:size-20",
                tierCfg.ring,
                "ring-2",
              )}
            >
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
              <AvatarFallback className="bg-muted text-2xl font-bold sm:text-3xl">
                {(user.displayName ?? "?").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-words text-xl font-extrabold tracking-tight sm:text-2xl">
                  {user.displayName ?? "User"}
                </h1>
                <Badge className={cn("shrink-0 text-xs font-semibold", tierCfg.color)}>
                  {tierCfg.label}
                </Badge>
              </div>
              {user.bio && (
                <p className="mt-0.5 max-w-sm truncate text-xs text-muted-foreground sm:max-w-md sm:text-sm">
                  {user.bio}
                </p>
              )}
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground/60">
                <Calendar className="size-3" />
                {t(lang, "memberSince")} {memberSince}
              </p>
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="flex shrink-0 gap-2">
            {isOwner && (
              <>
                <Link href="/settings/account">
                  <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
                    <Pencil className="size-3.5" />
                    {t(lang, "editProfile")}
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
                    <Settings className="size-3.5" />
                    {t(lang, "profileSettings")}
                  </Button>
                </Link>
              </>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => void handleShare()}
              className="relative rounded-full"
            >
              {copied ? <Check className="size-4 text-green-500" /> : <Share2 className="size-4" />}
            </Button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="mt-6 flex gap-3 overflow-x-auto pb-1">
          {statItems.map(({ labelKey, value, icon: Icon }) => (
            <div
              key={labelKey}
              className="flex min-w-[80px] flex-col items-center gap-0.5 rounded-xl border border-border/40 bg-card/50 px-4 py-3 text-center backdrop-blur-sm"
            >
              <span className="flex items-center gap-1 text-xl font-bold tabular-nums leading-none">
                {Icon && <Icon className="size-4 fill-amber-400 text-amber-400" />}
                {value}
              </span>
              <span className="text-xs font-medium text-muted-foreground">{t(lang, labelKey)}</span>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="mt-6 border-b border-border/40">
          <nav className="-mb-px flex gap-0 overflow-x-auto">
            {visibleTabs.map(({ key, labelKey, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "relative flex shrink-0 items-center gap-1.5 px-5 py-3 text-sm font-medium transition-colors",
                  activeTab === key
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/70",
                )}
              >
                {t(lang, labelKey)}
                {count != null && count > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                      activeTab === key
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                )}
                <span className={cn(
                  "absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary transition-all duration-200",
                  activeTab === key ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0",
                )} />
              </button>
            ))}
          </nav>
        </div>

        {/* ── Tab content ── */}
        <div className="py-6">
          {activeTab === "listings" && (
            <ListingsTabContent listings={listings} isOwner={isOwner} lang={lang} />
          )}
          {activeTab === "reviews" && (
            <ReviewsTabContent reviews={reviews} lang={lang} />
          )}
          {activeTab === "collection" && (
            <CardListTabContent
              cards={collectionCards}
              icon={Layers}
              emptyKey="noCollectionYet"
              lang={lang}
            />
          )}
          {activeTab === "watchlist" && (
            <CardListTabContent
              cards={watchlistCards}
              icon={Eye}
              emptyKey="noWatchlistYet"
              lang={lang}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Tab content components ── */

function ListingsTabContent({
  listings,
  isOwner,
  lang,
}: {
  listings: SerializedListing[];
  isOwner: boolean;
  lang: Language;
}) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60">
          <Store className="size-7 text-muted-foreground/30" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{t(lang, "noListingsPublic")}</p>
        {isOwner && (
          <Link href="/marketplace/create">
            <Button size="sm" className="gap-1.5 rounded-full">
              <Package className="size-3.5" />
              {t(lang, "startSelling")}
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((l) => (
        <ListingCard
          key={l.id}
          id={l.id}
          card={l.card}
          priceJpy={l.priceJpy}
          priceThb={l.priceThb}
          condition={l.condition}
          seller={{
            displayName: l.seller.displayName ?? undefined,
            avatarUrl: l.seller.avatarUrl ?? undefined,
            sellerRating: l.seller.sellerRating ?? undefined,
            sellerReviewCount: l.seller.sellerReviewCount,
          }}
          shipping={l.shipping}
          location={l.location}
          isFeatured={l.isFeatured}
        />
      ))}
    </div>
  );
}

function ReviewsTabContent({
  reviews,
  lang,
}: {
  reviews: SerializedReview[];
  lang: Language;
}) {
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60">
          <Star className="size-7 text-muted-foreground/30" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{t(lang, "noReviews")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div
          key={r.id}
          className="flex gap-3 rounded-xl border border-border/40 bg-card p-4"
        >
          <Avatar className="size-10 shrink-0">
            {r.reviewer.avatarUrl ? (
              <AvatarImage src={r.reviewer.avatarUrl} alt="" />
            ) : null}
            <AvatarFallback className="text-xs">
              {(r.reviewer.displayName ?? "?").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {r.reviewer.displayName ?? "User"}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "size-3.5",
                    i < r.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/20",
                  )}
                />
              ))}
              <span className="ml-1.5 text-xs font-medium text-muted-foreground">
                {r.rating}/5
              </span>
            </div>
            {r.comment && (
              <p className="mt-2 break-words text-sm text-foreground/80">{r.comment}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CardListTabContent({
  cards,
  icon: Icon,
  emptyKey,
  lang,
}: {
  cards: ProfileCardData[];
  icon: typeof Layers;
  emptyKey: Parameters<typeof t>[1];
  lang: Language;
}) {
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60">
          <Icon className="size-7 text-muted-foreground/30" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{t(lang, emptyKey)}</p>
      </div>
    );
  }

  return (
    <CardGrid>
      {cards.map((c) => (
        <CardItem
          key={c.cardCode}
          cardCode={c.cardCode}
          nameJp={c.nameJp}
          nameEn={c.nameEn}
          rarity={c.rarity}
          imageUrl={c.imageUrl}
          priceJpy={c.priceJpy}
          priceThb={c.priceThb}
          setCode={c.setCode ?? undefined}
        />
      ))}
    </CardGrid>
  );
}
