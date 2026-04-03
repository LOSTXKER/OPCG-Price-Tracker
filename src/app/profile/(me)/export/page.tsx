"use client";

import { SectionExport } from "@/components/profile/section-export";
import { useProfileData } from "@/components/profile/profile-data-context";

export default function ExportPage() {
  const { data } = useProfileData();
  if (!data) return null;
  return <SectionExport />;
}
