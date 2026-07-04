"use client";

import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import type { DbUser } from "./profile-types";
import { AccountProfileHero } from "./account-profile-hero";
import { AccountProfileInfo } from "./account-profile-info";
import { AccountSocialLinks } from "./account-social-links";
import { AccountCoverImage } from "./account-cover-image";

type Props = {
  user: DbUser;
  onUserUpdate: (user: DbUser) => void;
};

export function SectionAccount({ user, onUserUpdate }: Props) {
  const lang = useUIStore((s) => s.language);

  return (
    <div className="space-y-6">
      <h2 className="text-h2 hidden md:block">{t(lang, "profileTabAccount")}</h2>

      <AccountProfileHero user={user} lang={lang} onUserUpdate={onUserUpdate} />
      <AccountCoverImage user={user} lang={lang} onUserUpdate={onUserUpdate} />
      <AccountProfileInfo user={user} lang={lang} onUserUpdate={onUserUpdate} />
      <AccountSocialLinks user={user} lang={lang} onUserUpdate={onUserUpdate} />
    </div>
  );
}
