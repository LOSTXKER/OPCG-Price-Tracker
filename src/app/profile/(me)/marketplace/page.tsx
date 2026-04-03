"use client";

import { SectionMarketplace } from "@/components/profile/section-marketplace";
import { useProfileData } from "@/components/profile/profile-data-context";

export default function MarketplacePage() {
  const { data } = useProfileData();
  if (!data) return null;
  return <SectionMarketplace listings={data.listings} userId={data.user.id} />;
}
