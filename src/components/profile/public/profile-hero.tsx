"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import {
  AtSign,
  Award,
  Check,
  CheckCircle2,
  Copy,
  Star,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getTierConfig } from "@/components/profile/profile-types";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { avatarGradient } from "@/lib/utils/avatar-gradient";
import type {
  ProfileAchievement,
  SellerStats,
} from "@/lib/profile/load-public-profile";

import { SocialLinkChip } from "./social-link-chip";
import type {
  HeroMetaItem,
  SocialLinkDescriptor,
  TrustChip,
} from "./hero-builders";
import type { ProfileStats, ProfileUser } from "./types";

const HERO_ACHIEVEMENT_LIMIT = 5;
const BIO_OVERFLOW_CHARS = 220;
const BIO_OVERFLOW_LINES = 3;

/**
 * Top of the public profile page. Sits underneath the cover banner with the
 * avatar overlapping the cover (Twitter / IG convention) so the page reads
 * "person first, content second" rather than "table of stats".
 *
 * Layout summary (desktop ≥sm):
 *
 *   ┌─ Avatar (overlap)  Name ✓ [Pro]   ┃                Actions ┐
 *   │                    @handle [copy]  ┃                        │
 *   │                    bio (full row)  ┃                        │
 *   │                    [trust chips]   ┃                        │
 *   │                    [socials]       ┃                        │
 *   │                    [meta · row]    ┃                        │
 *   ├─ Achievement strip (full width, larger icons) ──────────────┤
 *
 * On mobile actions wrap below the avatar and the achievement strip becomes
 * horizontally scrollable.
 */
export function ProfileHero({
  user,
  stats,
  sellerStats,
  achievements,
  metaParts,
  trustChips,
  socialLinks,
  isOwner,
  lang,
  actionsSlot,
}: {
  user: ProfileUser;
  stats: ProfileStats;
  sellerStats: SellerStats;
  achievements: ProfileAchievement[];
  metaParts: HeroMetaItem[];
  trustChips: TrustChip[];
  socialLinks: SocialLinkDescriptor[];
  isOwner: boolean;
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

  return (
    <div className="relative">
      {/* ── Top row: avatar (overlapping cover) + actions ───────────── */}
      <div className="flex items-end justify-between gap-3">
        <div className="relative">
          <Avatar
            className={cn(
              // Negative margin pulls the avatar up so it overlaps the
              // cover by ~half its height — same trick Twitter / Etsy use.
              "-mt-12 size-24 shrink-0 ring-4 ring-background sm:-mt-16 sm:size-28 md:-mt-20 md:size-32",
              "shadow-lg",
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

          {/* Tier label chip — replaces the colour-only ring with an
              actually-readable badge (visitors don't memorise our tier
              colours). Floats over the bottom-right of the avatar. */}
          {isPaidTier && (
            <span
              className={cn(
                "absolute -bottom-1 right-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-md ring-2 ring-background",
                tierCfg.color,
              )}
              title={`${tierCfg.label} tier`}
            >
              {tierCfg.label}
            </span>
          )}
        </div>

        {/* Actions — desktop renders inline, mobile pushes them onto a
            second row below the bio (handled by sibling div). */}
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          {actionsSlot}
        </div>
      </div>

      {/* ── Identity block ───────────────────────────────────────────── */}
      <div className="mt-3 sm:mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="inline-flex items-center gap-2 break-words text-2xl font-extrabold tracking-tight sm:text-3xl">
            {user.displayName ?? "User"}
            {sellerStats.isVerified && (
              <span
                title={t(lang, "sellerVerified")}
                aria-label={t(lang, "sellerVerified")}
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm"
              >
                <CheckCircle2 className="size-4" />
              </span>
            )}
          </h1>
        </div>

        {user.handle && (
          <HandleRow handle={user.handle} userId={user.id} lang={lang} />
        )}

        {/* Bio — full width row so longer text breathes. Auto-expands once
            the visitor opts in via "Read more". */}
        {user.bio && (
          <div className="mt-2 max-w-2xl">
            <p
              className={cn(
                "whitespace-pre-line text-sm leading-relaxed text-foreground/80 sm:text-[0.95rem]",
                !bioExpanded && bioOverflows && "line-clamp-3",
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

        {/* Trust chips — visitors only. */}
        {!isOwner && trustChips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {trustChips.map((c) => (
              <span
                key={c.id}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  c.tone,
                )}
              >
                {c.iconKind === "zap" ? (
                  <Zap className="size-3.5" />
                ) : (
                  <CheckCircle2 className="size-3.5" />
                )}
                {c.label}
              </span>
            ))}
          </div>
        )}

        {socialLinks.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {socialLinks.map((s) => (
              <SocialLinkChip key={s.id} link={s} lang={lang} />
            ))}
          </div>
        )}

        <HeroMetaRow items={metaParts} stats={stats} lang={lang} />
      </div>

      {/* ── Mobile actions row ──────────────────────────────────────── */}
      <div className="mt-4 flex flex-wrap items-center gap-2 sm:hidden">
        {actionsSlot}
      </div>

      {/* ── Achievement showcase strip ──────────────────────────────── */}
      {heroAchievements.length > 0 && (
        <AchievementStrip items={heroAchievements} totalCount={achievements.length} lang={lang} />
      )}
    </div>
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
        : `https://meecard.com/@${handle}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success(t(lang, "shareLinkCopied"), { description: url });
    } catch {
      toast.error(t(lang, "shareCopyLink"));
    }
    // Touch userId to avoid lint warning when DEBUG noise gets stripped.
    void userId;
  };

  return (
    <div className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
      <span className="inline-flex items-center gap-0.5">
        <AtSign className="size-3.5" />
        {handle}
      </span>
      <button
        type="button"
        onClick={onCopy}
        aria-label={t(lang, "shareCopyLink")}
        title={copied ? t(lang, "shareLinkCopied") : t(lang, "shareCopyLink")}
        className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
      >
        {copied ? (
          <Check className="size-3.5 text-emerald-500" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
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
        "mt-5 -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0",
        "scrollbar-none",
      )}
      aria-label={t(lang, "achievementsTitle")}
    >
      {items.map((a) => (
        <div
          key={a.code}
          title={a.nameEn ?? a.name}
          className={cn(
            "group/ach flex shrink-0 items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/5 px-3 py-1.5",
            "transition-colors hover:border-amber-400/60 hover:bg-amber-500/10",
          )}
        >
          <div className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background shadow-inner">
            {a.badgeImageUrl ? (
              <Image
                src={a.badgeImageUrl}
                alt=""
                width={28}
                height={28}
                unoptimized
                className="size-full object-contain"
              />
            ) : (
              <Award className="size-4 text-amber-500" />
            )}
          </div>
          <span className="max-w-[10rem] truncate text-xs font-semibold text-foreground/85">
            {a.nameEn ?? a.name}
          </span>
        </div>
      ))}
      {remaining > 0 && (
        <span className="shrink-0 rounded-full border border-dashed border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
          +{remaining}
        </span>
      )}
    </div>
  );
}

function HeroMetaRow({
  items,
  stats,
  lang,
}: {
  items: HeroMetaItem[];
  stats: ProfileStats;
  lang: Language;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      {items.map((item, i) => (
        <span key={metaKey(item)} className="inline-flex items-center gap-2">
          {i > 0 && <span aria-hidden className="text-muted-foreground/40">·</span>}
          <HeroMetaCell item={item} stats={stats} lang={lang} />
        </span>
      ))}
    </div>
  );
}

function metaKey(item: HeroMetaItem): string {
  return item.kind;
}

function HeroMetaCell({
  item,
  stats,
  lang,
}: {
  item: HeroMetaItem;
  stats: ProfileStats;
  lang: Language;
}) {
  switch (item.kind) {
    case "listings":
      return (
        <span className="font-medium text-foreground/80">
          <span className="tabular-nums">{item.count}</span>{" "}
          <span className="font-normal text-muted-foreground/80">
            {t(lang, "tabListings").toLowerCase()}
          </span>
        </span>
      );
    case "rating":
      return (
        <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
          <Star className="size-3 fill-amber-400 text-amber-400" />
          <span className="tabular-nums">{item.rating.toFixed(1)}</span>
          {stats.reviewCount > 0 && (
            <span className="text-muted-foreground/70">({stats.reviewCount})</span>
          )}
        </span>
      );
    case "reviews":
      return (
        <span className="font-medium text-foreground/80">
          <span className="tabular-nums">{item.count}</span>{" "}
          <span className="font-normal text-muted-foreground/80">
            {t(lang, "tabReviews").toLowerCase()}
          </span>
        </span>
      );
    case "activity": {
      const dotClass =
        item.tone === "online"
          ? "bg-emerald-500"
          : item.tone === "recent"
            ? "bg-emerald-500/70"
            : item.tone === "stale"
              ? "bg-amber-500"
              : "bg-muted-foreground/40";
      return (
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className={cn("size-1.5 rounded-full", dotClass)} />
          <span>{item.label}</span>
        </span>
      );
    }
    case "joined":
      return <span>{item.label}</span>;
  }
}
