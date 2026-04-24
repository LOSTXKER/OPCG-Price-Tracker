import { t, type Language } from "@/lib/i18n";
import { formatRelativeAgo } from "@/lib/utils/relative-time";
import type {
  ProfileSocialLinks,
  SellerStats,
} from "@/lib/profile/load-public-profile";
import type { ProfileStats, ProfileUser } from "./types";

/* ────────────────────────────────────────────────────────────────────────── *
 * These are intentionally pure data builders (no JSX) so they can be unit
 * tested and memoised in the parent. JSX wrappers live in the consuming
 * components (ProfileHero, etc.).
 * ────────────────────────────────────────────────────────────────────────── */

export type HeroMetaItem =
  | { kind: "listings"; count: number }
  | { kind: "rating"; rating: number; reviewCount: number }
  | { kind: "reviews"; count: number }
  | { kind: "activity"; label: string; tone: "online" | "recent" | "stale" | "inactive" }
  | { kind: "joined"; label: string };

export type HeroMetaInput = {
  user: ProfileUser;
  stats: ProfileStats;
  sellerStats: SellerStats;
  joinedRelative: string;
  isOwner: boolean;
  lang: Language;
};

/** Build the "X listings · 4.9★ (12) · Active 2h ago · Joined 6mo" meta row. */
export function buildHeroMeta({
  user,
  stats,
  sellerStats,
  joinedRelative,
  isOwner,
  lang,
}: HeroMetaInput): HeroMetaItem[] {
  const out: HeroMetaItem[] = [];

  if (stats.listingCount > 0) {
    out.push({ kind: "listings", count: stats.listingCount });
  }

  if (user.sellerRating != null) {
    out.push({
      kind: "rating",
      rating: user.sellerRating,
      reviewCount: stats.reviewCount,
    });
  } else if (stats.reviewCount > 0) {
    out.push({ kind: "reviews", count: stats.reviewCount });
  }

  // Activity heat indicator. Skipped for owners (they already know) and for
  // brand-new accounts with no signal so they don't look "abandoned" before
  // they've had a chance to do anything.
  if (!isOwner && sellerStats.lastSeenAt) {
    const lastSeen = new Date(sellerStats.lastSeenAt);
    const diffMin = Math.max(
      0,
      Math.floor((Date.now() - lastSeen.getTime()) / 60000),
    );
    const diffDays = Math.floor(diffMin / (60 * 24));
    if (diffMin < 5) {
      out.push({ kind: "activity", label: t(lang, "activityOnlineNow"), tone: "online" });
    } else if (diffDays >= 30) {
      out.push({ kind: "activity", label: t(lang, "activityInactive"), tone: "inactive" });
    } else {
      const label = t(lang, "activityActiveAgo").replace(
        "{ago}",
        formatRelativeAgo(lastSeen, lang),
      );
      out.push({
        kind: "activity",
        label,
        tone: diffDays >= 7 ? "stale" : "recent",
      });
    }
  }

  out.push({ kind: "joined", label: joinedRelative });
  return out;
}

/* ── Trust chips ────────────────────────────────────────────────────────── */

export type TrustChip = {
  id: "response" | "deals";
  iconKind: "zap" | "check";
  label: string;
  tone: string;
};

export function buildTrustChips(
  sellerStats: SellerStats,
  lang: Language,
): TrustChip[] {
  const out: TrustChip[] = [];

  if (sellerStats.responseHours != null && sellerStats.responseHours <= 48) {
    const h = Math.max(1, Math.round(sellerStats.responseHours));
    const label =
      sellerStats.responseHours <= 1
        ? t(lang, "trustResponseFast")
        : t(lang, "trustResponseHours").replace("{h}", String(h));
    out.push({
      id: "response",
      iconKind: "zap",
      label,
      tone: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    });
  }

  if (sellerStats.completedDeals > 0) {
    out.push({
      id: "deals",
      iconKind: "check",
      label: t(lang, "trustCompletedDeals").replace(
        "{n}",
        String(sellerStats.completedDeals),
      ),
      tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    });
  }

  return out;
}

/* ── Social links ───────────────────────────────────────────────────────── */

export type SocialLinkDescriptor = {
  id: "line" | "ig" | "twitter" | "facebook";
  /** Short text label (LINE / IG / X / FB) shown inside the chip. */
  badge: string;
  /** Visible label after the badge — usually the handle. */
  label: string;
  /** External URL; null means clipboard-copy only (LINE IDs etc.). */
  href: string | null;
  /** Text written to clipboard when there's no href. */
  copyText?: string;
};

export function buildSocialLinks(
  socials: ProfileSocialLinks | null,
  lang: Language,
): SocialLinkDescriptor[] {
  const out: SocialLinkDescriptor[] = [];
  if (!socials) return out;

  if (socials.line) {
    out.push({
      id: "line",
      badge: "LINE",
      label: socials.line,
      href: null,
      copyText: socials.line,
    });
  }
  if (socials.ig) {
    const handle = socials.ig.replace(/^@/, "");
    out.push({
      id: "ig",
      badge: "IG",
      label: `@${handle}`,
      href: `https://instagram.com/${encodeURIComponent(handle)}`,
    });
  }
  if (socials.twitter) {
    const handle = socials.twitter.replace(/^@/, "");
    out.push({
      id: "twitter",
      badge: "X",
      label: `@${handle}`,
      href: `https://x.com/${encodeURIComponent(handle)}`,
    });
  }
  if (socials.facebook) {
    const v = socials.facebook;
    const href = v.startsWith("http")
      ? v
      : `https://facebook.com/${encodeURIComponent(v.replace(/^\//, ""))}`;
    out.push({
      id: "facebook",
      badge: "FB",
      label: t(lang, "socialFacebookLabel"),
      href,
    });
  }
  return out;
}
