"use client";

import { UserCog } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import type { DbUser } from "./profile-types";
import { AccountProfileHero } from "./account-profile-hero";
import { AccountProfileInfo } from "./account-profile-info";
import { AccountSocialLinks } from "./account-social-links";
import { AccountPrivacySection } from "./account-privacy-section";

type Props = {
  user: DbUser;
  onUserUpdate: (user: DbUser) => void;
};

export function SectionAccount({ user, onUserUpdate }: Props) {
  const lang = useUIStore((s) => s.language);

  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <UserCog className="size-5" />
        {t(lang, "profileTabAccount")}
      </h2>

      <AccountProfileHero user={user} lang={lang} onUserUpdate={onUserUpdate} />
      <AccountProfileInfo user={user} lang={lang} onUserUpdate={onUserUpdate} />
      <AccountSocialLinks user={user} lang={lang} onUserUpdate={onUserUpdate} />
      <AccountPrivacySection user={user} lang={lang} onUserUpdate={onUserUpdate} />
    </div>
  );
}
