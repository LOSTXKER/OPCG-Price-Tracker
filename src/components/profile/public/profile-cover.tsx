"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";
import { avatarGradient } from "@/lib/utils/avatar-gradient";

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
  const gradient = avatarGradient(userId);

  return (
    <div
      className={cn(
        "relative isolate w-full overflow-hidden",
        // Premium banner proportions — tall enough to feel like a hero, not
        // a thin strip, but never large enough to push everything below the
        // fold on mobile.
        "h-32 sm:h-44 md:h-56",
        "rounded-b-2xl sm:rounded-b-3xl",
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
