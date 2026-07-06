"use client";

import { useProfileData } from "@/components/profile/profile-data-context";
import { SectionMarketplace } from "@/components/settings/section-marketplace";

export default function SettingsMarketplacePage() {
  const { data } = useProfileData();
  if (!data) return null;
  return (
    <SectionMarketplace
      listings={data.listings}
      userId={data.user.id}
      sellerRating={data.user.sellerRating}
      sellerReviewCount={data.user.sellerReviewCount}
    />
  );
}
