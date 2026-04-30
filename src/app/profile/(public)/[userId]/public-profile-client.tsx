"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useUIStore } from "@/stores/ui-store";
import type { Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatJoinedRelative } from "@/lib/utils/relative-time";
import type {
  CollectionStats,
  CommerceProfile,
  ProfileAchievement,
  ProfileBadge,
  ProfilePrivacyFlags,
  SellerStats,
} from "@/lib/profile/load-public-profile";

import {
  buildHeroMeta,
  buildSocialLinks,
} from "@/components/profile/public/hero-builders";
import { EmptyProfilePanel } from "@/components/profile/public/empty-profile-panel";
import { PrivateProfileView } from "@/components/profile/public/private-profile-view";
import { ProfileActionCluster } from "@/components/profile/public/profile-action-cluster";
import { ProfileCompleteness } from "@/components/profile/public/profile-completeness";
import { ProfileCover } from "@/components/profile/public/profile-cover";
import { ProfileHero } from "@/components/profile/public/profile-hero";
import { ProfileMobileCtaBar } from "@/components/profile/public/profile-mobile-cta-bar";
import { ProfileReviewsPreview } from "@/components/profile/public/profile-reviews-preview";
import { ProfileSellerCard } from "@/components/profile/profile-seller-card";
import { ProfileTrustBlock } from "@/components/profile/public/profile-trust-block";
import {
  ProfileTabsNav,
  type TabDescriptor,
} from "@/components/profile/public/profile-tabs-nav";
import { AchievementsTabContent } from "@/components/profile/public/tabs/achievements-tab";
import { CollectionTabContent } from "@/components/profile/public/tabs/collection-tab";
import { ListingsTabContent } from "@/components/profile/public/tabs/listings-tab";
import { ReviewsTabContent } from "@/components/profile/public/tabs/reviews-tab";
import { SummaryOnlyBanner } from "@/components/profile/public/tabs/summary-only-banner";
import type {
  ProfileCardData,
  ProfileStats,
  ProfileTab,
  ProfileUser,
  SerializedListing,
  SerializedReview,
} from "@/components/profile/public/types";

type Props = {
  user: ProfileUser;
  stats: ProfileStats;
  listings: SerializedListing[];
  reviews: SerializedReview[];
  collectionCards: ProfileCardData[];
  achievements: ProfileAchievement[];
  badges: ProfileBadge[];
  collectionStats: CollectionStats;
  sellerStats: SellerStats;
  privacyFlags: ProfilePrivacyFlags;
  firstListingId: number | null;
  viewerSavedSeller: boolean;
  viewerIsSignedIn: boolean;
  commerceProfile: CommerceProfile;
  isOwner: boolean;
  isPrivate?: boolean;
};

/**
 * Top-level orchestrator for the public profile route. Intentionally thin:
 *   1. compute language + derived state
 *   2. early-return for the locked profile view
 *   3. assemble hero + tabs + content area + (mobile) sticky CTA
 *
 * All visual chunks live in `@/components/profile/public/*` so each piece
 * stays small enough to reason about in isolation.
 */
export function PublicProfileClient({
  user,
  stats,
  listings,
  reviews,
  collectionCards,
  achievements,
  badges,
  collectionStats,
  sellerStats,
  privacyFlags,
  firstListingId,
  viewerSavedSeller,
  viewerIsSignedIn,
  commerceProfile,
  isOwner,
  isPrivate,
}: Props) {
  const lang = useUIStore((s) => s.language);

  // Privacy gate first — nothing else needs to render.
  if (isPrivate) {
    return <PrivateProfileView user={user} lang={lang} />;
  }

  return (
    <PublicProfileLayout
      user={user}
      stats={stats}
      listings={listings}
      reviews={reviews}
      collectionCards={collectionCards}
      achievements={achievements}
      badges={badges}
      collectionStats={collectionStats}
      sellerStats={sellerStats}
      privacyFlags={privacyFlags}
      firstListingId={firstListingId}
      viewerSavedSeller={viewerSavedSeller}
      viewerIsSignedIn={viewerIsSignedIn}
      commerceProfile={commerceProfile}
      isOwner={isOwner}
      lang={lang}
    />
  );
}

/* ────────────────────────────────────────────────────────────────────────── *
 * The split below is deliberate: hooks below this point never run for the
 * locked private view, and React's rules-of-hooks stay clean even when we
 * early-return at the top.
 * ────────────────────────────────────────────────────────────────────────── */

function PublicProfileLayout({
  user,
  stats,
  listings,
  reviews,
  collectionCards,
  achievements,
  badges,
  collectionStats,
  sellerStats,
  privacyFlags,
  firstListingId,
  viewerSavedSeller,
  viewerIsSignedIn,
  commerceProfile,
  isOwner,
  lang,
}: Omit<Props, "isPrivate"> & { lang: Language }) {
  // Reuses the most recent active listing as the conversation anchor since
  // messages are scoped to a listing in the schema.
  const messageHref = firstListingId ? `/messages/${firstListingId}` : null;

  const joinedRelative = formatJoinedRelative(user.createdAt, lang);

  const achievementCount = achievements.length + badges.length;
  const hasAchievementsTab = achievementCount > 0;

  const visibleTabs = useMemo<TabDescriptor[]>(() => {
    const all: TabDescriptor[] = [
      { key: "achievements", labelKey: "tabAchievements", count: achievementCount },
      { key: "listings", labelKey: "tabListings", count: stats.listingCount },
      { key: "collection", labelKey: "tabCollection", count: stats.portfolioCardCount },
      { key: "reviews", labelKey: "tabReviews", count: stats.reviewCount },
    ];
    return all.filter(({ key, count }) => {
      if (key === "achievements") return hasAchievementsTab;
      if (key === "listings") return privacyFlags.showListings && (isOwner || (count ?? 0) > 0);
      if (key === "collection") return privacyFlags.showCollection && (isOwner || (count ?? 0) > 0);
      if (key === "reviews") return isOwner || (count ?? 0) > 0;
      return true;
    });
  }, [
    achievementCount,
    hasAchievementsTab,
    isOwner,
    privacyFlags.showCollection,
    privacyFlags.showListings,
    stats.listingCount,
    stats.portfolioCardCount,
    stats.reviewCount,
  ]);

  // Default to whichever tab has the most "real estate" — listings → collection
  // → achievements → reviews — falling back to whatever tab survived filtering.
  const defaultTab: ProfileTab =
    stats.listingCount > 0
      ? "listings"
      : stats.portfolioCardCount > 0
        ? "collection"
        : hasAchievementsTab
          ? "achievements"
          : (visibleTabs[0]?.key ?? "achievements");

  // ── URL ⇄ activeTab ──────────────────────────────────────────────────
  // The active tab is *derived* from the URL — no React state — so deep
  // links and browser back/forward Just Work without any effect dance. We
  // use `router.replace` (not `push`) to swap tabs, which keeps the back
  // button anchored to the previous page rather than the previous tab
  // (matches what visitors expect: back = leave the profile).
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const allowedTabs = useMemo(
    () => new Set<ProfileTab>(visibleTabs.map((tab) => tab.key)),
    [visibleTabs],
  );
  const tabFromUrl = searchParams.get("tab") as ProfileTab | null;
  const activeTab: ProfileTab =
    tabFromUrl && allowedTabs.has(tabFromUrl) ? tabFromUrl : defaultTab;

  const setActiveTab = useCallback(
    (key: ProfileTab) => {
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("tab", key);
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const metaParts = useMemo(
    () => buildHeroMeta({ user, stats, sellerStats, isOwner, lang }),
    [user, stats, sellerStats, isOwner, lang],
  );
  const socialLinks = useMemo(
    () => buildSocialLinks(user.socials, lang),
    [user.socials, lang],
  );

  // No meaningful tabs AND empty seller surface → friendly welcome.
  const isEmptyProfile =
    visibleTabs.length === 0 &&
    !hasAchievementsTab &&
    stats.listingCount === 0 &&
    stats.portfolioCardCount === 0 &&
    stats.reviewCount === 0;

  return (
    <div className={cn("pb-24 md:pb-16")}>
      <div className="relative mx-auto w-full max-w-5xl px-4 pt-6 md:px-6 md:pt-8 lg:px-8">
        {/* Brand-warm cover banner (rounded card, not full-bleed) — gives
            the page colour without overwhelming the rest of the layout. */}
        <ProfileCover userId={user.id} coverImageUrl={user.coverImageUrl} />

        <div className="relative">
          <ProfileHero
            user={user}
            sellerStats={sellerStats}
            achievements={achievements}
            metaParts={metaParts}
            socialLinks={socialLinks}
            joinedRelative={joinedRelative}
            lang={lang}
            actionsSlot={
              <ProfileActionCluster
                user={user}
                messageHref={messageHref}
                isOwner={isOwner}
                viewerSavedSeller={viewerSavedSeller}
                viewerIsSignedIn={viewerIsSignedIn}
                lang={lang}
              />
            }
          />

          {/* Credibility strip — visible to everyone. Renders directly
              under the hero so the seller's headline numbers (rating,
              deals, response) are on screen before the buyer has to
              scroll. The trust block (visitor-only) layers commerce
              context underneath for buyers. */}
          <ProfileSellerCard stats={sellerStats} />
          <ProfileTrustBlock
            sellerStats={sellerStats}
            commerceProfile={commerceProfile}
            reviewCount={stats.reviewCount}
            isOwner={isOwner}
            lang={lang}
          />

          {isOwner && (
            <ProfileCompleteness
              user={user}
              stats={stats}
              socials={user.socials}
              isOwner={isOwner}
              lang={lang}
            />
          )}

          {/* Featured reviews — concise social proof above the fold. */}
          <ProfileReviewsPreview
            reviews={reviews}
            rating={sellerStats.rating}
            reviewCount={stats.reviewCount}
            lang={lang}
            onJump={setActiveTab}
          />

          <ProfileTabsNav
            tabs={visibleTabs}
            active={activeTab}
            onChange={setActiveTab}
            lang={lang}
          />

          <div className="py-6">
            {isEmptyProfile && (
              <EmptyProfilePanel
                user={user}
                messageHref={messageHref}
                isOwner={isOwner}
                lang={lang}
              />
            )}
            {/* `key={activeTab}` triggers an enter animation on every switch
                so the tab change feels intentional, not jarring. */}
            <div key={activeTab} className="animate-in fade-in-0 duration-200">
              {activeTab === "achievements" && (
                <AchievementsTabContent achievements={achievements} badges={badges} />
              )}
              {activeTab === "listings" && (
                <ListingsTabContent
                  listings={listings}
                  listingTotal={stats.listingCount}
                  sellerHandleOrId={user.handle ?? user.id}
                  isOwner={isOwner}
                  lang={lang}
                />
              )}
              {activeTab === "reviews" && (
                <ReviewsTabContent reviews={reviews} lang={lang} />
              )}
              {activeTab === "collection" && (
                privacyFlags.summaryOnly ? (
                  <SummaryOnlyBanner stats={collectionStats} lang={lang} />
                ) : (
                  <CollectionTabContent
                    cards={collectionCards}
                    stats={collectionStats}
                    hideQty={privacyFlags.hidePortfolioQty}
                    isOwner={isOwner}
                    lang={lang}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {!isOwner && (
        <ProfileMobileCtaBar
          sellerId={user.id}
          messageHref={messageHref}
          viewerSavedSeller={viewerSavedSeller}
          viewerIsSignedIn={viewerIsSignedIn}
          lang={lang}
        />
      )}
    </div>
  );
}
