"use client";

import { AccountPrivacySection } from "@/components/profile/account-privacy-section";
import { useProfileData } from "@/components/profile/profile-data-context";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";

export default function SettingsPrivacyPage() {
  const lang = useUIStore((s) => s.language);
  const { data, handleUserUpdate } = useProfileData();
  if (!data) return null;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-h2 hidden md:block">{t(lang, "privacy")}</h2>
        <p className="text-meta">{t(lang, "privacySubtitle")}</p>
      </header>

      <AccountPrivacySection
        user={data.user}
        lang={lang}
        onUserUpdate={handleUserUpdate}
      />
    </div>
  );
}
