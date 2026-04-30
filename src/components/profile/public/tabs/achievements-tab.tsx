"use client";

import { ProfileAchievements } from "@/components/profile/profile-achievements";
import type {
  ProfileAchievement,
  ProfileBadge,
} from "@/lib/profile/load-public-profile";

export function AchievementsTabContent({
  achievements,
  badges,
}: {
  achievements: ProfileAchievement[];
  badges: ProfileBadge[];
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <ProfileAchievements achievements={achievements} badges={badges} />
    </div>
  );
}
