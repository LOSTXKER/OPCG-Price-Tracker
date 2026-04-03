"use client";

import { SectionAccount } from "@/components/profile/section-account";
import { useProfileData } from "@/components/profile/profile-data-context";

export default function AccountPage() {
  const { data, handleUserUpdate } = useProfileData();
  if (!data) return null;
  return <SectionAccount user={data.user} onUserUpdate={handleUserUpdate} />;
}
