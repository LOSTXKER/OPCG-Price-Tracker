"use client";

import {
  CheckCircle2,
  Clock,
  Info,
  MapPin,
  Truck,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatRelativeAgo } from "@/lib/utils/relative-time";
import type {
  CommerceProfile,
  SellerStats,
} from "@/lib/profile/load-public-profile";

/**
 * Visitor-only trust strip rendered between the hero and the reviews preview.
 *
 * Aggregates everything a TCG buyer wants to know on first scroll:
 *   1. Verified facts: verified badge, completed deals, response time, last
 *      seen
 *   2. Commerce profile: where they ship from + shipping methods. Payment is
 *      handled in-platform so we don't surface a payment row.
 *
 * For brand-new sellers (no completed deals AND no reviews) we render a
 * single quiet honesty notice instead of a row of empty chips — less
 * deceptive than padding with placeholders.
 *
 * Hidden entirely for the profile owner — they already see all this in
 * settings.
 */
export function ProfileTrustBlock({
  sellerStats,
  commerceProfile,
  reviewCount,
  isOwner,
  lang,
}: {
  sellerStats: SellerStats;
  commerceProfile: CommerceProfile;
  reviewCount: number;
  isOwner: boolean;
  lang: Language;
}) {
  if (isOwner) return null;

  const isBrandNew =
    sellerStats.completedDeals === 0 && reviewCount === 0;

  const verifiedFacts = buildVerifiedFacts(sellerStats, lang);
  const locationChip = buildLocationChip(commerceProfile, lang);
  const shippingChips = buildShippingChips(commerceProfile, lang);

  const hasCommerceContent =
    locationChip != null || shippingChips.length > 0;

  // Nothing to show + brand-new account → render only the honesty notice.
  // For an established seller with no commerce data set up yet (rare but
  // possible) we still render the verified-facts row.
  if (verifiedFacts.length === 0 && !hasCommerceContent && !isBrandNew) {
    return null;
  }

  return (
    <section
      aria-label={t(lang, "trustBlockTitle")}
      className={cn(
        // Quiet container — soft border + card surface so the chips group
        // visually without competing with the hero or reviews block.
        "mt-6 overflow-hidden rounded-2xl border border-border/50 bg-card/40",
        "px-4 py-4 sm:px-5",
      )}
    >
      {verifiedFacts.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {verifiedFacts.map((f) => (
            <FactItem key={f.id} icon={f.icon} tone={f.tone} label={f.label} />
          ))}
        </div>
      )}

      {hasCommerceContent && (
        <div
          className={cn(
            "grid gap-3 sm:grid-cols-2 sm:gap-x-6",
            verifiedFacts.length > 0 && "mt-4 border-t border-border/40 pt-3",
          )}
        >
          <CommerceRow
            label={t(lang, "commerceLocation")}
            icon={MapPin}
            chips={locationChip ? [locationChip] : []}
            emptyLabel={t(lang, "commerceLocationUnknown")}
          />
          <CommerceRow
            label={t(lang, "commerceShipping")}
            icon={Truck}
            chips={shippingChips}
            emptyLabel={t(lang, "commerceShippingUnknown")}
          />
        </div>
      )}

      {isBrandNew && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-3 gap-y-1 text-meta",
            (verifiedFacts.length > 0 || hasCommerceContent) &&
              "mt-3 border-t border-border/40 pt-3",
          )}
        >
          <Info className="size-3.5 text-muted-foreground/70" aria-hidden />
          <span>{t(lang, "newSellerNotice")}</span>
        </div>
      )}
    </section>
  );
}

/* ── Verified facts row ────────────────────────────────────────────────── */

type Fact = {
  id: string;
  icon: LucideIcon;
  label: string;
  tone: "verified" | "deals" | "response" | "neutral";
};

function buildVerifiedFacts(stats: SellerStats, lang: Language): Fact[] {
  const facts: Fact[] = [];

  if (stats.isVerified) {
    facts.push({
      id: "verified",
      icon: CheckCircle2,
      tone: "verified",
      label: t(lang, "trustVerifiedSeller"),
    });
  }

  if (stats.completedDeals > 0) {
    facts.push({
      id: "deals",
      icon: CheckCircle2,
      tone: "deals",
      label: t(lang, "trustDealsCompleted").replace(
        "{n}",
        String(stats.completedDeals),
      ),
    });
  }

  if (stats.responseHours != null && stats.responseHours <= 48) {
    const h = Math.max(1, Math.round(stats.responseHours));
    facts.push({
      id: "response",
      icon: Zap,
      tone: "response",
      label:
        stats.responseHours <= 1
          ? t(lang, "trustResponseFastShort")
          : t(lang, "trustResponseTime").replace("{h}", String(h)),
    });
  }

  if (stats.lastSeenAt) {
    const last = new Date(stats.lastSeenAt);
    const diffMs = Date.now() - last.getTime();
    // Only surface "last seen" when it's actually recent (≤30 days).
    // Beyond that the activity chip on the hero (or its absence) carries
    // the message — we don't want the trust block to broadcast staleness.
    if (diffMs <= 30 * 24 * 60 * 60 * 1000) {
      facts.push({
        id: "lastSeen",
        icon: Clock,
        tone: "neutral",
        label: t(lang, "trustLastSeen").replace(
          "{ago}",
          formatRelativeAgo(last, lang),
        ),
      });
    }
  }

  return facts;
}

function FactItem({
  icon: Icon,
  label,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  tone: Fact["tone"];
}) {
  const iconClass =
    tone === "verified"
      ? "text-sky-500"
      : tone === "deals"
        ? "text-emerald-500"
        : tone === "response"
          ? "text-amber-500"
          : "text-muted-foreground/80";
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80">
      <Icon className={cn("size-4 shrink-0", iconClass)} aria-hidden />
      {label}
    </span>
  );
}

/* ── Commerce row ──────────────────────────────────────────────────────── */

function CommerceRow({
  label,
  icon: Icon,
  chips,
  emptyLabel,
}: {
  label: string;
  icon: LucideIcon;
  chips: string[];
  emptyLabel: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-eyebrow">
        <Icon className="size-3 text-muted-foreground/70" aria-hidden />
        {label}
      </div>
      {chips.length === 0 ? (
        <p className="mt-1 text-sm text-muted-foreground/70">{emptyLabel}</p>
      ) : (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <span
              key={c}
              className="inline-flex items-center rounded-full bg-muted/60 px-2.5 py-0.5 text-micro text-foreground/80"
            >
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Chip builders ─────────────────────────────────────────────────────── */

function buildLocationChip(
  commerce: CommerceProfile,
  lang: Language,
): string | null {
  if (commerce.hasMultipleLocations) {
    // Even when multiple provinces are observed, prefer the primary location
    // since buyers care about "where will this ship from?". We append the
    // multi-location hint inline rather than replacing the value.
    return commerce.primaryLocation
      ? `${commerce.primaryLocation} +`
      : t(lang, "commerceMultipleProvinces");
  }
  return commerce.primaryLocation;
}

function buildShippingChips(
  commerce: CommerceProfile,
  _lang: Language,
): string[] {
  // `Listing.shipping[]` already stores user-facing labels (e.g. "EMS/Kerry",
  // "Pickup (นัดรับ)") so we render them verbatim — no code-to-label lookup
  // required.
  void _lang;
  return commerce.shippingMethods;
}
