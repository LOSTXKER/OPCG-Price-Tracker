"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import {
  AtSign,
  Award,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getTierConfig } from "@/components/profile/profile-types";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { clientEnv } from "@/lib/env";
import { avatarGradient } from "@/lib/utils/avatar-gradient";
import type {
  ProfileAchievement,
  SellerStats,
} from "@/lib/profile/load-public-profile";

import { SocialLinkChip } from "./social-link-chip";
import type {
  HeroMetaItem,
  SocialLinkDescriptor,
} from "./hero-builders";
import type { ProfileUser } from "./types";

const HERO_ACHIEVEMENT_LIMIT = 5;
// Bumped to 280 chars / 4 lines: with `text-body` the bio reads larger and
// reaches the clamp boundary sooner. Giving it one extra line keeps the
// "Read more" affordance from triggering on every other profile.
const BIO_OVERFLOW_CHARS = 280;
const BIO_OVERFLOW_LINES = 4;

/**
 * Public profile hero — sits directly under the brand-warm cover banner.
 *
 * Twitter/Etsy-style layout:
 *   ┌── cover banner ──────────────────────────────────────────────┐
 *   └─────────────────────────────────────────────────────────────┘
 *     ┌────┐                                  [Message][Save][⋯]
 *     │ AV │  (overlaps cover by ~half)
 *     └────┘
 *     Name ✓
 *     @handle · activity dot
 *     bio…
 *     ⏱ joined  ·  ⚡ replies in 2h  ·  ✔ 12 deals
 *     [LINE] [IG] [X] [FB]
 *     🏆 🏆 🏆  +2 more
 *
 * Quantitative stats (listings count, rating numbers) are intentionally left
 * out of this section so it can stay calm and readable.
 */
export function ProfileHero({
  user,
  achievements,
  metaParts,
  socialLinks,
  joinedRelative,
  sellerStats,
  lang,
  actionsSlot,
}: {
  user: ProfileUser;
  sellerStats: SellerStats;
  achievements: ProfileAchievement[];
  metaParts: HeroMetaItem[];
  socialLinks: SocialLinkDescriptor[];
  joinedRelative: string;
  lang: Language;
  /** Right-aligned action cluster (Message / Save / Share / Edit / More). */
  actionsSlot: ReactNode;
}) {
  const tierCfg = getTierConfig(user.tier);
  const isPaidTier = tierCfg.label !== "Free";

  const [bioExpanded, setBioExpanded] = useState(false);
  const bioOverflows =
    (user.bio?.length ?? 0) > BIO_OVERFLOW_CHARS ||
    (user.bio ?? "").split("\n").length > BIO_OVERFLOW_LINES;

  const heroAchievements = achievements.slice(0, HERO_ACHIEVEMENT_LIMIT);

  // Pull just the activity signal out of the meta parts — this hero only
  // ever renders the activity line.
  const activityItem = metaParts.find((m) => m.kind === "activity");

  return (
    <section className="relative">
      {/* ── Top row: avatar (overlapping cover) + desktop actions ── */}
      <div className="flex items-end justify-between gap-3">
        <div className="relative">
          <Avatar
            className={cn(
              "-mt-12 size-24 shrink-0 ring-4 ring-background sm:-mt-14 sm:size-28 md:-mt-16 md:size-32",
            )}
          >
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback
              className={cn(
                "bg-gradient-to-br text-3xl font-bold text-white sm:text-4xl",
                avatarGradient(user.id),
              )}
            >
              {(user.displayName ?? "?").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {isPaidTier && (
            <span
              className={cn(
                "absolute -bottom-1 right-0 inline-flex items-center rounded-full px-2 py-0.5 text-overlay uppercase tracking-wider ring-2 ring-background",
                tierCfg.color,
              )}
              title={`${tierCfg.label} tier`}
            >
              {tierCfg.label}
            </span>
          )}
        </div>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          {actionsSlot}
        </div>
      </div>

      {/* ── Identity block (full-width below the avatar/actions row) ── */}
      <div className="mt-3 sm:mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="inline-flex items-center gap-2 break-words text-h1 font-extrabold">
            {user.displayName ?? "User"}
            {sellerStats.isVerified && (
              <span
                title={t(lang, "sellerVerified")}
                aria-label={t(lang, "sellerVerified")}
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-info text-info-foreground"
              >
                <CheckCircle2 className="size-4" />
              </span>
            )}
          </h1>
        </div>

        {(user.handle || activityItem) && (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-muted-foreground">
            {user.handle && (
              <HandleRow handle={user.handle} userId={user.id} lang={lang} />
            )}
            {activityItem && activityItem.kind === "activity" && (
              <ActivityPill
                label={activityItem.label}
                tone={activityItem.tone}
              />
            )}
          </div>
        )}

        {user.bio && (
          <div className="mt-3 max-w-2xl">
            <p
              className={cn(
                // Bumped from `text-sm` to `text-body` so the seller's voice
                // is the dominant typographic element in the hero — it's
                // the only piece of long-form copy on the page and used to
                // disappear under the surrounding meta rows.
                "whitespace-pre-line text-body leading-relaxed text-foreground/85",
                !bioExpanded && bioOverflows && "line-clamp-4",
              )}
            >
              {user.bio}
            </p>
            {bioOverflows && (
              <button
                type="button"
                onClick={() => setBioExpanded((v) => !v)}
                className="mt-1 text-xs font-semibold text-primary hover:underline"
              >
                {bioExpanded ? t(lang, "bioReadLess") : t(lang, "bioReadMore")}
              </button>
            )}
          </div>
        )}

        {/* Trust facts (response time, completed deals) used to live here.
            They moved into `ProfileTrustBlock` below the hero so the hero
            stays focused on identity. We keep just the "joined" chip here
            as a low-key recognition cue. */}
        <HeroFactsRow joinedRelative={joinedRelative} />

        {socialLinks.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {socialLinks.map((s) => (
              <SocialLinkChip key={s.id} link={s} lang={lang} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile actions row */}
      <div className="mt-4 flex flex-wrap items-center gap-2 sm:hidden">
        {actionsSlot}
      </div>

      {heroAchievements.length > 0 && (
        <AchievementStrip
          items={heroAchievements}
          totalCount={achievements.length}
          lang={lang}
        />
      )}
    </section>
  );
}

/* ── Sub-components ────────────────────────────────────────────────── */

function HandleRow({
  handle,
  userId,
  lang,
}: {
  handle: string;
  userId: string;
  lang: Language;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/@${handle}`
        : `${clientEnv().NEXT_PUBLIC_APP_URL}/@${handle}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success(t(lang, "shareLinkCopied"), { description: url });
    } catch {
      toast.error(t(lang, "shareCopyLink"));
    }
    void userId;
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-0.5">
        <AtSign className="size-3.5" />
        {handle}
      </span>
      <button
        type="button"
        onClick={onCopy}
        aria-label={t(lang, "shareCopyLink")}
        title={copied ? t(lang, "shareLinkCopied") : t(lang, "shareCopyLink")}
        className="tap-safe ease-chrome inline-flex size-6 items-center justify-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
      >
        {copied ? (
          <Check className="size-3.5 text-success" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
    </span>
  );
}

function ActivityPill({
  label,
  tone,
}: {
  label: string;
  tone: "online" | "recent" | "stale" | "inactive";
}) {
  const dotClass =
    tone === "online"
      ? "bg-success"
      : tone === "recent"
        ? "bg-success/70"
        : tone === "stale"
          ? "bg-warning"
          : "bg-muted-foreground/40";
  return (
    <span className="inline-flex items-center gap-1.5 text-meta">
      <span aria-hidden className={cn("size-1.5 rounded-full", dotClass)} />
      {label}
    </span>
  );
}

/**
 * Quiet "joined Jan 2024" recognition cue under the bio. Trust signals
 * (response time, deals, verified badge) live in `ProfileTrustBlock`
 * directly below the hero, so this row intentionally stays as a single
 * fact — too few items to bother with `·` separators or a wrapper-with-
 * Fragment dance.
 */
function HeroFactsRow({ joinedRelative }: { joinedRelative: string }) {
  return (
    <div className="mt-2 inline-flex items-center gap-1.5 text-meta">
      <CalendarDays className="size-3.5 text-muted-foreground/80" aria-hidden />
      {joinedRelative}
    </div>
  );
}

function AchievementStrip({
  items,
  totalCount,
  lang,
}: {
  items: ProfileAchievement[];
  totalCount: number;
  lang: Language;
}) {
  const remaining = Math.max(0, totalCount - items.length);
  return (
    <div
      className={cn(
        "mt-3 flex items-center gap-1.5 overflow-x-auto pb-1",
        "scrollbar-none",
      )}
      aria-label={t(lang, "achievementsTitle")}
    >
      {items.map((a) => (
        <div
          key={a.code}
          title={a.nameEn ?? a.name}
          className={cn(
            "group/ach flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/5 px-2 py-1",
            "ease-chrome transition-colors hover:border-amber-400/60 hover:bg-amber-500/10",
          )}
        >
          <div className="relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background">
            {a.badgeImageUrl ? (
              <Image
                src={a.badgeImageUrl}
                alt=""
                width={24}
                height={24}
                unoptimized
                className="size-full object-contain"
              />
            ) : (
              <Award className="size-3.5 text-amber-500" />
            )}
          </div>
          <span className="max-w-[9rem] truncate text-micro text-foreground/85">
            {a.nameEn ?? a.name}
          </span>
        </div>
      ))}
      {remaining > 0 && (
        <span className="shrink-0 rounded-full border border-dashed border-hair bg-background px-2 py-1 text-micro text-muted-foreground">
          +{remaining}
        </span>
      )}
    </div>
  );
}
