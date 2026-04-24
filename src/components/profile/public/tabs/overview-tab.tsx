"use client";

import { ProfileAchievements } from "@/components/profile/profile-achievements";
import { ProfileSellerCard } from "@/components/profile/profile-seller-card";
import type {
  ProfileAchievement,
  ProfileBadge,
  SellerStats,
} from "@/lib/profile/load-public-profile";

export function OverviewTabContent({
  achievements,
  badges,
  sellerStats,
}: {
  achievements: ProfileAchievement[];
  badges: ProfileBadge[];
  sellerStats: SellerStats;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <ProfileAchievements achievements={achievements} badges={badges} />
      <ProfileSellerCard stats={sellerStats} />
    </div>
  );
}
