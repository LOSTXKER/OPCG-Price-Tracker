"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Brand-warm flat cover colours. They stay deterministic by userId so each
 * profile keeps some personality without introducing decorative effects.
 */
const COVER_COLORS = [
  "bg-amber-100 dark:bg-amber-950",
  "bg-orange-100 dark:bg-orange-950",
  "bg-rose-100 dark:bg-rose-950",
  "bg-yellow-100 dark:bg-yellow-950",
] as const;

function coverColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return COVER_COLORS[Math.abs(h) % COVER_COLORS.length];
}

/**
 * Cover banner that lives at the top of the public profile page.
 *
 * - When `coverImageUrl` is provided we render the user-uploaded photo with
 *   `next/image` (Supabase storage origin allowlisted in next.config).
 * - Without an upload, a deterministic warm flat colour keeps the banner
 *   distinct without adding visual noise.
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
  const color = coverColor(userId);
  const hasPhoto = !!coverImageUrl;

  return (
    <div
      className={cn(
        "relative isolate w-full overflow-hidden",
        // Photo banner can afford a touch more vertical room; the colour
        // fallback stays tight so it reads as atmospheric, not heroic.
        hasPhoto ? "h-32 sm:h-44 md:h-56" : "h-24 sm:h-32 md:h-40",
        "rounded-2xl sm:rounded-3xl",
        !hasPhoto && color,
        className,
      )}
      aria-hidden
    >
      {hasPhoto && (
        <Image
          src={coverImageUrl as string}
          alt=""
          fill
          sizes="(min-width: 1024px) 1024px, 100vw"
          className="object-cover"
        />
      )}
    </div>
  );
}
