"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProfileData } from "@/components/profile/profile-data-context";
import { SectionSubscription } from "@/components/settings/section-subscription";
import { refetchSettings } from "@/hooks/use-settings";

export default function SettingsSubscriptionPage() {
  const searchParams = useSearchParams();
  const { data, reload } = useProfileData();
  const [checkoutRefreshing, setCheckoutRefreshing] = useState(false);
  const [checkoutRefreshError, setCheckoutRefreshError] = useState(false);
  const checkoutReturned = searchParams.get("subscription") === "success";
  const [showCheckoutStatus, setShowCheckoutStatus] = useState(checkoutReturned);

  const refreshSubscription = useCallback(async () => {
    setCheckoutRefreshing(true);
    setCheckoutRefreshError(false);
    try {
      const [profileLoaded, refreshedSettings] = await Promise.all([
        reload(),
        refetchSettings(),
      ]);
      setCheckoutRefreshError(!profileLoaded || refreshedSettings === null);
    } finally {
      setCheckoutRefreshing(false);
    }
  }, [reload]);

  useEffect(() => {
    if (checkoutReturned) void refreshSubscription();
  }, [checkoutReturned, refreshSubscription]);

  useEffect(() => {
    if (checkoutReturned) setShowCheckoutStatus(true);
  }, [checkoutReturned]);

  useEffect(() => {
    if (!showCheckoutStatus || !data?.subscription.hasStripeSubscription) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("subscription");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [data?.subscription.hasStripeSubscription, showCheckoutStatus]);

  if (!data) return null;
  return (
    <SectionSubscription
      subscription={data.subscription}
      stats={data.stats}
      checkoutReturned={showCheckoutStatus}
      checkoutRefreshing={checkoutRefreshing}
      checkoutRefreshError={checkoutRefreshError}
      onRefreshCheckout={() => void refreshSubscription()}
    />
  );
}
