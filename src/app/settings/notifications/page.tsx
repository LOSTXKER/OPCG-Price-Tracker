"use client";

import { useProfileData } from "@/components/profile/profile-data-context";
import { SectionNotifications } from "@/components/settings/section-notifications";

export default function SettingsNotificationsPage() {
  const { data, settings, reload } = useProfileData();
  if (!data || !settings) return null;
  return <SectionNotifications settings={settings} onReload={() => void reload()} />;
}
