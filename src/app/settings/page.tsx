"use client";

import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GroupedSection, GroupedRow } from "@/components/ui/grouped-list";
import { useProfileData } from "@/components/profile/profile-data-context";
import { SectionAccount } from "@/components/profile/section-account";
import { getTierConfig } from "@/components/profile/profile-types";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { SETTINGS_SECTIONS } from "./settings-shell";

export default function SettingsIndexPage() {
  const lang = useUIStore((s) => s.language);
  const { data, settings, handleUserUpdate } = useProfileData();

  if (!data) return null;

  const { user, subscription } = data;
  const tierCfg = getTierConfig(subscription.tier);

  const visibleSections = SETTINGS_SECTIONS.filter(
    (s) => !(s.id === "notifications" && !settings),
  );
  const generalSections = visibleSections.filter((s) => s.group === "general");
  const moreSections = visibleSections.filter((s) => s.group === "more");

  return (
    <>
      {/* ── Mobile menu — iOS grouped-inset table view (desktop untouched below) ── */}
      <div className="-mx-5 space-y-6 md:hidden">
        <h1 className="text-large-title px-5">{t(lang, "profileSettings")}</h1>

        {/* Identity row — bigger avatar, own grouped card like /proto/ios/more */}
        <GroupedSection>
          <Link href={`/profile/${user.id}`} className="ease-chrome block transition-colors active:bg-muted/60">
            <div className="flex min-h-[68px] items-center gap-3 px-4 py-3">
              <Avatar className={cn("size-11 shrink-0 ring-2 ring-offset-2 ring-offset-background", tierCfg.ring)}>
                {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                <AvatarFallback className="text-base font-bold">
                  {(user.displayName ?? user.email).slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-body-sm font-semibold">{user.displayName ?? "User"}</p>
                  <Badge className={cn("h-4 px-1.5 text-micro", tierCfg.color)}>
                    {tierCfg.label}
                  </Badge>
                </div>
                <p className="mt-0.5 inline-flex items-center gap-1 text-meta">
                  {t(lang, "viewPublicProfile")}
                  <ExternalLink className="size-3" />
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground/40" />
            </div>
          </Link>
        </GroupedSection>

        {[
          { items: generalSections, labelKey: "settingsGeneral" as const },
          { items: moreSections, labelKey: "settingsMore" as const },
        ].map(({ items, labelKey }, gi) =>
          items.length === 0 ? null : (
            <GroupedSection key={gi} label={t(lang, labelKey)}>
              {items.map((section) => (
                <GroupedRow
                  key={section.id}
                  icon={section.icon}
                  title={t(lang, section.labelKey)}
                  href={section.href}
                />
              ))}
            </GroupedSection>
          ),
        )}
      </div>

      {/* ── Desktop: default to Account section ── */}
      <div className="hidden md:block">
        <SectionAccount user={user} onUserUpdate={handleUserUpdate} />
      </div>
    </>
  );
}
