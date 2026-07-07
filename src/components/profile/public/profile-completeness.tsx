"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  ImagePlus,
  Layers,
  Link as LinkIcon,
  Pencil,
  Tag,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ProfileSocialLinks } from "@/lib/profile/load-public-profile";

import type { ProfileStats, ProfileUser } from "./types";

const STORAGE_PREFIX = "profile-onboarding-dismissed-";

type Step = {
  key: "avatar" | "bio" | "handle" | "social" | "listing" | "card";
  done: boolean;
  label: string;
  href: string;
  icon: typeof Camera;
};

/**
 * Owner-only onboarding nudge. Renders directly under the hero (above the
 * stats strip) so a fresh seller's first instinct is "fill the gaps".
 *
 * Design choices:
 *   - Progress ring instead of a numeric percentage — feels less judgmental
 *   - Each undone step has its own one-tap CTA so the path forward is
 *     unambiguous
 *   - Dismissable per-user (localStorage); auto-hidden once 100% complete
 *   - Pure derivation from data we already loaded — no extra queries
 */
export function ProfileCompleteness({
  user,
  stats,
  socials,
  isOwner,
  lang,
}: {
  user: ProfileUser;
  stats: ProfileStats;
  socials: ProfileSocialLinks | null;
  isOwner: boolean;
  lang: Language;
}) {
  // Hydrate the dismissed flag from localStorage via useSyncExternalStore so
  // the SSR snapshot is stable (`false` everywhere) and the client picks up
  // the persisted value on first commit — no setState-in-effect dance.
  const storageKey = `${STORAGE_PREFIX}${user.id}`;
  const subscribe = useCallback(
    (cb: () => void) => {
      if (typeof window === "undefined") return () => {};
      const handler = (e: StorageEvent) => {
        if (e.key === storageKey) cb();
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    },
    [storageKey],
  );
  const dismissed = useSyncExternalStore(
    subscribe,
    () =>
      typeof window === "undefined"
        ? false
        : window.localStorage.getItem(storageKey) === "1",
    () => false,
  );

  const steps: Step[] = useMemo(() => {
    const hasSocial = !!(
      socials &&
      (socials.line || socials.ig || socials.twitter || socials.facebook)
    );
    return [
      {
        key: "avatar",
        done: !!user.avatarUrl,
        label: t(lang, "completenessAvatar"),
        href: "/settings/account",
        icon: Camera,
      },
      {
        key: "bio",
        done: !!user.bio && user.bio.trim().length >= 20,
        label: t(lang, "completenessBio"),
        href: "/settings/account",
        icon: Pencil,
      },
      {
        key: "handle",
        done: !!user.handle,
        label: t(lang, "completenessHandle"),
        href: "/settings/account",
        icon: Tag,
      },
      {
        key: "social",
        done: hasSocial,
        label: t(lang, "completenessSocial"),
        href: "/settings/account",
        icon: LinkIcon,
      },
      {
        key: "listing",
        done: stats.listingCount > 0,
        label: t(lang, "completenessListing"),
        href: "/marketplace/create",
        icon: ImagePlus,
      },
      {
        key: "card",
        done: stats.portfolioCardCount > 0,
        label: t(lang, "completenessCard"),
        href: "/portfolio",
        icon: Layers,
      },
    ];
  }, [user.avatarUrl, user.bio, user.handle, socials, stats.listingCount, stats.portfolioCardCount, lang]);

  const completed = steps.filter((s) => s.done).length;
  const totalSteps = steps.length;
  const pct = Math.round((completed / totalSteps) * 100);

  // Owner-only is enforced by parent but we double-check here.
  if (!isOwner) return null;
  if (dismissed) return null;
  if (completed === totalSteps) return null;

  const onDismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, "1");
      // useSyncExternalStore won't see same-tab writes via the storage
      // event, so nudge React with a fake event so the component
      // re-renders and unmounts itself.
      window.dispatchEvent(new StorageEvent("storage", { key: storageKey }));
    }
  };

  return (
    <Surface
      as="section"
      variant="outline"
      className={cn(
        // Quiet container — subtle border + plain card surface. The progress
        // ring already provides all the colour this block needs; piling a
        // gradient + heavier border on top just makes the page feel busier.
        "mt-6 overflow-hidden rounded-2xl bg-card/40",
      )}
      aria-label={t(lang, "completenessTitle")}
    >
      <div className="flex items-start gap-4 p-4 sm:p-5">
        <ProgressRing pct={pct} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-h5">{t(lang, "completenessTitle")}</h2>
              <p className="mt-0.5 text-meta">
                {t(lang, "completenessSubtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label={t(lang, "completenessDismiss")}
              className="tap-safe -mr-1 -mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
            {steps.map((s) => (
              <li key={s.key}>
                <Link
                  href={s.href}
                  className={cn(
                    "group/step flex items-center gap-2 rounded-md px-1.5 py-1 text-xs transition-colors",
                    s.done
                      ? "text-muted-foreground/70"
                      : "text-foreground/80 hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-4 shrink-0 items-center justify-center rounded-full",
                      s.done
                        ? "text-success"
                        : "text-primary/70",
                    )}
                  >
                    {s.done ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <s.icon className="size-3" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate",
                      s.done && "line-through decoration-muted-foreground/40",
                    )}
                  >
                    {s.label}
                  </span>
                  {!s.done && (
                    <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover/step:translate-x-0.5" />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* Mobile-only fast path for the next undone step */}
          <div className="mt-3 sm:hidden">
            {(() => {
              const next = steps.find((s) => !s.done);
              if (!next) return null;
              return (
                <Button size="sm" className="w-full gap-1.5" render={<Link href={next.href} />}>
                  {next.label}
                </Button>
              );
            })()}
          </div>
        </div>
      </div>
    </Surface>
  );
}

/**
 * Tiny SVG progress ring — pure CSS would have worked but the strokeDasharray
 * trick keeps it pixel-crisp at any size and respects `prefers-reduced-motion`
 * (we just don't animate at all here).
 */
function ProgressRing({ pct }: { pct: number }) {
  const radius = 23;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);
  return (
    <div className="relative grid size-12 shrink-0 place-items-center sm:size-14">
      <svg viewBox="0 0 56 56" className="size-full -rotate-90">
        <circle
          cx="28"
          cy="28"
          r={radius}
          strokeWidth="3"
          className="fill-none stroke-muted/60"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="fill-none stroke-primary transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute text-xs font-semibold tabular-nums">{pct}%</span>
    </div>
  );
}
