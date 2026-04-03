"use client";

import { SectionNotifications } from "@/components/profile/section-notifications";
import { useProfileData } from "@/components/profile/profile-data-context";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";

export default function NotificationsPage() {
  const { data, settings, reload } = useProfileData();
  const lang = useUIStore((s) => s.language);
  if (!data) return null;
  if (!settings) return <p className="text-sm text-muted-foreground">{t(lang, "loading")}</p>;
  return <SectionNotifications settings={settings} onReload={() => void reload()} />;
}
