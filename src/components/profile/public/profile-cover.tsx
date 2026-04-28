"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Brand-warm cover palettes — curated to live inside the Meecard
 * brown/cream/amber world rather than the generic rainbow that
 * `avatarGradient` uses for the avatar fallback. Every option is a warm
 * gradient pair (rose/copper/mocha/honey/sand/amber) that handshakes with
 * the `--primary: #73533E` accent below. Deterministic by userId so each
 * profile still gets its own personality.
 */
const COVER_PALETTES = [
  "from-amber-300 via-orange-300 to-rose-300",
  "from-orange-300 via-amber-200 to-yellow-200",
  "from-rose-300 via-orange-200 to-amber-200",
  "from-amber-400 via-orange-300 to-amber-200",
  "from-yellow-300 via-amber-300 to-orange-300",
  "from-orange-400 via-amber-300 to-rose-200",
  "from-amber-200 via-orange-200 to-rose-300",
  "from-rose-200 via-amber-200 to-yellow-200",
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
 * v1 design intentionally avoids any DB schema change:
 *   - default look is a deterministic gradient + radial blobs derived from
 *     `userId` (reusing `avatarGradient`) so every profile already feels
 *     bespoke without an upload step
 *   - if `coverImageUrl` is provided we render that instead, with a soft
 *     bottom-fade so the avatar / hero stay readable
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

  return (
    <div
      className={cn(
        "relative isolate w-full overflow-hidden",
        // Slightly tighter than v1 (was h-32/h-44/h-56) — gives the page
        // colour and energy without taking over the fold.
        "h-28 sm:h-36 md:h-44",
        "rounded-2xl sm:rounded-3xl",
        className,
      )}
      aria-hidden={!coverImageUrl}
    >
      {coverImageUrl ? (
        <>
          <Image
            src={coverImageUrl}
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
          {/* Soft bottom fade so the avatar / displayName remain legible
              regardless of the photo's contrast. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/60 via-background/0 to-background/0" />
        </>
      ) : (
        <>
          {/* Layer 1 — base gradient derived from userId */}
          <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)} />
          {/* Layer 2 — soft radial highlights to mimic a textured banner */}
          <div
            className="absolute inset-0 opacity-70 mix-blend-screen"
            style={{
              backgroundImage:
                "radial-gradient(60% 80% at 15% 15%, rgba(255,255,255,0.45), transparent 60%), radial-gradient(50% 70% at 85% 30%, rgba(255,255,255,0.25), transparent 65%)",
            }}
          />
          {/* Layer 3 — subtle SVG noise so the gradient doesn't read as flat */}
          <div
            className="absolute inset-0 opacity-[0.18] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='5'/><feColorMatrix type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
              backgroundSize: "240px 240px",
            }}
          />
          {/* Layer 4 — bottom fade into page bg for clean handoff to hero */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent" />
        </>
      )}
    </div>
  );
}
