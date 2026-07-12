"use client";

import { Lock } from "lucide-react";

import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { tierBanner } from "./tier-banner";
import type { ProfileUser } from "./types";

/**
 * Lock-screen shown when a user has set their profile to private. We still
 * display the display name + tier-derived banner so the visitor can confirm
 * they reached the right person.
 */
export function PrivateProfileView({
  user,
  lang,
}: {
  user: ProfileUser;
  lang: Language;
}) {
  return (
    <div className="pb-16">
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 md:px-6 lg:px-8">
        <div
          className={cn(
            "h-40 overflow-hidden rounded-2xl sm:h-48",
            tierBanner(user.tier),
          )}
        />
      </div>
      <div className="relative mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="-mt-16 flex flex-col items-center gap-4 pt-24 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/60">
            <Lock className="size-8 text-muted-foreground/40" />
          </div>
          <h1 className="text-h1">{user.displayName ?? "User"}</h1>
          <p className="text-sm text-muted-foreground">{t(lang, "profileIsPrivate")}</p>
        </div>
      </div>
    </div>
  );
}
