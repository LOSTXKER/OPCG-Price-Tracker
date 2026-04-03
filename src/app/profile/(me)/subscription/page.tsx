"use client";

import { SectionSubscription } from "@/components/profile/section-subscription";
import { useProfileData } from "@/components/profile/profile-data-context";

export default function SubscriptionPage() {
  const { data } = useProfileData();
  if (!data) return null;
  return <SectionSubscription subscription={data.subscription} />;
}
