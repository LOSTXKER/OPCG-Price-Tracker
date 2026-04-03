"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ProfileMobileMenu } from "@/components/profile/profile-sidebar";
import { SectionOverview } from "@/components/profile/section-overview";
import { useProfileData } from "@/components/profile/profile-data-context";

const TAB_REDIRECTS: Record<string, string> = {
  subscription: "/profile/subscription",
  notifications: "/profile/notifications",
  marketplace: "/profile/marketplace",
  export: "/profile/export",
  account: "/profile/account",
};

export default function ProfileOverviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, checkinLoading, handleCheckin } = useProfileData();

  const tabParam = searchParams.get("tab");
  useEffect(() => {
    if (tabParam && TAB_REDIRECTS[tabParam]) {
      router.replace(TAB_REDIRECTS[tabParam]);
    }
  }, [tabParam, router]);

  if (!data) return null;

  return (
    <>
      {/* Desktop: overview section */}
      <div className="hidden md:block space-y-5">
        <SectionOverview
          stats={data.stats}
          honey={data.honey}
          userId={data.user.id}
          sellerRating={data.user.sellerRating}
          sellerReviewCount={data.user.sellerReviewCount}
          checkinLoading={checkinLoading}
          onCheckin={() => void handleCheckin()}
        />
      </div>

      {/* Mobile: show menu list (overview is the "home" of profile on mobile) */}
      <div className="md:hidden">
        <ProfileMobileMenu />
      </div>
    </>
  );
}
