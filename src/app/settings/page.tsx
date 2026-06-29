"use client";

import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
      {/* ── Mobile menu ── */}
      <div className="space-y-7 md:hidden">
        <h1 className="text-h2">{t(lang, "profileSettings")}</h1>

        {/* Identity row — compact, single tap target */}
        <Link
          href={`/profile/${user.id}`}
          className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 motion-base active:bg-muted/70"
        >
          <Avatar className={cn("size-11 shrink-0 ring-2 ring-offset-2 ring-offset-background", tierCfg.ring)}>
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback className="text-base font-bold">
              {(user.displayName ?? user.email).slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold">{user.displayName ?? "User"}</p>
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
        </Link>

        {[
          { items: generalSections, labelKey: "settingsGeneral" as const },
          { items: moreSections, labelKey: "settingsMore" as const },
        ].map(({ items, labelKey }, gi) =>
          items.length === 0 ? null : (
            <div key={gi} className="space-y-1">
              <p className="px-3 text-eyebrow text-muted-foreground/70">{t(lang, labelKey)}</p>
              <div className="-mx-2 flex flex-col">
                {items.map((section) => {
                  const Icon = section.icon;
                  return (
                    <Link
                      key={section.id}
                      href={section.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 motion-base active:bg-muted/70"
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 text-sm">{t(lang, section.labelKey)}</span>
                      <ChevronRight className="size-4 text-muted-foreground/40" />
                    </Link>
                  );
                })}
              </div>
            </div>
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
