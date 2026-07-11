"use client";

import { AccountPrivacySection } from "@/components/settings/account-privacy-section";
import { useProfileData } from "@/components/profile/profile-data-context";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { SettingsSectionHeader } from "@/components/settings/settings-section-header";

export default function SettingsPrivacyPage() {
  const lang = useUIStore((s) => s.language);
  const { data, handleUserUpdate } = useProfileData();
  if (!data) return null;

  return (
    <div className="space-y-6">
      <SettingsSectionHeader
        title={t(lang, "privacy")}
        description={t(lang, "privacySubtitle")}
      />

      <AccountPrivacySection
        user={data.user}
        lang={lang}
        onUserUpdate={handleUserUpdate}
      />
    </div>
  );
}
