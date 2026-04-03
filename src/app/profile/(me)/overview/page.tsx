"use client";

import { SectionOverview } from "@/components/profile/section-overview";
import { useProfileData } from "@/components/profile/profile-data-context";

export default function OverviewPage() {
  const { data, checkinLoading, handleCheckin } = useProfileData();
  if (!data) return null;

  return (
    <SectionOverview
      stats={data.stats}
      honey={data.honey}
      userId={data.user.id}
      sellerRating={data.user.sellerRating}
      sellerReviewCount={data.user.sellerReviewCount}
      checkinLoading={checkinLoading}
      onCheckin={() => void handleCheckin()}
    />
  );
}
