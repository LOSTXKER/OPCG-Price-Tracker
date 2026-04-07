"use client";

import { useProfileData } from "@/components/profile/profile-data-context";
import { SectionAccount } from "@/components/profile/section-account";

export default function SettingsAccountPage() {
  const { data, handleUserUpdate } = useProfileData();
  if (!data) return null;
  return <SectionAccount user={data.user} onUserUpdate={handleUserUpdate} />;
}
