"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Brand-warm cover palettes — curated to live inside the Meecard
 * brown/cream/amber world rather than the generic rainbow that
 * `avatarGradient` uses for the avatar fallback. Every option is a soft
 * warm gradient pair (rose/copper/mocha/honey/sand/amber) that handshakes
 * with the `--primary: #73533E` accent below. Deterministic by userId so
 * each profile still gets its own personality, but kept at low saturation
 * (200-tier) so the banner reads as background atmosphere rather than a
 * loud feature wall.
 */
const COVER_PALETTES = [
  "from-amber-200/80 via-orange-200/70 to-rose-200/70",
  "from-orange-200/80 via-amber-100/70 to-yellow-100/70",
  "from-rose-200/80 via-orange-100/70 to-amber-100/70",
  "from-amber-200/80 via-orange-200/60 to-amber-100/70",
  "from-yellow-200/80 via-amber-200/70 to-orange-200/70",
  "from-orange-200/80 via-amber-200/60 to-rose-100/70",
  "from-amber-100/80 via-orange-100/70 to-rose-200/70",
  "from-rose-100/80 via-amber-100/70 to-yellow-100/70",
] as const;

function coverGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return COVER_PALETTES[Math.abs(h) % COVER_PALETTES.length];
}

/**
 * Cover banner that lives at the top of the public profile page.
 *
 * - When `coverImageUrl` is provided we render the user-uploaded photo with
 *   `next/image` (Supabase storage origin allowlisted in next.config). We
 *   keep two extra overlays (a soft dark gradient at the bottom for legibility
 *   of any text floated on top, and a brand-warm tint) so different cover
 *   photos still land inside our visual language instead of looking like a
 *   pasted screenshot.
 * - When the user hasn't uploaded a cover, we fall back to a deterministic
 *   warm gradient seeded by `userId`, so every profile has its own banner
 *   without an upload step.
 *
 * The banner is rendered full-bleed inside its parent container — the parent
 * is responsible for the negative inset (`-mx-4`/`-mx-6`) so the cover hugs
 * the viewport edge while content stays comfortably padded.
 */
export function ProfileCover({
  userId,
  coverImageUrl,
  className,
}: {
  userId: string;
  coverImageUrl?: string | null;
  className?: string;
}) {
  const gradient = coverGradient(userId);
  const hasPhoto = !!coverImageUrl;

  return (
    <div
      className={cn(
        "relative isolate w-full overflow-hidden",
        // Photo banner can afford a touch more vertical room; the gradient
        // fallback stays tight so it reads as atmospheric, not heroic.
        hasPhoto ? "h-32 sm:h-44 md:h-56" : "h-24 sm:h-32 md:h-40",
        "rounded-2xl sm:rounded-3xl",
        className,
      )}
      aria-hidden
    >
      {hasPhoto ? (
        <>
          <Image
            src={coverImageUrl as string}
            alt=""
            fill
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="object-cover"
            priority={false}
          />
          {/* Subtle warm tint so a wide variety of uploaded photos still feel
              "ours" — keeps the page from drifting into Twitter-banner land. */}
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-25 mix-blend-soft-light",
              gradient,
            )}
          />
          {/* Bottom fade for legibility of avatar/name that overlap the cover. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/85 via-background/15 to-transparent" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-card" />
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-90",
              "mix-blend-multiply dark:mix-blend-screen dark:opacity-60",
              gradient,
            )}
          />
          <div
            className="absolute inset-0 opacity-50 mix-blend-screen"
            style={{
              backgroundImage:
                "radial-gradient(70% 90% at 20% 10%, rgba(255,255,255,0.35), transparent 65%)",
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
        </>
      )}
    </div>
  );
}
