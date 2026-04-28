"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
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
      {/* ── Mobile: iOS-style menu ── */}
      <div className="space-y-6 md:hidden">
        <PageHeader title={t(lang, "profileSettings")} className="mb-0" />

        {/* User card */}
        <Link
          href={`/profile/${user.id}`}
          className="flex items-center gap-3 rounded-xl border border-border/40 bg-card p-4 transition-colors active:bg-secondary/50"
        >
          <Avatar className={cn("size-12 ring-2 ring-offset-2 ring-offset-card", tierCfg.ring)}>
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback className="text-sm font-bold">
              {(user.displayName ?? user.email).slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {user.displayName ?? "User"}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Badge className={cn("text-xs font-semibold", tierCfg.color)}>
                {tierCfg.label}
              </Badge>
              <span className="text-meta">
                {t(lang, "viewPublicProfile")}
              </span>
            </div>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground/40" />
        </Link>

        {/* General group */}
        <div className="space-y-1.5">
          <p className="px-1 text-eyebrow">
            {t(lang, "settingsGeneral")}
          </p>
          <div className="overflow-hidden rounded-xl border border-border/40 bg-card">
            {generalSections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.id}
                  href={section.href}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3.5 transition-colors active:bg-secondary/50",
                    idx > 0 && "border-t border-border/30",
                  )}
                >
                  <div className="flex size-8 items-center justify-center rounded-lg bg-secondary">
                    <Icon className="size-4 text-primary" />
                  </div>
                  <span className="flex-1 text-sm font-medium">
                    {t(lang, section.labelKey)}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground/40" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* More group */}
        {moreSections.length > 0 && (
          <div className="space-y-1.5">
            <p className="px-1 text-eyebrow">
              {t(lang, "settingsMore")}
            </p>
            <div className="overflow-hidden rounded-xl border border-border/40 bg-card">
              {moreSections.map((section, idx) => {
                const Icon = section.icon;
                return (
                  <Link
                    key={section.id}
                    href={section.href}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3.5 transition-colors active:bg-secondary/50",
                      idx > 0 && "border-t border-border/30",
                    )}
                  >
                    <div className="flex size-8 items-center justify-center rounded-lg bg-secondary">
                      <Icon className="size-4 text-primary" />
                    </div>
                    <span className="flex-1 text-sm font-medium">
                      {t(lang, section.labelKey)}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground/40" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop: default to Account section ── */}
      <div className="hidden md:block">
        <SectionAccount user={user} onUserUpdate={handleUserUpdate} />
      </div>
    </>
  );
}
