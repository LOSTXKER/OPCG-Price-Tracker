"use client";

import { useProfileData } from "@/components/profile/profile-data-context";
import { SectionSubscription } from "@/components/profile/section-subscription";

export default function SettingsSubscriptionPage() {
  const { data } = useProfileData();
  if (!data) return null;
  return (
    <SectionSubscription
      subscription={data.subscription}
      stats={data.stats}
    />
  );
}
